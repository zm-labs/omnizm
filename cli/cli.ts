#!/usr/bin/env node
import {
  intro,
  outro,
  text,
  select,
  multiselect,
  isCancel,
  cancel,
  spinner,
} from '@clack/prompts';
import color from 'picocolors';
import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Type definitions
interface ComponentFile {
  name: string;
  content: string;
}

interface Component {
  files: ComponentFile[];
  dependencies: string[];
}

interface Components {
  [key: string]: Component;
}

const CONFIG_FILE = 'components.yml';

// Available stacks
const SUPPORTED_STACKS = [
  { value: 'nextjs', label: 'Next.js', hint: 'React framework by Vercel' },
  { value: 'svelte', label: 'SvelteKit', hint: 'Svelte meta-framework' },
  { value: 'remix', label: 'Remix', hint: 'Full stack React framework' },
  { value: 'astro', label: 'Astro', hint: 'Static site builder' },
] as { value: string; label: string; hint?: string }[];

type Stack = (typeof SUPPORTED_STACKS)[number]['value'];

const getDefaultConfig = (stack: Stack) => `# UI Component Configuration
stack: ${stack}
style: default
tailwind:
  config: tailwind.config.js
  css: src/styles/globals.css
aliases:
  components: src/components
  utils: src/lib/utils
`;

async function exists(filepath: string): Promise<boolean> {
  try {
    await readFile(filepath);
    return true;
  } catch {
    return false;
  }
}

async function listAvailableComponents(): Promise<string[]> {
  try {
    const uiPath = path.join(process.cwd(), 'ui');
    const files = await readdir(uiPath);
    return files
      .filter(file => file.endsWith('.tsx'))
      .map(file => file.replace('.tsx', ''));
  } catch (error) {
    throw new Error('Unable to read UI components directory');
  }
}

async function readComponentFromUI(componentName: string): Promise<Component> {
  try {
    const componentPath = path.join(process.cwd(), 'ui', `${componentName}.tsx`);
    
    if (!await exists(componentPath)) {
      throw new Error(`Component file not found at ${componentPath}`);
    }

    const content = await readFile(componentPath, 'utf-8');
    
    // Default dependencies
    const dependencies = ['class-variance-authority', 'tailwind-merge', 'clsx'];
    
    // Check for specific component dependencies
    if (componentName.toLowerCase() === 'button') {
      dependencies.push(
        '@radix-ui/react-slot'
      );
    }

    return {
      files: [{
        name: `${componentName}.tsx`,
        content: content
      }],
      dependencies
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read component ${componentName}: ${error.message}`);
    }
    throw error;
  }
}

async function init(): Promise<void> {
  intro(color.bgCyan(` omnizm - UI Component CLI `));
  console.log('Prompting for stack selection...');
  
  const selectedStack = await select({
    message: 'Choose your framework:',
    options: [...SUPPORTED_STACKS],
  });
  
  if (isCancel(selectedStack)) {
    cancel('Operation cancelled');
    process.exit(1);
  }

  const s = spinner();
  s.start('Creating components.yml');

  try {
    const configExists = await exists(CONFIG_FILE);
    if (configExists) {
      s.stop('components.yml already exists');
      return;
    }

    await writeFile(CONFIG_FILE, getDefaultConfig(selectedStack as Stack));
    s.stop('Created components.yml');
  } catch (error) {
    s.stop('Failed to create components.yml');
    cancel('An error occurred during initialization');
    process.exit(1);
  }

  outro(
    `Installation complete! Stack selected: ${color.cyan(selectedStack as Stack)}\nYou can now start adding components with ${color.green('`npx omnizm add`')} or ${color.green('`npx omnizm add <component-name>`')}`
  );
}

async function detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
  try {
    if (await exists('yarn.lock')) {
      return 'yarn';
    }
    if (await exists('pnpm-lock.yaml')) {
      return 'pnpm';
    }
    return 'npm';
  } catch {
    return 'npm';
  }
}

async function installDependencies(dependencies: string[]): Promise<void> {
  if (dependencies.length === 0) return;

  const packageManager = await detectPackageManager();
  const installCommand = {
    npm: `npm install --save ${dependencies.join(' ')}`,
    yarn: `yarn add ${dependencies.join(' ')}`,
    pnpm: `pnpm add ${dependencies.join(' ')}`
  }[packageManager];

  try {
    execSync(installCommand, { stdio: 'inherit' });
  } catch (error) {
    throw new Error(`Failed to install dependencies using ${packageManager}`);
  }
}
async function installComponents(components: string[]): Promise<void> {
  const mainSpinner = spinner();
  mainSpinner.start('Preparing to install components');

  try {
    const availableComponents = await listAvailableComponents();
    const invalidComponents = components.filter(comp => !availableComponents.includes(comp));
    
    if (invalidComponents.length > 0) {
      mainSpinner.stop('Invalid components detected');
      console.log(color.red('\nThe following components are not available:'));
      invalidComponents.forEach(comp => console.log(`- ${comp}`));
      console.log('\nAvailable components:');
      availableComponents.forEach(comp => console.log(`- ${color.cyan(comp)}`));
      process.exit(1);
    }

    const componentDir = path.join(process.cwd(), 'components', 'ui');
    await mkdir(componentDir, { recursive: true });

    const allDependencies = new Set<string>();
    const radixDependencies = new Set<string>();

    // Collect dependencies
    mainSpinner.message('Analyzing component dependencies');
    for (const componentName of components) {
      const component = await readComponentFromUI(componentName);
      component.dependencies.forEach(dep => allDependencies.add(dep));
      
      if (componentName.toLowerCase() === 'button') {
        radixDependencies.add('@radix-ui/react-slot');
      }
    }

    // Install dependencies
    if (allDependencies.size > 0) {
      mainSpinner.message('Installing shared dependencies');
      await installDependencies([...allDependencies]);
    }

    if (radixDependencies.size > 0) {
      mainSpinner.message('Installing Radix UI dependencies');
      await installDependencies([...radixDependencies]);
    }

    // Copy components
    mainSpinner.message('Installing components');
    const installedComponents: string[] = [];
    const failedComponents: string[] = [];

    for (const componentName of components) {
      try {
        const component = await readComponentFromUI(componentName);
        for (const file of component.files) {
          const filepath = path.join(componentDir, file.name);
          await writeFile(filepath, file.content);
        }
        installedComponents.push(componentName);
      } catch (error) {
        failedComponents.push(componentName);
        if (error instanceof Error) {
          console.log(color.yellow(`\nWarning: Failed to add ${componentName}`));
          console.log(color.dim(error.message));
        }
      }
    }

    mainSpinner.stop('Component installation completed');

    // Show summary
    if (installedComponents.length > 0) {
      console.log(color.green('\nSuccessfully installed components:'));
      installedComponents.forEach(comp => console.log(`- ${color.cyan(comp)}`));
    }

    if (failedComponents.length > 0) {
      console.log(color.yellow('\nFailed to install components:'));
      failedComponents.forEach(comp => console.log(`- ${color.red(comp)}`));
    }

    if (allDependencies.size > 0) {
      console.log(
        '\n' + color.yellow('Installed dependencies:'),
        '\n' + Array.from(allDependencies).map(dep => `- ${dep}`).join('\n')
      );
    }

    if (radixDependencies.size > 0) {
      console.log(
        '\n' + color.green('Installed Radix UI packages:'),
        '\n' + Array.from(radixDependencies).map(dep => `- ${dep}`).join('\n')
      );
    }

  } catch (error) {
    mainSpinner.stop('Installation failed');
    if (error instanceof Error) {
      cancel(error.message);
    } else {
      cancel('An unexpected error occurred');
    }
    process.exit(1);
  }
}

async function add(components?: string[]): Promise<void> {
  intro(color.bgCyan(` omnizm - Add Components `));

  if (components && components.length > 0) {
    // Direct installation mode
    await installComponents(components);
    outro('Component installation completed successfully!');
    return;
  }

  // Interactive mode
  const s = spinner();
  s.start('Loading available components');

  try {
    const availableComponents = await listAvailableComponents();
    s.stop('Components loaded');

    if (availableComponents.length === 0) {
      cancel('No components found in the ui directory');
      process.exit(1);
    }

    const componentOptions = availableComponents.map(comp => ({
      value: comp,
      label: color.cyan(comp),
      hint: `ui/${comp}.tsx`
    }));

    const selectedComponents = await multiselect({
      message: 'Select components to add (Space to select, Enter to confirm):',
      options: componentOptions,
      required: true,
      cursorAt: componentOptions[0].value
    });

    if (isCancel(selectedComponents)) {
      cancel('Operation cancelled');
      process.exit(1);
    }

    await installComponents(selectedComponents as string[]);
    outro('Component installation completed successfully!');
  } catch (error) {
    if (error instanceof Error) {
      cancel(error.message);
    } else {
      cancel('An unexpected error occurred');
    }
    process.exit(1);
  }
}

// Main CLI logic
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    await init();
    break;
  case 'add':
    const components = args.slice(1);
    await add(components);
    break;
  default:
    cancel('Unknown command. Use `init` or `add [component-name]`');
    process.exit(1);
}
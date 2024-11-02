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
    `Installation complete! Stack selected: ${color.cyan(selectedStack as Stack)}\nYou can now start adding components with ${color.green('`npx omnizm add`')}`
  );
}

async function detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
  try {
    // Check for yarn.lock first
    if (await exists('yarn.lock')) {
      return 'yarn';
    }
    // Check for pnpm-lock.yaml
    if (await exists('pnpm-lock.yaml')) {
      return 'pnpm';
    }
    // Default to npm
    return 'npm';
  } catch {
    return 'npm';
  }
}

async function installDependencies(dependencies: string[]): Promise<void> {
  if (dependencies.length === 0) return;

  const packageManager = await detectPackageManager();
  const s = spinner();
  s.start(`Installing dependencies using ${packageManager}...`);

  const installCommand = {
    npm: `npm install --save ${dependencies.join(' ')}`,
    yarn: `yarn add ${dependencies.join(' ')}`,
    pnpm: `pnpm add ${dependencies.join(' ')}`
  }[packageManager];

  try {
    execSync(installCommand, { stdio: 'inherit' });
    s.stop('Dependencies installed successfully');
  } catch (error) {
    s.stop('Failed to install dependencies');
    throw new Error(`Failed to install dependencies using ${packageManager}`);
  }
}


async function add(): Promise<void> {
  intro(color.bgCyan(` omnizm - Add Components `));

  const s = spinner();
  s.start('Loading available components');

  try {
    const components = await listAvailableComponents();
    s.stop('Components loaded');

    if (components.length === 0) {
      cancel('No components found in the ui directory');
      process.exit(1);
    }

    const componentOptions = components.map(comp => ({
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

    const componentDir = path.join(process.cwd(), 'components', 'ui');
    await mkdir(componentDir, { recursive: true });

    const allDependencies = new Set<string>();
    const radixDependencies = new Set<string>();

    // First pass: Collect all dependencies
    s.start('Analyzing component dependencies');
    for (const componentName of selectedComponents) {
      const component = await readComponentFromUI(componentName as string);
      component.dependencies.forEach(dep => allDependencies.add(dep));
      
      if (componentName.toString().toLowerCase() === 'button') {
        radixDependencies.add('@radix-ui/react-slot');
      }
    }
    s.stop('Dependencies analyzed');

    // Install all dependencies first
    if (allDependencies.size > 0) {
      s.start('Installing shared dependencies');
      try {
        await installDependencies([...allDependencies]);
        s.stop('Shared dependencies installed');
      } catch (error) {
        s.stop('Failed to install shared dependencies');
        console.log(color.yellow('\nWarning: Failed to install dependencies'));
        if (error instanceof Error) {
          console.log(color.dim(error.message));
        }
      }
    }

    // Install Radix dependencies if needed
    if (radixDependencies.size > 0) {
      s.start('Installing Radix UI dependencies');
      try {
        await installDependencies([...radixDependencies]);
        s.stop('Radix UI dependencies installed');
      } catch (error) {
        s.stop('Failed to install Radix UI dependencies');
        console.log(color.yellow('\nWarning: Failed to install Radix UI dependencies'));
        if (error instanceof Error) {
          console.log(color.dim(error.message));
        }
      }
    }

    // Second pass: Copy component files
    s.start('Copying component files');
    const installedComponents: string[] = [];
    const failedComponents: string[] = [];

    for (const componentName of selectedComponents) {
      try {
        const component = await readComponentFromUI(componentName as string);
        for (const file of component.files) {
          const filepath = path.join(componentDir, file.name);
          await writeFile(filepath, file.content);
        }
        installedComponents.push(componentName as string);
      } catch (error) {
        failedComponents.push(componentName as string);
        if (error instanceof Error) {
          console.log(color.yellow(`\nWarning: Failed to add ${componentName}`));
          console.log(color.dim(error.message));
        }
      }
    }
    s.stop('Component files copied');

    // Show installation summary
    if (installedComponents.length > 0) {
      console.log(color.green('\nSuccessfully installed components:'));
      installedComponents.forEach(comp => {
        console.log(`- ${color.cyan(comp)}`);
      });
    }

    if (failedComponents.length > 0) {
      console.log(color.yellow('\nFailed to install components:'));
      failedComponents.forEach(comp => {
        console.log(`- ${color.red(comp)}`);
      });
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

    outro('Component installation completed successfully!');
  } catch (error) {
    s.stop('Failed to add components');
    if (error instanceof Error) {
      cancel(error.message);
    } else {
      cancel('An unexpected error occurred');
    }
    process.exit(1);
  }
}
// Type definition for supported commands
type Command = 'init' | 'add';

// Main CLI logic
const args = process.argv.slice(2);
const command = args[0] as Command;

switch (command) {
  case 'init':
    await init();
    break;
  case 'add':
    await add();
    break;
  default:
    cancel('Unknown command. Use `init` or `add`');
    process.exit(1);
}
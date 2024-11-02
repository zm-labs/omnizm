'use client';

import * as React from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import {
  CheckIcon,
  ChevronRightIcon,
  DotFilledIcon,
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

const baseItemStyles =
  'flex cursor-default select-none items-center rounded-sm text-sm outline-none';
const focusStyles = 'focus:bg-accent focus:text-accent-foreground';
const disabledStyles =
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50';
const animationStyles = `
  data-[state=open]:animate-in data-[state=closed]:animate-out 
  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
  data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
  data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 
  data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
`;

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;
export const ContextMenuSub = ContextMenuPrimitive.Sub;
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

interface InsetProps {
  inset?: boolean;
}

export const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> &
    InsetProps
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      `${baseItemStyles} px-2 py-1.5 ${focusStyles} data-[state=open]:bg-accent data-[state=open]:text-accent-foreground`,
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto h-4 w-4" />
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger';

export const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      `z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 
       text-popover-foreground shadow-lg ${animationStyles}`,
      className
    )}
    {...props}
  />
));
ContextMenuSubContent.displayName = 'ContextMenuSubContent';

export const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        `z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 
         text-popover-foreground shadow-md ${animationStyles}`,
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = 'ContextMenuContent';

export const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & InsetProps
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      `${baseItemStyles} px-2 py-1.5 ${focusStyles} ${disabledStyles}`,
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
ContextMenuItem.displayName = 'ContextMenuItem';

export const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      `${baseItemStyles} py-1.5 pl-8 pr-2 ${focusStyles} ${disabledStyles}`,
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';

export const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      `${baseItemStyles} py-1.5 pl-8 pr-2 ${focusStyles} ${disabledStyles}`,
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <DotFilledIcon className="h-4 w-4 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = 'ContextMenuRadioItem';

export const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & InsetProps
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-sm font-semibold text-foreground',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
ContextMenuLabel.displayName = 'ContextMenuLabel';

export const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

export const ContextMenuShortcut = React.memo<
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }) => (
  <span
    className={cn(
      'ml-auto text-xs tracking-widest text-muted-foreground',
      className
    )}
    {...props}
  />
));
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

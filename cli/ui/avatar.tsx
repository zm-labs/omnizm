import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

const cn = (...classes: string[]): string => classes.filter(Boolean).join(' ');

const Avatar = React.forwardRef<HTMLDivElement, AvatarPrimitive.AvatarProps>(
  ({ className }) => {
    return (
      <AvatarPrimitive.Root
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          className ?? ''
        )}
      />
    );
  }
);

Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  AvatarPrimitive.AvatarImageProps
>(({ className, ...props }, ref) => {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full', className ?? '')}
      {...props}
    />
  );
});

AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  AvatarPrimitive.AvatarFallbackProps
>(({ className, ...props }, ref) => {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className ?? ''
      )}
      {...props}
    />
  );
});

AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };

import React, { forwardRef } from 'react';

const Alert = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} role="alert" {...props} />
);
Alert.displayName = 'Alert';

const AlertTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>((props, ref) => <h5 ref={ref} {...props} />);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>((props, ref) => <div ref={ref} {...props} />);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };

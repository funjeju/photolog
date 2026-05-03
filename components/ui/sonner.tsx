'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-card group-[.toaster]:rounded-lg',
          description: 'group-[.toast]:text-foreground-muted',
          actionButton: 'group-[.toast]:bg-primary-300 group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-background-subtle group-[.toast]:text-foreground-muted',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type PageShellProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function PageShell({ children, className, ...props }: PageShellProps) {
  return (
    <main
      className={cn(
        'min-h-screen workbench-bg text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </main>
  );
}

type PageContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function PageContent({ children, className, ...props }: PageContentProps) {
  return (
    <div className={cn('mx-auto max-w-4xl px-5 py-10 sm:px-8', className)} {...props}>
      {children}
    </div>
  );
}

import { type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';
import { formatShortcut } from '../../shortcuts/format';
import type { ShortcutId } from '../../shortcuts/definitions';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium no-underline transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-45',
  {
    variants: {
      variant: {
        primary:
          'bg-accent px-4 py-2 font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60',
        secondary:
          'border border-border bg-control px-3 py-2 text-foreground hover:border-accent/45 hover:bg-control-hover',
        ghost: 'px-3 py-2 text-foreground hover:bg-control-hover',
        destructive:
          'border border-border bg-control px-3 py-2 text-foreground hover:border-red-300/50 hover:bg-red-950/25',
      },
      size: {
        sm: 'min-h-8 px-3 py-1.5 text-xs',
        md: 'min-h-10',
        icon: 'h-9 w-9 p-0',
      },
      active: {
        true: 'border-accent/55 bg-control-hover text-accent',
        false: null,
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
      active: false,
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Shortcut id whose chord gets folded into the `title` tooltip. Purely
     * informational — the actual key handling is still wired up by the
     * caller via `useShortcut`. Tooltips keep the button visually identical
     * to non-shortcut buttons (and to button-styled `<Link>`s, which can't
     * render inline chips).
     */
    shortcut?: ShortcutId;
  };

export function Button({
  active,
  children,
  className,
  shortcut,
  size,
  title,
  type = 'button',
  variant,
  ...props
}: ButtonProps) {
  const chordLabel = shortcut ? formatShortcut(shortcut) : undefined;
  const computedTitle = chordLabel
    ? title
      ? `${title} (${chordLabel})`
      : chordLabel
    : title;

  return (
    <button
      type={type}
      title={computedTitle}
      className={cn(buttonVariants({ active, size, variant }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

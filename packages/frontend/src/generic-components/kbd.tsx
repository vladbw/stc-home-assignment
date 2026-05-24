import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type KbdProps = HTMLAttributes<HTMLElement>;

/**
 * Inline keyboard-shortcut hint, e.g. the `⌘Z` chip rendered next to a
 * button label. Sized smaller than the surrounding text so it visually
 * recedes; styled with the same `bg-control` / `border-border` tokens as
 * other UI primitives.
 */
export function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded-control border border-border bg-control px-1.5 py-0.5 text-[0.7rem] font-medium leading-none text-muted',
        className,
      )}
      {...props}
    />
  );
}

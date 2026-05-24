import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const inputVariants = cva(
  'min-w-0 rounded-control border border-border bg-control px-4 py-3 text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent/60 focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      inputSize: {
        md: 'min-h-12',
        compact: 'min-h-10 py-2',
      },
    },
    defaultVariants: {
      inputSize: 'md',
    },
  },
);

type InputProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputVariants({ inputSize }), className)}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

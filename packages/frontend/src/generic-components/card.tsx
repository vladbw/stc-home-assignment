import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const cardVariants = cva(
  'rounded-card border border-border bg-panel text-foreground shadow-panel',
  {
    variants: {
      variant: {
        default: '',
        interactive:
          'transition-colors hover:border-accent/35',
        dashed: 'border-dashed shadow-none',
      },
      padding: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  },
);

type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export function Card({ className, padding, variant, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ padding, variant }), className)}
      {...props}
    />
  );
}

import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-muted text-muted-foreground',
        outline: 'border-border text-muted-foreground',
        success: 'border-emerald-600/20 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
        warning: 'border-amber-600/20 bg-amber-600/10 text-amber-700 dark:text-amber-400',
        danger: 'border-destructive/20 bg-destructive/10 text-destructive',
        info: 'border-sky-600/20 bg-sky-600/10 text-sky-700 dark:text-sky-400',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone, className }))} {...props} />;
}

export { Badge, badgeVariants };

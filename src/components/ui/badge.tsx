import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Riido 토큰 기반 상태 뱃지. 다크 모드의 status-* 토큰은 회색으로 중화돼 있어
 * 콘솔처럼 색이 의미를 갖는 곳에서는 primitive 팔레트로 색을 유지한다.
 */
const badgeVariants = cva(
  'rounded-6 text-caption-12 inline-flex shrink-0 items-center gap-1 border px-1.5 py-px font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-border-disable bg-fill-neutral text-text-secondary',
        outline: 'border-border-strong text-text-secondary',
        success: 'bg-status-success-soft text-status-success-text border-transparent',
        warning:
          'bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-300 border-transparent',
        danger:
          'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300 border-transparent',
        info: 'bg-secondary-soft text-secondary-soft-text border-transparent',
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

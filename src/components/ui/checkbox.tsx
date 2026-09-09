import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

type CheckboxProps = ComponentProps<'input'> & {
  /** 일부만 선택된 헤더 체크박스에 쓴다. */
  indeterminate?: boolean;
};

function Checkbox({ className, indeterminate = false, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        'border-input accent-primary focus-visible:ring-ring/50 size-4 cursor-pointer rounded border align-middle focus-visible:ring-3 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };

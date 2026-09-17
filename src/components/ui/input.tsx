import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const fieldBase =
  'bg-background-surface-soft border-border-strong text-text-primary placeholder:text-text-tertiary text-body-14 focus-visible:border-border-neutral focus-visible:ring-ring/50 aria-invalid:border-danger-400 aria-invalid:ring-danger-500/20 rounded-10 w-full border transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3';

function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" className={cn(fieldBase, 'h-9 px-3', className)} {...props} />;
}

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, 'min-h-16 resize-y px-3 py-2 leading-relaxed', className)}
      {...props}
    />
  );
}

/**
 * 콘솔은 한 화면에 선택지가 여러 개 붙는 편집 행이 많아, 목록형 선택은 네이티브
 * select로 둔다 — 키보드 이동과 모바일 동작을 그대로 얻는다.
 */
function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(fieldBase, 'h-9 cursor-pointer px-2.5 pr-7', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export { Input, NativeSelect, Textarea };

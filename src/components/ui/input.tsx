import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const fieldBase =
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 w-full rounded-lg border bg-transparent text-sm transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 dark:bg-input/30';

function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" className={cn(fieldBase, 'h-8 px-2.5', className)} {...props} />;
}

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, 'min-h-16 resize-y px-2.5 py-1.5 leading-relaxed', className)}
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
      className={cn(fieldBase, 'h-8 cursor-pointer px-2 pr-7', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export { Input, NativeSelect, Textarea };

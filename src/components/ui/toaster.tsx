import { CheckCircle2Icon, InfoIcon, XCircleIcon } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import { ToastContext, type Toast, type ToastTone } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const TONE_STYLES: Record<ToastTone, string> = {
  info: 'border-border bg-popover text-popover-foreground',
  success:
    'border-emerald-600/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const TONE_ICONS: Record<ToastTone, ReactNode> = {
  info: <InfoIcon className="size-4" />,
  success: <CheckCircle2Icon className="size-4" />,
  error: <XCircleIcon className="size-4" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextIdRef.current++;
    setToasts((current) => [...current, { id, tone, message }]);

    setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      tone === 'error' ? 6000 : 3000,
    );
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-100 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-md',
              'animate-in slide-in-from-bottom-2 fade-in-0',
              TONE_STYLES[toast.tone],
            )}
          >
            <span className="mt-0.5 shrink-0">{TONE_ICONS[toast.tone]}</span>
            <p className="leading-snug">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

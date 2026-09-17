import { CheckCircle2Icon, InfoIcon, XCircleIcon } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import { ToastContext, type Toast, type ToastTone } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const TONE_STYLES: Record<ToastTone, string> = {
  info: 'border-border-strong bg-background-answer text-text-primary [&_svg]:text-icon-secondary',
  success:
    'border-border-strong bg-background-answer text-text-primary [&_svg]:text-status-success-solid',
  error:
    'border-border-strong bg-background-answer text-text-primary [&_svg]:text-status-danger-icon',
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
              'rounded-12 text-body-14 shadow-l pointer-events-auto flex items-start gap-2 border px-3.5 py-2.5',
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

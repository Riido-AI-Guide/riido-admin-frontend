import { AlertCircleIcon, InboxIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

function Shell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex flex-col items-center justify-center gap-2 px-6 py-12 text-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LoadingBlock({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <Shell>
      <Spinner />
      <p>{label}</p>
    </Shell>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Shell className="text-destructive">
      <AlertCircleIcon className="size-5" />
      <p>{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </Shell>
  );
}

export function EmptyBlock({ label }: { label: string }) {
  return (
    <Shell>
      <InboxIcon className="size-5" />
      <p>{label}</p>
    </Shell>
  );
}

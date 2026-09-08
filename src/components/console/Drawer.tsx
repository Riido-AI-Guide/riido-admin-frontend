import { XIcon } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DrawerProps = {
  /** 스크린리더가 읽을 패널 이름 */
  label: string;
  onClose: () => void;
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** 목록 옆에서 단건을 열어 보는 오른쪽 패널. 바깥 클릭·Esc로 닫힌다. */
export function Drawer({ label, onClose, header, footer, children, className }: DrawerProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <>
      <div
        className="animate-in fade-in-0 fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label={label}
        className={cn(
          'bg-background animate-in slide-in-from-right-4 fade-in-0 fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l shadow-xl duration-150',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0 flex-1">{header}</div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="닫기">
            <XIcon />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex items-center justify-between gap-3 border-t px-5 py-3">
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}

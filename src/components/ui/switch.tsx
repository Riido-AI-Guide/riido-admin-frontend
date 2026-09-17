import { cn } from '@/lib/utils';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

/**
 * Figma `switch` (2132:11308) — 36×20 토글, pad 2, thumb 16.
 * off: fill-surface-strong(#E8EBED / #272F35) / on: button-primary(#24B2A4 / #29D6C5), thumb는 button-surface(#F9FAFB / #1F262B)
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors outline-none',
        'focus-visible:ring-ring/50 focus-visible:ring-3',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-button-primary' : 'bg-fill-surface-strong',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'bg-button-surface size-4 rounded-full transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  );
}

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** pass/fail 판정. 서버가 다른 값을 주면 중립으로 그린다. */
export function VerdictBadge({ verdict }: { verdict?: string | null }) {
  if (!verdict) return <Badge tone="outline">미평가</Badge>;

  if (verdict === 'pass') return <Badge tone="success">pass</Badge>;
  if (verdict === 'fail') return <Badge tone="danger">fail</Badge>;

  return <Badge>{verdict}</Badge>;
}

/** 0.0~1.0 점수 한 줄. 0.8 이상이면 초록, 0.5 미만이면 빨강. */
export function ScoreBar({ label, value }: { label: string; value: number }) {
  const ratio = Math.max(0, Math.min(1, value));

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-20 shrink-0 text-xs">{label}</span>
      <span className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
        <span
          className={cn(
            'block h-full rounded-full',
            ratio >= 0.8 ? 'bg-emerald-500' : ratio >= 0.5 ? 'bg-amber-500' : 'bg-destructive',
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

export function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs tabular-nums',
        value >= 0.8
          ? 'border-emerald-600/20 text-emerald-700 dark:text-emerald-400'
          : value >= 0.5
            ? 'border-amber-600/20 text-amber-700 dark:text-amber-400'
            : 'border-destructive/20 text-destructive',
      )}
      title={label}
    >
      <span className="text-muted-foreground">{label}</span>
      {value.toFixed(2)}
    </span>
  );
}

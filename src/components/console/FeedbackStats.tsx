import { RefreshCwIcon } from 'lucide-react';

import type { AgreementStat } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const RATINGS = ['GOOD', 'BAD'] as const;
const RATING_LABELS: Record<string, string> = { GOOD: '좋아요', BAD: '싫어요' };

/** 열은 판정자의 판정. null(미채점)은 마지막 칸으로 모은다. */
const COLUMNS: { key: string; label: string }[] = [
  { key: 'pass', label: 'pass' },
  { key: 'fail', label: 'fail' },
  { key: 'unevaluated', label: '미평가' },
];

type FeedbackStatsProps = {
  stats: AgreementStat[] | null;
  error: string | null;
  isLoading: boolean;
  onReload: () => void;
  /** 칸을 누르면 그 조합만 목록에 남긴다 */
  onSelect: (rating: string, agreement: string) => void;
};

function agreementOf(rating: string, column: string): string {
  if (column === 'unevaluated') return 'unevaluated';
  const userSaysGood = rating === 'GOOD';
  const judgeSaysPass = column === 'pass';
  return userSaysGood === judgeSaysPass ? 'match' : 'mismatch';
}

export function FeedbackStats({ stats, error, isLoading, onReload, onSelect }: FeedbackStatsProps) {
  const counts = new Map<string, number>();
  let total = 0;

  for (const stat of stats ?? []) {
    const column = stat.verdict ?? 'unevaluated';
    const key = `${stat.rating}:${column}`;
    counts.set(key, (counts.get(key) ?? 0) + stat.count);
    total += stat.count;
  }

  return (
    <section className="bg-background-answer border-border-strong rounded-16 shadow-s mb-4 border p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-text-primary text-title-16 font-semibold tracking-[-0.4px]">
            사용자 평가 × 판정자 평가
          </h2>
          <span className="text-text-secondary text-xs">
            총 {total.toLocaleString('ko-KR')}건 · 칸을 누르면 그 조합만 봅니다
          </span>
        </div>
        <Button variant="ghost" size="xs" onClick={onReload} disabled={isLoading}>
          {isLoading ? <Spinner className="size-3" /> : <RefreshCwIcon />}
          다시 확인
        </Button>
      </div>

      {error ? (
        <p className="text-danger-600 dark:text-danger-400 text-xs">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-96 border-collapse text-sm">
            <thead>
              <tr className="text-text-secondary text-xs">
                <th className="w-24 px-2 py-1 text-left font-medium">사용자 \ 판정자</th>
                {COLUMNS.map((column) => (
                  <th key={column.key} className="w-24 px-2 py-1 text-left font-medium">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RATINGS.map((rating) => (
                <tr key={rating}>
                  <th className="px-2 py-1 text-left text-xs font-medium">
                    {RATING_LABELS[rating]}
                  </th>
                  {COLUMNS.map((column) => {
                    const count = counts.get(`${rating}:${column.key}`) ?? 0;
                    const agreement = agreementOf(rating, column.key);
                    // 사용자는 싫다는데 판정자는 pass — 프롬프트를 고칠 1순위 표본이다.
                    const isPriority = rating === 'BAD' && column.key === 'pass' && count > 0;

                    return (
                      <td key={column.key} className="p-0.5">
                        <button
                          type="button"
                          disabled={count === 0}
                          onClick={() => onSelect(rating, agreement)}
                          className={cn(
                            'rounded-12 w-full border px-3 py-2.5 text-left transition-colors',
                            count === 0
                              ? 'border-border-default text-text-tertiary cursor-default'
                              : 'hover:bg-fill-hover border-border-strong',
                            isPriority && 'border-danger-400/60 bg-danger-50 dark:bg-danger-500/15',
                            agreement === 'mismatch' &&
                              count > 0 &&
                              !isPriority &&
                              'bg-warning-100/60 dark:bg-warning-500/10',
                          )}
                        >
                          <span className="block text-base font-semibold tabular-nums">
                            {count.toLocaleString('ko-KR')}
                          </span>
                          <span className="text-text-secondary block text-[11px]">
                            {isPriority
                              ? '요주의'
                              : count === 0
                                ? '-'
                                : agreement === 'match'
                                  ? '일치'
                                  : agreement === 'mismatch'
                                    ? '엇갈림'
                                    : '미평가'}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

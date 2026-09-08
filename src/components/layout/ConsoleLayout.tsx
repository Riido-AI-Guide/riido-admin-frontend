import { RefreshCwIcon } from 'lucide-react';
import { useMemo } from 'react';
import { NavLink, Outlet } from 'react-router';

import { getHealth } from '@/api/console';
import type { HealthResponse } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { HealthContext, tableRows } from '@/hooks/useHealth';
import { useResource } from '@/hooks/useResource';
import { cn } from '@/lib/utils';

type Segment = {
  to: string;
  label: string;
  /** 이 세그먼트의 항목 수를 세는 테이블 */
  table: string;
  /** 곁들여 보여줄 보조 수치 */
  extra?: { label: string; table: string };
};

const SEGMENTS: Segment[] = [
  {
    to: '/documents',
    label: '근거 문서',
    table: 'answer_units',
    extra: { label: '질문 쿼리', table: 'search_units' },
  },
  { to: '/evaluations', label: '평가', table: 'answer_evaluations' },
  { to: '/qna', label: '질의응답 로그', table: 'qna_logs' },
];

const STATUS_STYLES: Record<HealthResponse['status'], string> = {
  ok: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-destructive',
};

const STATUS_LABELS: Record<HealthResponse['status'], string> = {
  ok: '정상',
  degraded: '일부 비어 있음',
  down: 'DB 연결 실패',
};

function formatCount(value: number | null): string {
  return value === null ? '-' : value.toLocaleString('ko-KR');
}

export default function ConsoleLayout() {
  const { data: health, error, isLoading, reload } = useResource(() => getHealth(), []);

  const contextValue = useMemo(
    () => ({ health, error, isLoading, reload }),
    [health, error, isLoading, reload],
  );

  return (
    <HealthContext value={contextValue}>
      <div className="bg-background text-foreground min-h-screen">
        <header className="bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="flex items-baseline gap-3">
              <h1 className="text-base font-semibold">뤼이도 운영 콘솔</h1>
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    health ? STATUS_STYLES[health.status] : 'bg-muted-foreground/40',
                  )}
                  aria-hidden
                />
                {health ? STATUS_LABELS[health.status] : error ? '상태 확인 실패' : '확인 중'}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={reload} disabled={isLoading}>
              {isLoading ? <Spinner className="size-3.5" /> : <RefreshCwIcon />}
              새로고침
            </Button>
          </div>

          <nav className="mx-auto max-w-7xl px-6 pb-3">
            <ul className="flex flex-wrap gap-2">
              {SEGMENTS.map((segment) => {
                const count = tableRows(health, segment.table);
                const extraCount = segment.extra ? tableRows(health, segment.extra.table) : null;

                return (
                  <li key={segment.to}>
                    <NavLink
                      to={segment.to}
                      className={({ isActive }) =>
                        cn(
                          'hover:border-foreground/20 hover:bg-muted/60 flex min-w-40 flex-col gap-0.5 rounded-xl border px-3 py-2 transition-colors',
                          isActive
                            ? 'border-foreground/30 bg-muted shadow-xs'
                            : 'border-border bg-background',
                        )
                      }
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium">{segment.label}</span>
                        <span className="text-base font-semibold tabular-nums">
                          {formatCount(count)}
                        </span>
                      </span>
                      {segment.extra && (
                        <span className="text-muted-foreground flex items-baseline justify-between gap-3 text-xs">
                          <span>{segment.extra.label}</span>
                          <span className="tabular-nums">{formatCount(extraCount)}</span>
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            {health?.hint && <p className="text-muted-foreground mt-2 text-xs">{health.hint}</p>}
            {error && <p className="text-destructive mt-2 text-xs">{error}</p>}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-6">
          <Outlet />
        </main>
      </div>
    </HealthContext>
  );
}

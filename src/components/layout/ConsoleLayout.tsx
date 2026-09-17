import {
  ClipboardCheck,
  FileText,
  MessagesSquare,
  Moon,
  RefreshCw,
  ThumbsUp,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { NavLink, Outlet } from 'react-router';

import { getHealth } from '@/api/console';
import type { HealthResponse } from '@/api/types';
import riidoSymbol from '@/assets/brand/riido-symbol-teal.png';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { HealthContext, tableRows } from '@/hooks/useHealth';
import { useResource } from '@/hooks/useResource';
import { ICON_STROKE } from '@/lib/icon';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

type Segment = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** 이 세그먼트의 항목 수를 세는 테이블. 'backend'는 백엔드 스키마 쪽 수치다 */
  table: string | 'backend';
  /** 곁들여 보여줄 보조 수치 */
  extra?: { label: string; table: string };
};

const SEGMENTS: Segment[] = [
  {
    to: '/documents',
    label: '근거 문서',
    icon: FileText,
    table: 'answer_units',
    extra: { label: '질문 쿼리', table: 'search_units' },
  },
  { to: '/evaluations', label: '평가', icon: ClipboardCheck, table: 'answer_evaluations' },
  { to: '/qna', label: '질의응답 로그', icon: MessagesSquare, table: 'qna_logs' },
  { to: '/feedback', label: '사용자 피드백', icon: ThumbsUp, table: 'backend' },
];

const STATUS_STYLES: Record<HealthResponse['status'], string> = {
  ok: 'bg-status-success-solid',
  degraded: 'bg-warning-500',
  down: 'bg-danger-500',
};

const STATUS_LABELS: Record<HealthResponse['status'], string> = {
  ok: '정상',
  degraded: '일부 비어 있음',
  down: 'DB 연결 실패',
};

function formatCount(value: number | null): string {
  return value === null ? '-' : value.toLocaleString('ko-KR');
}

/** 사이드바 한 줄 — 챗봇 `SidebarItem`과 같은 40px 줄(radius 12, hover: fill-surface-strong) */
function SegmentLink({ segment, count }: { segment: Segment; count: number | null }) {
  const Icon = segment.icon;

  return (
    <NavLink
      to={segment.to}
      className={({ isActive }) =>
        cn(
          'hover:bg-fill-surface-strong focus-visible:ring-ring/50 rounded-12 flex h-10 shrink-0 items-center pr-3 transition-colors outline-none focus-visible:ring-3',
          isActive && 'bg-fill-surface-strong',
        )
      }
    >
      <span className="flex size-10 shrink-0 items-center justify-center" aria-hidden>
        <Icon className="text-icon-primary size-6" strokeWidth={ICON_STROKE} />
      </span>
      <span className="text-text-primary text-title-16 min-w-0 flex-1 truncate font-medium tracking-[-0.4px] whitespace-nowrap">
        {segment.label}
      </span>
      <span className="text-text-secondary text-body-14 ml-3 tabular-nums">
        {formatCount(count)}
      </span>
    </NavLink>
  );
}

export default function ConsoleLayout() {
  const { data: health, error, isLoading, reload } = useResource(() => getHealth(), []);
  const { isDark, toggleTheme } = useTheme();

  const contextValue = useMemo(
    () => ({ health, error, isLoading, reload }),
    [health, error, isLoading, reload],
  );

  const countOf = (segment: Segment) =>
    segment.table === 'backend'
      ? (health?.backend?.rows ?? null)
      : tableRows(health, segment.table);

  const notices = (
    <>
      {health?.backend && !health.backend.available && (
        <p>
          백엔드 스키마({health.backend.table})에 닿지 못해 사용자 피드백만 조회할 수 없습니다.
          나머지 화면은 정상입니다.
        </p>
      )}
      {health?.hint && <p>{health.hint}</p>}
      {error && <p className="text-status-danger-icon">{error}</p>}
    </>
  );
  const hasNotices = Boolean(
    (health?.backend && !health.backend.available) || health?.hint || error,
  );

  return (
    <HealthContext value={contextValue}>
      <div className="bg-background-canvas text-text-primary flex h-dvh flex-col">
        <header className="border-border-strong flex h-16 shrink-0 items-center gap-3 border-b pr-3 pl-4">
          <img src={riidoSymbol} alt="" className="size-8 shrink-0" />
          <h1 className="text-text-primary text-title-20 min-w-0 truncate font-semibold tracking-[-0.4px]">
            Riido AI Guide Operation Console
          </h1>

          <span className="bg-background-surface-soft border-border-strong text-text-secondary text-caption-12 hidden h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 sm:flex">
            <span
              className={cn(
                'size-1.5 rounded-full',
                health ? STATUS_STYLES[health.status] : 'bg-icon-tertiary',
              )}
              aria-hidden
            />
            {health ? STATUS_LABELS[health.status] : error ? '상태 확인 실패' : '확인 중'}
          </span>

          <button
            type="button"
            onClick={reload}
            disabled={isLoading}
            aria-label="상태 새로고침"
            title="상태 새로고침"
            className="hover:bg-fill-surface-strong focus-visible:ring-ring/50 rounded-12 ml-auto flex size-10 shrink-0 items-center justify-center transition-colors outline-none focus-visible:ring-3 disabled:opacity-50"
          >
            {isLoading ? (
              <Spinner className="text-icon-secondary size-5" />
            ) : (
              <RefreshCw className="text-icon-secondary size-5" strokeWidth={ICON_STROKE} />
            )}
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* 챗봇 사이드바와 같은 260px 패널 (fill-neutral-strong + 오른쪽 1px 선) */}
          <aside className="bg-fill-neutral-strong hidden w-[260px] shrink-0 flex-col shadow-[inset_-1px_0_0_var(--border-strong)] md:flex">
            <nav className="riido-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-3 pr-3 pl-4">
              {SEGMENTS.map((segment) => (
                <div key={segment.to} className="flex flex-col">
                  <SegmentLink segment={segment} count={countOf(segment)} />
                  {segment.extra && (
                    <div className="border-icon-tertiary text-text-secondary text-body-14 mt-1 ml-5 flex h-8 items-center justify-between border-l pr-3 pl-4">
                      <span>{segment.extra.label}</span>
                      <span className="tabular-nums">
                        {formatCount(tableRows(health, segment.extra.table))}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {hasNotices && (
                <div className="bg-background-surface border-border-neutral-strong text-text-secondary text-caption-12 rounded-12 mt-3 mr-0 flex flex-col gap-1 border p-3">
                  {notices}
                </div>
              )}
            </nav>

            <div className="border-border-strong shrink-0 border-t">
              <p className="text-text-primary text-title-16 px-6 pt-[15px] pb-2 font-medium tracking-[-0.4px]">
                설정
              </p>
              <div className="my-1 mr-3 mb-3 ml-4 flex h-10 items-center">
                <span className="flex size-10 shrink-0 items-center justify-center" aria-hidden>
                  <Moon className="text-icon-primary size-6" strokeWidth={ICON_STROKE} />
                </span>
                <span className="text-text-primary text-title-16 flex-1 font-medium tracking-[-0.4px]">
                  다크모드
                </span>
                <Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="다크모드" />
              </div>
            </div>
          </aside>

          <main className="riido-scrollbar min-w-0 flex-1 overflow-y-auto">
            {/* 좁은 화면에선 사이드바 대신 가로 탭 */}
            <nav className="border-border-strong bg-fill-neutral-strong flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
              {SEGMENTS.map((segment) => (
                <SegmentLink key={segment.to} segment={segment} count={countOf(segment)} />
              ))}
              <div className="ml-auto flex shrink-0 items-center pl-2">
                <Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="다크모드" />
              </div>
            </nav>
            {hasNotices && (
              <div className="text-text-secondary text-caption-12 flex flex-col gap-1 px-4 pt-3 md:hidden">
                {notices}
              </div>
            )}

            <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </HealthContext>
  );
}

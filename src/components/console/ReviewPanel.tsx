import { AlertTriangleIcon, CheckCircle2Icon, HammerIcon, RefreshCwIcon } from 'lucide-react';

import type { IndexStatus, StaleGroup } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/date';

type Group = {
  key: keyof Pick<IndexStatus, 'no_search_units' | 'no_content_vector' | 'outdated_content_vector'>;
  label: string;
  hint: string;
  tone: 'danger' | 'warning';
};

const GROUPS: Group[] = [
  {
    key: 'no_search_units',
    label: '질문 쿼리 없음',
    hint: '벡터 검색에서 빠진 문서입니다. 사람이 질문 쿼리를 채워야 합니다.',
    tone: 'danger',
  },
  {
    key: 'no_content_vector',
    label: '원문 인덱스 없음',
    hint: '키워드 검색에서 빠진 문서입니다.',
    tone: 'warning',
  },
  {
    key: 'outdated_content_vector',
    label: '옛 본문으로 색인됨',
    hint: '답변은 최신인데 검색만 과거입니다.',
    tone: 'warning',
  },
];

type ReviewPanelProps = {
  status: IndexStatus | null;
  error: string | null;
  isLoading: boolean;
  onReload: () => void;
  onSelectDoc: (docId: string) => void;
  /** 가이드 재수집 + 인덱스 재생성 */
  onRebuild: () => void;
  /** 재빌드가 도는 중 — 버튼을 잠가 연타를 막는다 */
  isRebuilding: boolean;
  rebuildError: string | null;
};

function GroupBlock({
  group,
  data,
  onSelectDoc,
}: {
  group: Group;
  data: StaleGroup;
  onSelectDoc: (docId: string) => void;
}) {
  const docIds = data.doc_ids ?? [];

  return (
    <div className="bg-background-surface border-border-neutral-strong rounded-12 border p-4">
      <div className="mb-2 flex items-center gap-2">
        <Badge tone={data.count > 0 ? group.tone : 'success'}>
          {data.count.toLocaleString('ko-KR')}건
        </Badge>
        <span className="text-sm font-medium">{group.label}</span>
      </div>
      <p className="text-text-secondary mb-2 text-xs">{group.hint}</p>

      {docIds.length === 0 ? (
        <p className="text-text-secondary text-xs">해당 문서가 없습니다.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {docIds.map((docId) => (
            <li key={docId}>
              <button
                type="button"
                onClick={() => onSelectDoc(docId)}
                className="bg-background-surface border-border-strong hover:bg-fill-hover rounded-6 border px-1.5 py-0.5 font-mono text-xs transition-colors"
              >
                {docId}
              </button>
            </li>
          ))}
        </ul>
      )}

      {data.count > docIds.length && (
        <p className="text-text-secondary mt-2 text-xs">
          앞 {docIds.length}건만 표본으로 표시합니다.
        </p>
      )}
    </div>
  );
}

/** /index-status를 근거로 "손봐야 할 문서"를 모아 보여준다. */
export function ReviewPanel({
  status,
  error,
  isLoading,
  onReload,
  onSelectDoc,
  onRebuild,
  isRebuilding,
  rebuildError,
}: ReviewPanelProps) {
  return (
    <section className="bg-background-answer border-border-strong rounded-16 shadow-s mb-4 border p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {status?.status === 'stale' ? (
            <AlertTriangleIcon className="text-status-warning-icon size-5" />
          ) : (
            <CheckCircle2Icon className="text-status-success-solid size-5" />
          )}
          <h2 className="text-text-primary text-title-16 font-semibold tracking-[-0.4px]">
            검토가 필요한 문서
          </h2>
          {status && (
            <span className="text-text-secondary text-xs">
              문서 {status.answer_units.toLocaleString('ko-KR')}건 · 마지막 빌드{' '}
              {formatDateTime(status.built_at)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" onClick={onReload} disabled={isLoading}>
            {isLoading ? <Spinner className="size-3" /> : <RefreshCwIcon />}
            다시 확인
          </Button>
          {/* 서버에서 손으로 돌리던 두 스크립트를 대신한다.
              수 분 걸릴 수 있어 202로 먼저 답하고, 끝났는지는 rebuilding으로 본다 */}
          <Button variant="outline" size="xs" onClick={onRebuild} disabled={isRebuilding}>
            {isRebuilding ? <Spinner className="size-3" /> : <HammerIcon />}
            {isRebuilding ? '빌드 중…' : '다시 빌드'}
          </Button>
        </div>
      </div>

      {error && <p className="text-danger-600 dark:text-danger-400 text-xs">{error}</p>}
      {rebuildError && (
        <p className="text-danger-600 dark:text-danger-400 text-xs">{rebuildError}</p>
      )}

      {status && (
        <>
          <div className="grid gap-2 md:grid-cols-3">
            {GROUPS.map((group) => (
              <GroupBlock
                key={group.key}
                group={group}
                data={status[group.key]}
                onSelectDoc={onSelectDoc}
              />
            ))}
          </div>

          {/* 검색 문장은 자동 생성 경로가 없어 '다시 빌드'로 풀리지 않는다 — 그 안내만 남긴다.
              나머지(원문 인덱스 없음·낡음)는 버튼이 처리하므로 명령어를 띄우지 않는다 */}
          {isRebuilding ? (
            <p className="text-text-secondary mt-3 text-xs">
              가이드를 다시 받아 인덱스를 만드는 중입니다. 끝나면 위 숫자가 줄어듭니다.
            </p>
          ) : (
            status.no_search_units.count > 0 && (
              <p className="text-text-secondary mt-3 text-xs">
                검색 문장이 없는 문서 {status.no_search_units.count}건은 &lsquo;다시 빌드&rsquo;로
                채워지지 않습니다 — 문서를 열어 질문 쿼리를 직접 등록해야 합니다.
              </p>
            )
          )}
        </>
      )}
    </section>
  );
}

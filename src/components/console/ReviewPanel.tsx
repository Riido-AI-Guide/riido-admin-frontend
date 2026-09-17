import { AlertTriangleIcon, CheckCircle2Icon, RefreshCwIcon } from 'lucide-react';

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
export function ReviewPanel({ status, error, isLoading, onReload, onSelectDoc }: ReviewPanelProps) {
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

        <Button variant="ghost" size="xs" onClick={onReload} disabled={isLoading}>
          {isLoading ? <Spinner className="size-3" /> : <RefreshCwIcon />}
          다시 확인
        </Button>
      </div>

      {error && <p className="text-danger-600 dark:text-danger-400 text-xs">{error}</p>}

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

          {status.hint && <p className="text-text-secondary mt-3 text-xs">{status.hint}</p>}
        </>
      )}
    </section>
  );
}

import {
  ExternalLinkIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { toUserMessage } from '@/api/client';
import { draftSentences, getAnswerUnit, getDocCoverage, saveDocSentences } from '@/api/console';
import type {
  AnswerUnitDetail,
  CoverageStatus,
  DocCoverageDetail,
  SentenceInput,
  ViewType,
} from '@/api/types';
import {
  SENTENCE_MAX_PER_DOC,
  SENTENCE_TEXT_MAX,
  SENTENCE_TEXT_MIN,
  VIEW_TYPES,
  VIEW_TYPE_LABELS,
} from '@/api/types';
import { Drawer } from '@/components/console/Drawer';
import { ErrorBlock, LoadingBlock } from '@/components/console/StateBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NativeSelect, Textarea } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useResource } from '@/hooks/useResource';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';

/** 편집 중인 문장 한 줄. 서버 id가 없으면 아직 저장되지 않은 새 줄이다. */
type SentenceRow = {
  key: string;
  id: number | null;
  view_type: ViewType;
  text: string;
  source?: string;
  outdated?: boolean;
};

const STATUS_TONE: Record<CoverageStatus, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  outdated: 'warning',
  missing: 'danger',
};

const STATUS_LABEL: Record<CoverageStatus, string> = {
  ok: '최신',
  outdated: '본문 변경 후 미수정',
  missing: '문장 없음',
};

/** 서버가 준 유형이 입력 허용 목록 밖이면 가장 가까운 기본값으로 떨어뜨린다. */
function asViewType(value: string): ViewType {
  return (VIEW_TYPES as readonly string[]).includes(value) ? (value as ViewType) : 'hypo_q';
}

let rowSeq = 0;
function nextKey() {
  return `row-${++rowSeq}`;
}

function toRows(detail: AnswerUnitDetail, coverage: DocCoverageDetail | null): SentenceRow[] {
  const meta = new Map((coverage?.sentences ?? []).map((item) => [item.id, item]));

  return (detail.search_units ?? []).map((unit) => ({
    key: nextKey(),
    id: unit.id,
    view_type: asViewType(unit.view_type),
    text: unit.text,
    source: meta.get(unit.id)?.source,
    outdated: meta.get(unit.id)?.outdated,
  }));
}

function serialize(rows: SentenceRow[]): string {
  return JSON.stringify(rows.map((row) => [row.view_type, row.text.trim()]));
}

type DocPanelProps = {
  docId: string;
  onClose: () => void;
  /** 문장 수가 바뀌었으니 목록·세그먼트 바를 다시 읽으라는 신호 */
  onSaved: () => void;
};

export function DocPanel({ docId, onClose, onSaved }: DocPanelProps) {
  const { push } = useToast();

  const resource = useResource(async () => {
    const [detail, coverage] = await Promise.all([
      getAnswerUnit(docId),
      // 문장이 낡았는지(본문 변경 후 미수정)는 coverage 쪽에만 있다. 없어도 편집은 된다.
      getDocCoverage(docId).catch(() => null),
    ]);
    return { detail, coverage };
  }, [docId]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const data = resource.data;

  /**
   * 서버가 준 문장 목록이 편집의 기준선이다. 다시 불러오면 baseRows의 정체가 바뀌고,
   * 그 정체를 토큰으로 물고 있던 편집분은 자동으로 버려진다 — 저장 뒤 초기화가 이걸로 끝난다.
   */
  const baseRows = useMemo(() => (data ? toRows(data.detail, data.coverage) : []), [data]);
  const [draft, setDraft] = useState<{ token: SentenceRow[]; rows: SentenceRow[] } | null>(null);
  const rows = draft?.token === baseRows ? draft.rows : baseRows;

  const setRows = useCallback(
    (updater: SentenceRow[] | ((current: SentenceRow[]) => SentenceRow[])) => {
      setDraft((current) => {
        const currentRows = current?.token === baseRows ? current.rows : baseRows;
        return {
          token: baseRows,
          rows: typeof updater === 'function' ? updater(currentRows) : updater,
        };
      });
    },
    [baseRows],
  );

  const isDirty = serialize(rows) !== serialize(baseRows);

  const invalidRows = useMemo(
    () =>
      rows.filter((row) => {
        const length = row.text.trim().length;
        return length < SENTENCE_TEXT_MIN || length > SENTENCE_TEXT_MAX;
      }),
    [rows],
  );

  const addRow = useCallback(
    (view_type: ViewType = 'hypo_q', text = '') => {
      setRows((current) => [...current, { key: nextKey(), id: null, view_type, text }]);
    },
    [setRows],
  );

  const handleSave = async () => {
    if (invalidRows.length > 0) {
      push(`문장은 ${SENTENCE_TEXT_MIN}~${SENTENCE_TEXT_MAX}자여야 합니다.`, 'error');
      return;
    }

    const items: SentenceInput[] = rows.map((row) => ({
      view_type: row.view_type,
      text: row.text.trim(),
    }));

    setIsSaving(true);
    try {
      const saved = await saveDocSentences(docId, items);
      push(
        items.length === 0
          ? '문장을 모두 삭제했습니다. 이 문서는 벡터 검색에서 빠집니다.'
          : `문장 ${saved.units}건을 저장했습니다.`,
        items.length === 0 ? 'error' : 'success',
      );
      resource.reload();
      onSaved();
    } catch (cause) {
      push(toUserMessage(cause), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraft = async () => {
    setIsDrafting(true);
    try {
      const draft = await draftSentences(docId);
      if (draft.items.length === 0) {
        push('생성된 초안이 없습니다.', 'info');
        return;
      }
      setRows((current) => [
        ...current,
        ...draft.items.map((item) => ({
          key: nextKey(),
          id: null,
          view_type: asViewType(item.view_type),
          text: item.text,
        })),
      ]);
      push(`초안 ${draft.items.length}건을 추가했습니다. 확인 후 저장하세요.`, 'success');
    } catch (cause) {
      push(toUserMessage(cause), 'error');
    } finally {
      setIsDrafting(false);
    }
  };

  const detail = data?.detail;
  const coverage = data?.coverage;
  const isReady = !resource.isInitialLoading && !resource.error;

  return (
    <Drawer
      label="근거 문서 상세"
      onClose={onClose}
      header={
        <>
          <p className="text-muted-foreground truncate font-mono text-xs">{docId}</p>
          <h2 className="truncate text-sm font-semibold">{detail?.title ?? '불러오는 중…'}</h2>
          {detail && (
            <p className="text-muted-foreground truncate text-xs">
              {detail.section}
              {detail.url && (
                <a
                  href={detail.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-0.5 underline underline-offset-2"
                >
                  원문 <ExternalLinkIcon className="size-3" />
                </a>
              )}
            </p>
          )}
        </>
      }
      footer={
        isReady && (
          <>
            <p className="text-muted-foreground text-xs">
              {isDirty ? '저장하지 않은 변경이 있습니다.' : '변경 사항 없음'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!isDirty || isSaving}
                onClick={() => setDraft(null)}
              >
                <RotateCcwIcon />
                되돌리기
              </Button>
              <Button size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
                {isSaving ? <Spinner className="size-3.5" /> : <SaveIcon />}
                저장
              </Button>
            </div>
          </>
        )
      }
    >
      {resource.isInitialLoading ? (
        <LoadingBlock />
      ) : resource.error ? (
        <ErrorBlock message={resource.error} onRetry={resource.reload} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {coverage && (
              <Badge tone={STATUS_TONE[coverage.status]}>{STATUS_LABEL[coverage.status]}</Badge>
            )}
            <Badge tone="outline">질문 쿼리 {rows.length}건</Badge>
            {coverage?.outdated ? (
              <Badge tone="warning">낡은 문장 {coverage.outdated}건</Badge>
            ) : null}
            {coverage?.content_updated_at && (
              <span className="text-muted-foreground text-xs">
                본문 수정 {formatDateTime(coverage.content_updated_at)}
              </span>
            )}
          </div>

          {detail?.content && (
            <div className="mb-4">
              <Button variant="ghost" size="xs" onClick={() => setShowContent((v) => !v)}>
                {showContent ? '본문 접기' : '본문 보기'}
              </Button>
              {showContent && (
                <pre className="bg-muted/60 mt-2 max-h-64 overflow-y-auto rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap">
                  {detail.content}
                </pre>
              )}
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium">질문 쿼리</h3>
            <span className="text-muted-foreground text-xs tabular-nums">
              {rows.length} / {SENTENCE_MAX_PER_DOC}
            </span>
          </div>

          {rows.length === 0 && (
            <p className="text-muted-foreground border-border mb-3 rounded-lg border border-dashed px-3 py-6 text-center text-xs">
              등록된 질문 쿼리가 없습니다. 이 문서는 벡터 검색에서 걸리지 않습니다.
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {rows.map((row, index) => {
              const length = row.text.trim().length;
              const isInvalid = length < SENTENCE_TEXT_MIN || length > SENTENCE_TEXT_MAX;

              return (
                <li
                  key={row.key}
                  className={cn(
                    'rounded-lg border p-2',
                    row.outdated ? 'border-amber-600/40 bg-amber-500/5' : 'border-border',
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <NativeSelect
                      className="h-7 w-32 text-xs"
                      value={row.view_type}
                      aria-label={`${index + 1}번 문장 유형`}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.key === row.key
                              ? { ...item, view_type: asViewType(event.target.value) }
                              : item,
                          ),
                        )
                      }
                    >
                      {VIEW_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {VIEW_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </NativeSelect>

                    {row.id === null && <Badge tone="info">새 문장</Badge>}
                    {row.outdated && <Badge tone="warning">낡음</Badge>}
                    {row.source === 'console' && <Badge tone="outline">콘솔 등록</Badge>}

                    <span
                      className={cn(
                        'ml-auto text-xs tabular-nums',
                        isInvalid ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {length}/{SENTENCE_TEXT_MAX}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${index + 1}번 문장 삭제`}
                      onClick={() =>
                        setRows((current) => current.filter((item) => item.key !== row.key))
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  </div>

                  <Textarea
                    value={row.text}
                    aria-invalid={isInvalid || undefined}
                    placeholder="사용자가 이렇게 물어보면 이 문서가 걸려야 한다 — 그 질문을 씁니다"
                    className="min-h-14 text-sm"
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((item) =>
                          item.key === row.key ? { ...item, text: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRow()}
              disabled={rows.length >= SENTENCE_MAX_PER_DOC}
            >
              <PlusIcon />
              질문 쿼리 추가
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDraft}
              disabled={isDrafting || rows.length >= SENTENCE_MAX_PER_DOC}
            >
              {isDrafting ? <Spinner className="size-3.5" /> : <SparklesIcon />}
              LLM 초안 생성
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}

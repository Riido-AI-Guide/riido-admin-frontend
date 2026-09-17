import { ChevronDownIcon, ChevronRightIcon, PlayIcon, SearchIcon, ZapIcon } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { toUserMessage } from '@/api/client';
import { listQna, runEvaluation, runEvaluations } from '@/api/console';
import type { QnaLogOut, QnaStatus } from '@/api/types';
import { EVALUATION_RUN_MAX, QNA_STATUS_LABELS } from '@/api/types';
import { Pagination } from '@/components/console/Pagination';
import { QnaAnswer } from '@/components/console/QnaAnswer';
import { VerdictBadge } from '@/components/console/Score';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/console/StateBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input, NativeSelect } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useDebounced } from '@/hooks/useDebounced';
import { useHealth } from '@/hooks/useHealth';
import { useResource } from '@/hooks/useResource';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<QnaStatus, 'warning' | 'success' | 'neutral'> = {
  pending: 'warning',
  evaluated: 'success',
  skipped: 'neutral',
};

/** 채점을 걸 수 있는 턴인지. 인사·잡담(skipped)은 눌러도 결과가 달라지지 않는다. */
function isRunnable(log: QnaLogOut): boolean {
  return log.status !== 'skipped';
}

export default function QnaLogsPage() {
  const [params, setParams] = useSearchParams();
  const { push } = useToast();
  const health = useHealth();

  const q = params.get('q') ?? '';
  const status = (params.get('status') ?? '') as QnaStatus | '';
  const answerType = params.get('answer_type') ?? '';
  const limit = Number(params.get('limit') ?? 20);
  const offset = Number(params.get('offset') ?? 0);

  const [keyword, setKeyword] = useState(q);
  const debouncedKeyword = useDebounced(keyword);

  const updateParams = (next: Record<string, string | null>, resetOffset = true) => {
    setParams(
      (current) => {
        const draft = new URLSearchParams(current);
        for (const [key, value] of Object.entries(next)) {
          if (value === null || value === '') draft.delete(key);
          else draft.set(key, value);
        }
        if (resetOffset) draft.delete('offset');
        return draft;
      },
      { replace: true },
    );
  };

  // 검색어는 디바운스가 끝난 뒤에만 주소에 반영한다.
  useEffect(() => {
    if (debouncedKeyword === q) return;
    updateParams({ q: debouncedKeyword || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  const logs = useResource(
    () =>
      listQna({
        q: q || undefined,
        status: status || undefined,
        answer_type: answerType || undefined,
        limit,
        offset,
      }),
    [q, status, answerType, limit, offset],
  );

  /** 미평가 전체 건수 — 일괄 실행 버튼의 근거이자 진행 상황을 보는 눈금이다. */
  const pendingTotal = useResource(
    () => listQna({ status: 'pending', limit: 1 }).then((page) => page.total),
    [],
  );

  const items = useMemo(() => logs.data?.items ?? [], [logs.data]);

  /**
   * 선택은 지금 화면에 뜬 목록에만 매단다. 목록을 다시 읽으면 items의 정체가 바뀌고
   * 선택도 함께 비워진다 — 일괄 실행 뒤 남은 체크를 따로 지울 필요가 없다.
   */
  const [selection, setSelection] = useState<{ token: QnaLogOut[]; ids: string[] } | null>(null);
  const selectedIds = selection?.token === items ? selection.ids : [];

  const setSelectedIds = (ids: string[]) => setSelection({ token: items, ids });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const pendingOnPage = useMemo(() => items.filter((item) => item.status === 'pending'), [items]);

  const toggleAllPending = () => {
    if (selectedIds.length > 0) {
      setSelectedIds([]);
      return;
    }

    const ids = pendingOnPage.map((item) => item.qna_uuid).slice(0, EVALUATION_RUN_MAX);
    if (pendingOnPage.length > EVALUATION_RUN_MAX) {
      push(
        `한 번에 ${EVALUATION_RUN_MAX}건까지 보낼 수 있어 앞 ${EVALUATION_RUN_MAX}건만 골랐습니다.`,
        'info',
      );
    }
    setSelectedIds(ids);
  };

  const refreshAfterRun = () => {
    logs.reload();
    pendingTotal.reload();
    health.reload();
  };

  const handleRunOne = async (log: QnaLogOut) => {
    setRunningId(log.qna_uuid);
    try {
      const evaluation = await runEvaluation(log.qna_uuid);
      logs.setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((row) =>
                row.qna_uuid === log.qna_uuid
                  ? { ...row, status: 'evaluated' as const, verdict: evaluation.verdict }
                  : row,
              ),
            }
          : current,
      );
      pendingTotal.reload();
      health.reload();
      push(`평가를 마쳤습니다. 판정은 ${evaluation.verdict}입니다.`, 'success');
    } catch (cause) {
      push(toUserMessage(cause), 'error');
    } finally {
      setRunningId(null);
    }
  };

  /** qna_uuids를 주면 그 턴들을, 주지 않으면 서버가 미평가에서 최근 건을 고른다. */
  const handleBulkRun = async (qnaUuids?: string[]) => {
    setIsBulkRunning(true);
    try {
      const result = await runEvaluations(
        qnaUuids ? { qna_uuids: qnaUuids } : { limit: EVALUATION_RUN_MAX },
      );

      const parts = [`${result.queued.length}건을 예약했습니다.`];
      if (result.skipped?.length) parts.push(`채점 대상이 아닌 ${result.skipped.length}건 제외.`);
      if (result.not_found?.length) parts.push(`로그가 없는 ${result.not_found.length}건 제외.`);
      push(`${parts.join(' ')} 채점은 뒤에서 도는 중입니다.`, 'success');

      setSelectedIds([]);
      // 202로 먼저 답하고 채점은 그 뒤에 돈다 — 잠시 뒤 미평가 건수로 진행 상황을 본다.
      setTimeout(refreshAfterRun, 4000);
    } catch (cause) {
      push(toUserMessage(cause), 'error');
    } finally {
      setIsBulkRunning(false);
    }
  };

  const answerTypeOptions = useMemo(() => {
    const values = new Set(items.map((item) => item.answer_type));
    if (answerType) values.add(answerType);
    return [...values].sort();
  }, [items, answerType]);

  return (
    <div>
      <section className="bg-background-answer border-border-strong rounded-16 shadow-s overflow-hidden border">
        <div className="border-border-strong flex flex-wrap items-center gap-2 border-b px-5 py-3.5">
          <div className="relative min-w-56 flex-1">
            <SearchIcon className="text-icon-tertiary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="질문 검색"
              className="pl-9"
              aria-label="질의응답 로그 검색"
            />
          </div>

          <NativeSelect
            className="w-32"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value || null })}
            aria-label="채점 상태"
          >
            <option value="">상태 전체</option>
            <option value="pending">미평가</option>
            <option value="evaluated">평가됨</option>
            <option value="skipped">대상 아님</option>
          </NativeSelect>

          <NativeSelect
            className="w-32"
            value={answerType}
            onChange={(event) => updateParams({ answer_type: event.target.value || null })}
            aria-label="답변 유형"
          >
            <option value="">답변 유형 전체</option>
            {answerTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>

          <Button variant="ghost" size="sm" onClick={refreshAfterRun} className="ml-auto">
            새로고침
          </Button>
        </div>

        <div className="bg-background-surface border-border-strong flex flex-wrap items-center gap-2 border-b px-5 py-2.5">
          <Badge tone={pendingTotal.data ? 'warning' : 'success'}>
            미평가 {pendingTotal.data?.toLocaleString('ko-KR') ?? '-'}건
          </Badge>

          {status !== 'pending' ? (
            <Button variant="ghost" size="xs" onClick={() => updateParams({ status: 'pending' })}>
              미평가만 보기
            </Button>
          ) : (
            <Button variant="ghost" size="xs" onClick={() => updateParams({ status: null })}>
              전체 보기
            </Button>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="text-text-secondary text-xs">
              {selectedIds.length > 0 ? `${selectedIds.length}건 선택됨` : '선택 없음'}
            </span>
            <Button
              size="sm"
              disabled={selectedIds.length === 0 || isBulkRunning}
              onClick={() => void handleBulkRun(selectedIds)}
            >
              {isBulkRunning ? <Spinner className="size-3.5" /> : <ZapIcon />}
              선택 {selectedIds.length}건 일괄 평가
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkRunning || pendingTotal.data === 0}
              onClick={() => void handleBulkRun()}
              title={`미평가에서 최근 ${EVALUATION_RUN_MAX}건을 서버가 골라 채점합니다`}
            >
              미평가 자동 실행
            </Button>
          </div>
        </div>

        {logs.isInitialLoading ? (
          <LoadingBlock />
        ) : logs.error ? (
          <ErrorBlock message={logs.error} onRetry={logs.reload} />
        ) : items.length === 0 ? (
          <EmptyBlock label="조건에 맞는 로그가 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left">
              <thead className="text-text-secondary bg-background-surface border-border-strong text-caption-12 border-b">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <Checkbox
                      aria-label="이 페이지의 미평가 전체 선택"
                      checked={
                        selectedIds.length > 0 && selectedIds.length === pendingOnPage.length
                      }
                      indeterminate={
                        selectedIds.length > 0 && selectedIds.length < pendingOnPage.length
                      }
                      disabled={pendingOnPage.length === 0}
                      onChange={toggleAllPending}
                    />
                  </th>
                  <th className="w-8 px-1 py-2" />
                  <th className="px-3 py-2 font-medium">질문</th>
                  <th className="w-24 px-3 py-2 font-medium">답변 유형</th>
                  <th className="w-24 px-3 py-2 font-medium">상태</th>
                  <th className="w-20 px-3 py-2 font-medium">판정</th>
                  <th className="w-36 px-3 py-2 font-medium">시각</th>
                  <th className="w-28 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isExpanded = expanded === item.qna_uuid;
                  const isSelected = selectedIds.includes(item.qna_uuid);

                  return (
                    <Fragment key={item.qna_uuid}>
                      <tr
                        className={cn(
                          'hover:bg-fill-hover border-border-default border-b transition-colors',
                          isSelected && 'bg-primary-soft',
                          isExpanded && 'border-b-0',
                        )}
                      >
                        <td className="px-3 py-3">
                          <Checkbox
                            aria-label={`${item.raw_query} 선택`}
                            checked={isSelected}
                            disabled={!isRunnable(item)}
                            onChange={(event) =>
                              setSelectedIds(
                                event.target.checked
                                  ? [...selectedIds, item.qna_uuid].slice(0, EVALUATION_RUN_MAX)
                                  : selectedIds.filter((id) => id !== item.qna_uuid),
                              )
                            }
                          />
                        </td>

                        <td className="px-1 py-2.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={isExpanded ? '접기' : '펼치기'}
                            onClick={() => setExpanded(isExpanded ? null : item.qna_uuid)}
                          >
                            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                          </Button>
                        </td>

                        <td className="px-3 py-3">
                          <p className="text-sm">{item.raw_query}</p>
                          <p className="text-text-secondary truncate text-xs">
                            → {item.cleaned_query}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <Badge tone="outline">{item.answer_type}</Badge>
                        </td>

                        <td className="px-3 py-3">
                          <Badge tone={STATUS_TONE[item.status]}>
                            {QNA_STATUS_LABELS[item.status]}
                          </Badge>
                        </td>

                        <td className="px-3 py-3">
                          {item.status === 'evaluated' ? (
                            <Link
                              to={`/evaluations?qna=${encodeURIComponent(item.qna_uuid)}`}
                              title="평가 상세 보기"
                            >
                              <VerdictBadge verdict={item.verdict} />
                            </Link>
                          ) : (
                            <span className="text-text-secondary text-xs">-</span>
                          )}
                        </td>

                        <td className="text-text-secondary px-3 py-3 text-xs">
                          {formatDateTime(item.created_at)}
                        </td>

                        <td className="px-3 py-3 text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={!isRunnable(item) || runningId === item.qna_uuid}
                            title={
                              isRunnable(item)
                                ? '이 턴만 지금 채점합니다'
                                : '인사·잡담이라 채점 대상이 아닙니다'
                            }
                            onClick={() => void handleRunOne(item)}
                          >
                            {runningId === item.qna_uuid ? (
                              <Spinner className="size-3" />
                            ) : (
                              <PlayIcon />
                            )}
                            {item.status === 'evaluated' ? '재실행' : '평가'}
                          </Button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-border-default border-b">
                          <td colSpan={8} className="bg-background-surface px-12 py-4">
                            <QnaAnswer qnaUuid={item.qna_uuid} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {logs.data && (
          <div className="border-border-strong border-t px-5 py-3">
            <Pagination
              total={logs.data.total}
              limit={logs.data.limit}
              offset={logs.data.offset}
              onOffsetChange={(next) => updateParams({ offset: String(next) }, false)}
              onLimitChange={(next) => updateParams({ limit: String(next) })}
            />
          </div>
        )}
      </section>
    </div>
  );
}

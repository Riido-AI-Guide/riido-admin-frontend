import { PlayIcon, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { toUserMessage } from '@/api/client';
import { listEvaluations, runEvaluation } from '@/api/console';
import type { AnswerEvaluationOut } from '@/api/types';
import { ANSWER_TYPES, EVALUATION_ISSUES, ISSUE_LABELS, answerTypeLabel } from '@/api/types';
import { EvaluationPanel } from '@/components/console/EvaluationPanel';
import { Pagination } from '@/components/console/Pagination';
import { ScoreChip, VerdictBadge } from '@/components/console/Score';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/console/StateBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, NativeSelect } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useDebounced } from '@/hooks/useDebounced';
import { useResource } from '@/hooks/useResource';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';

export default function EvaluationsPage() {
  const [params, setParams] = useSearchParams();
  const { push } = useToast();

  const q = params.get('q') ?? '';
  const verdict = params.get('verdict') ?? '';
  const issue = params.get('issue') ?? '';
  const answerType = params.get('answer_type') ?? '';
  const limit = Number(params.get('limit') ?? 20);
  const offset = Number(params.get('offset') ?? 0);
  const selected = params.get('qna');

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

  const evaluations = useResource(
    () =>
      listEvaluations({
        q: q || undefined,
        verdict: verdict || undefined,
        issue: issue || undefined,
        answer_type: answerType || undefined,
        limit,
        offset,
      }),
    [q, verdict, issue, answerType, limit, offset],
  );

  const [runningId, setRunningId] = useState<string | null>(null);

  const answerTypeOptions = useMemo(() => {
    // 정해진 유형은 항상 이 순서로 두고, 서버가 모르는 값을 주면 뒤에 붙인다.
    const values = new Set<string>(ANSWER_TYPES);
    for (const item of evaluations.data?.items ?? []) values.add(item.answer_type);
    if (answerType) values.add(answerType);
    return [...values];
  }, [evaluations.data, answerType]);

  const handleRun = async (item: AnswerEvaluationOut) => {
    setRunningId(item.qna_uuid);
    try {
      const updated = await runEvaluation(item.qna_uuid);
      evaluations.setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((row) =>
                row.qna_uuid === updated.qna_uuid ? updated : row,
              ),
            }
          : current,
      );
      push(`재평가를 마쳤습니다. 판정은 ${updated.verdict}입니다.`, 'success');
    } catch (cause) {
      push(toUserMessage(cause), 'error');
    } finally {
      setRunningId(null);
    }
  };

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
              aria-label="평가 검색"
            />
          </div>

          <NativeSelect
            className="w-28"
            value={verdict}
            onChange={(event) => updateParams({ verdict: event.target.value || null })}
            aria-label="판정"
          >
            <option value="">판정 전체</option>
            <option value="pass">pass</option>
            <option value="fail">fail</option>
          </NativeSelect>

          <NativeSelect
            className="w-36"
            value={issue}
            onChange={(event) => updateParams({ issue: event.target.value || null })}
            aria-label="문제 유형"
          >
            <option value="">문제 유형 전체</option>
            {EVALUATION_ISSUES.map((option) => (
              <option key={option} value={option}>
                {ISSUE_LABELS[option]}
              </option>
            ))}
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
                {answerTypeLabel(option)}
              </option>
            ))}
          </NativeSelect>

          <Button variant="ghost" size="sm" onClick={evaluations.reload} className="ml-auto">
            새로고침
          </Button>
        </div>

        {evaluations.isInitialLoading ? (
          <LoadingBlock />
        ) : evaluations.error ? (
          <ErrorBlock message={evaluations.error} onRetry={evaluations.reload} />
        ) : evaluations.data && evaluations.data.items.length === 0 ? (
          <EmptyBlock label="조건에 맞는 평가가 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left">
              <thead className="text-text-secondary bg-background-surface border-border-strong text-caption-12 border-b">
                <tr>
                  <th className="px-3 py-2 font-medium">질문</th>
                  <th className="w-24 px-3 py-2 font-medium">답변 유형</th>
                  <th className="w-20 px-3 py-2 font-medium">판정</th>
                  <th className="w-56 px-3 py-2 font-medium">점수</th>
                  <th className="w-40 px-3 py-2 font-medium">문제 유형</th>
                  <th className="w-36 px-3 py-2 font-medium">채점 시각</th>
                  <th className="w-24 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {evaluations.data?.items.map((item) => (
                  <tr
                    key={item.qna_uuid}
                    className={cn(
                      'hover:bg-fill-hover border-border-default cursor-pointer border-b transition-colors',
                      item.qna_uuid === selected && 'bg-primary-soft',
                    )}
                    onClick={() => updateParams({ qna: item.qna_uuid }, false)}
                  >
                    <td className="px-3 py-3">
                      <p className="text-sm">{item.raw_query}</p>
                      <p className="text-text-secondary truncate text-xs">→ {item.cleaned_query}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone="outline">{answerTypeLabel(item.answer_type)}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <VerdictBadge verdict={item.verdict} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <ScoreChip label="충실" value={item.faithfulness} />
                        <ScoreChip label="답변" value={item.answer_relevance} />
                        <ScoreChip label="문서" value={item.context_relevance} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(item.issues ?? []).map((value) => (
                          <Badge key={value} tone="danger">
                            {ISSUE_LABELS[value] ?? value}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="text-text-secondary px-3 py-3 text-xs">
                      {formatDateTime(item.updated_at)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={runningId === item.qna_uuid}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRun(item);
                        }}
                      >
                        {runningId === item.qna_uuid ? (
                          <Spinner className="size-3" />
                        ) : (
                          <PlayIcon />
                        )}
                        재실행
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {evaluations.data && (
          <div className="border-border-strong border-t px-5 py-3">
            <Pagination
              total={evaluations.data.total}
              limit={evaluations.data.limit}
              offset={evaluations.data.offset}
              onOffsetChange={(next) => updateParams({ offset: String(next) }, false)}
              onLimitChange={(next) => updateParams({ limit: String(next) })}
            />
          </div>
        )}
      </section>

      {selected && (
        <EvaluationPanel
          key={selected}
          qnaUuid={selected}
          onClose={() => updateParams({ qna: null }, false)}
          onChanged={evaluations.reload}
        />
      )}
    </div>
  );
}

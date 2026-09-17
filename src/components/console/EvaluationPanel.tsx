import { PlayIcon } from 'lucide-react';
import { useState } from 'react';

import { toUserMessage } from '@/api/client';
import { getEvaluation, listQna, runEvaluation } from '@/api/console';
import type { AnswerEvaluationOut } from '@/api/types';
import { ISSUE_LABELS } from '@/api/types';
import { Drawer } from '@/components/console/Drawer';
import { ScoreBar, VerdictBadge } from '@/components/console/Score';
import { ErrorBlock, LoadingBlock } from '@/components/console/StateBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useResource } from '@/hooks/useResource';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/date';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-text-secondary mb-1 text-xs">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

type EvaluationPanelProps = {
  qnaUuid: string;
  onClose: () => void;
  /** 재실행으로 점수가 바뀌었으니 목록을 다시 읽으라는 신호 */
  onChanged: () => void;
};

export function EvaluationPanel({ qnaUuid, onClose, onChanged }: EvaluationPanelProps) {
  const { push } = useToast();
  const [isRunning, setIsRunning] = useState(false);

  const resource = useResource(async () => {
    const [evaluation, log] = await Promise.all([
      getEvaluation(qnaUuid),
      // 답변 본문은 평가 API에 없다. 무엇을 채점한 건지 보려면 로그에서 가져온다.
      listQna({ qna_uuid: [qnaUuid], include_answer: true })
        .then((page) => page.items[0] ?? null)
        .catch(() => null),
    ]);
    return { evaluation, log };
  }, [qnaUuid]);

  const evaluation: AnswerEvaluationOut | null = resource.data?.evaluation ?? null;
  const log = resource.data?.log ?? null;

  const handleRerun = async () => {
    setIsRunning(true);
    try {
      const updated = await runEvaluation(qnaUuid);
      resource.setData((current) => (current ? { ...current, evaluation: updated } : current));
      push(`재평가를 마쳤습니다. 판정은 ${updated.verdict}입니다.`, 'success');
      onChanged();
    } catch (cause) {
      push(toUserMessage(cause), 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Drawer
      label="평가 상세"
      onClose={onClose}
      header={
        <>
          <p className="text-text-secondary truncate font-mono text-xs">{qnaUuid}</p>
          <h2 className="text-text-primary text-title-18 truncate font-semibold tracking-[-0.4px]">
            {evaluation?.raw_query ?? '불러오는 중…'}
          </h2>
        </>
      }
      footer={
        <>
          <p className="text-text-secondary text-xs">
            판정자 LLM을 1회 호출합니다 — 수 초 걸립니다.
          </p>
          <Button size="sm" onClick={handleRerun} disabled={isRunning}>
            {isRunning ? <Spinner className="size-3.5" /> : <PlayIcon />}
            평가 재실행
          </Button>
        </>
      }
    >
      {resource.isInitialLoading ? (
        <LoadingBlock />
      ) : resource.error ? (
        <ErrorBlock message={resource.error} onRetry={resource.reload} />
      ) : evaluation ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={evaluation.verdict} />
            <Badge tone="outline">{evaluation.answer_type}</Badge>
            {evaluation.conversation_id && (
              <Badge tone="neutral">대화 {evaluation.conversation_id}</Badge>
            )}
          </div>

          <div className="bg-background-surface border-border-neutral-strong rounded-12 mb-4 border p-4">
            <ScoreBar label="충실도" value={evaluation.faithfulness} />
            <div className="h-2" />
            <ScoreBar label="답변 관련성" value={evaluation.answer_relevance} />
            <div className="h-2" />
            <ScoreBar label="문서 관련성" value={evaluation.context_relevance} />
          </div>

          <Field label="문제 유형">
            {evaluation.issues && evaluation.issues.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {evaluation.issues.map((issue) => (
                  <Badge key={issue} tone="danger">
                    {ISSUE_LABELS[issue] ?? issue}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-text-secondary text-xs">없음</span>
            )}
          </Field>

          {evaluation.reason && (
            <Field label="감점 사유">
              <p className="bg-background-surface-soft border-border-neutral-strong rounded-12 border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                {evaluation.reason}
              </p>
            </Field>
          )}

          <Field label="사용자 질문">{evaluation.raw_query}</Field>
          <Field label="검색에 쓴 질문">{evaluation.cleaned_query}</Field>

          {log?.answer_text && (
            <Field label="답변">
              <p className="bg-background-surface-soft border-border-neutral-strong rounded-12 max-h-64 overflow-y-auto border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                {log.answer_text}
              </p>
            </Field>
          )}

          {log?.retrieved_doc_ids && log.retrieved_doc_ids.length > 0 && (
            <Field label="검색된 문서">
              <ul className="flex flex-wrap gap-1.5">
                {log.retrieved_doc_ids.map((docId) => (
                  <li
                    key={docId}
                    className="bg-background-surface border-border-strong rounded-6 border px-1.5 py-0.5 font-mono text-xs"
                  >
                    {docId}
                  </li>
                ))}
              </ul>
            </Field>
          )}

          <div className="text-text-secondary mt-4 flex flex-wrap gap-4 text-xs">
            <span>최초 채점 {formatDateTime(evaluation.created_at)}</span>
            <span>마지막 갱신 {formatDateTime(evaluation.updated_at)}</span>
          </div>
        </>
      ) : null}
    </Drawer>
  );
}

import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { getFeedback } from '@/api/console';
import { AGREEMENT_LABELS, ISSUE_LABELS, REASON_LABELS, answerTypeLabel } from '@/api/types';
import { Drawer } from '@/components/console/Drawer';
import { ScoreBar, VerdictBadge } from '@/components/console/Score';
import { ErrorBlock, LoadingBlock } from '@/components/console/StateBlock';
import { Badge } from '@/components/ui/badge';
import { useResource } from '@/hooks/useResource';
import { formatDateTime } from '@/lib/date';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-text-secondary mb-1 text-xs">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function FeedbackPanel({ qnaUuid, onClose }: { qnaUuid: string; onClose: () => void }) {
  const resource = useResource(() => getFeedback(qnaUuid), [qnaUuid]);
  const feedback = resource.data;

  const isGood = feedback?.rating === 'GOOD';
  const hasScores =
    feedback?.faithfulness != null &&
    feedback.answer_relevance != null &&
    feedback.context_relevance != null;

  return (
    <Drawer
      label="사용자 피드백 상세"
      onClose={onClose}
      header={
        <>
          <p className="text-text-secondary truncate font-mono text-xs">{qnaUuid}</p>
          <h2 className="text-text-primary text-title-18 truncate font-semibold tracking-[-0.4px]">
            {feedback?.raw_query ?? (resource.isInitialLoading ? '불러오는 중…' : '질문 기록 없음')}
          </h2>
        </>
      }
      footer={
        feedback?.agreement !== 'unevaluated' && feedback ? (
          <>
            <p className="text-text-secondary text-xs">
              판정자 점수는 평가 화면에서 다시 돌릴 수 있습니다.
            </p>
            <Link
              to={`/evaluations?qna=${encodeURIComponent(qnaUuid)}`}
              className="text-xs underline underline-offset-2"
            >
              평가 상세로 이동
            </Link>
          </>
        ) : undefined
      }
    >
      {resource.isInitialLoading ? (
        <LoadingBlock />
      ) : resource.error ? (
        <ErrorBlock message={resource.error} onRetry={resource.reload} />
      ) : feedback ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone={isGood ? 'success' : 'danger'}>
              {isGood ? <ThumbsUpIcon className="size-3" /> : <ThumbsDownIcon className="size-3" />}
              {isGood ? '좋아요' : '싫어요'}
            </Badge>
            {feedback.reason && (
              <Badge tone="outline">{REASON_LABELS[feedback.reason] ?? feedback.reason}</Badge>
            )}
            <Badge
              tone={
                feedback.agreement === 'mismatch'
                  ? 'warning'
                  : feedback.agreement === 'match'
                    ? 'neutral'
                    : 'outline'
              }
            >
              판정자와 {AGREEMENT_LABELS[feedback.agreement]}
            </Badge>
            {feedback.answer_type && (
              <Badge tone="outline">{answerTypeLabel(feedback.answer_type)}</Badge>
            )}
          </div>

          <div className="bg-background-surface border-border-neutral-strong rounded-12 mb-4 border p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium">판정자 평가</span>
              <VerdictBadge verdict={feedback.verdict} />
            </div>

            {hasScores ? (
              <>
                <ScoreBar label="충실도" value={feedback.faithfulness ?? 0} />
                <div className="h-2" />
                <ScoreBar label="답변 관련성" value={feedback.answer_relevance ?? 0} />
                <div className="h-2" />
                <ScoreBar label="문서 관련성" value={feedback.context_relevance ?? 0} />
              </>
            ) : (
              <p className="text-text-secondary text-xs">
                아직 채점되지 않은 턴입니다. 질의응답 로그에서 평가를 돌리면 대조에 들어옵니다.
              </p>
            )}

            {feedback.issues && feedback.issues.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {feedback.issues.map((issue) => (
                  <Badge key={issue} tone="danger">
                    {ISSUE_LABELS[issue] ?? issue}
                  </Badge>
                ))}
              </div>
            )}

            {feedback.eval_reason && (
              <p className="bg-background-answer border-border-neutral-strong rounded-12 mt-3 border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                {feedback.eval_reason}
              </p>
            )}
          </div>

          {feedback.raw_query ? (
            <>
              <Field label="사용자 질문">{feedback.raw_query}</Field>
              {feedback.cleaned_query && (
                <Field label="검색에 쓴 질문">{feedback.cleaned_query}</Field>
              )}
            </>
          ) : (
            <Field label="질문">
              <span className="text-text-secondary text-xs">
                우리 로그에 남지 않은 턴입니다(백엔드가 qna_uuid를 남기기 전 메시지).
              </span>
            </Field>
          )}

          {feedback.answer_text && (
            <Field label="사용자가 본 답변">
              <p className="bg-background-surface-soft border-border-neutral-strong rounded-12 max-h-72 overflow-y-auto border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                {feedback.answer_text}
              </p>
            </Field>
          )}

          {feedback.retrieved_doc_ids && feedback.retrieved_doc_ids.length > 0 && (
            <Field label="그때 검색된 문서">
              <ul className="flex flex-wrap gap-1.5">
                {feedback.retrieved_doc_ids.map((docId) => (
                  <li key={docId}>
                    <Link
                      to={`/documents?doc=${encodeURIComponent(docId)}`}
                      className="bg-background-surface border-border-strong hover:bg-fill-hover rounded-6 inline-block border px-1.5 py-0.5 font-mono text-xs"
                    >
                      {docId}
                    </Link>
                  </li>
                ))}
              </ul>
            </Field>
          )}

          <div className="text-text-secondary mt-4 flex flex-wrap gap-4 text-xs">
            <span>피드백 {formatDateTime(feedback.feedback_created_at)}</span>
            <span>답변 {formatDateTime(feedback.answered_at)}</span>
            <span>메시지 #{feedback.message_id}</span>
            {feedback.conversation_id && <span>대화 {feedback.conversation_id}</span>}
          </div>
        </>
      ) : null}
    </Drawer>
  );
}

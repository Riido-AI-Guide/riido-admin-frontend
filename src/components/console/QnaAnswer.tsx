import { listQna } from '@/api/console';
import { ErrorBlock, LoadingBlock } from '@/components/console/StateBlock';
import { useResource } from '@/hooks/useResource';

/** 목록에서 펼친 행. 답변 본문은 목록 응답에 없어 그 턴만 다시 읽는다. */
export function QnaAnswer({ qnaUuid }: { qnaUuid: string }) {
  const resource = useResource(
    () => listQna({ qna_uuid: [qnaUuid], include_answer: true }).then((page) => page.items[0]),
    [qnaUuid],
  );

  if (resource.isInitialLoading) return <LoadingBlock label="답변을 불러오는 중…" />;
  if (resource.error) return <ErrorBlock message={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return null;

  const log = resource.data;

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <p className="text-muted-foreground mb-1">검색에 쓴 질문</p>
        <p>{log.cleaned_query}</p>
      </div>

      <div>
        <p className="text-muted-foreground mb-1">답변</p>
        <p className="bg-background max-h-64 overflow-y-auto rounded-lg border p-3 leading-relaxed whitespace-pre-wrap">
          {log.answer_text || '답변 본문이 없습니다.'}
        </p>
      </div>

      {log.retrieved_doc_ids && log.retrieved_doc_ids.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-1">검색된 문서</p>
          <ul className="flex flex-wrap gap-1.5">
            {log.retrieved_doc_ids.map((docId) => (
              <li key={docId} className="border-border rounded-md border px-1.5 py-0.5 font-mono">
                {docId}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

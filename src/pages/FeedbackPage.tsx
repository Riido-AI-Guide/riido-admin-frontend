import { SearchIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { getFeedbackStats, listFeedback } from '@/api/console';
import type { Agreement, FeedbackRating } from '@/api/types';
import { AGREEMENT_LABELS, FEEDBACK_REASONS, ISSUE_LABELS, REASON_LABELS } from '@/api/types';
import { FeedbackPanel } from '@/components/console/FeedbackPanel';
import { FeedbackStats } from '@/components/console/FeedbackStats';
import { Pagination } from '@/components/console/Pagination';
import { ScoreChip, VerdictBadge } from '@/components/console/Score';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/console/StateBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, NativeSelect } from '@/components/ui/input';
import { useDebounced } from '@/hooks/useDebounced';
import { useResource } from '@/hooks/useResource';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';

const AGREEMENT_TONE: Record<Agreement, 'neutral' | 'warning' | 'outline'> = {
  match: 'neutral',
  mismatch: 'warning',
  unevaluated: 'outline',
};

export default function FeedbackPage() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const rating = params.get('rating') ?? '';
  const reason = params.get('reason') ?? '';
  const agreement = params.get('agreement') ?? '';
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

  const feedback = useResource(
    () =>
      listFeedback({
        q: q || undefined,
        rating: rating || undefined,
        reason: reason || undefined,
        agreement: agreement || undefined,
        limit,
        offset,
      }),
    [q, rating, reason, agreement, limit, offset],
  );

  const stats = useResource(() => getFeedbackStats(), []);

  // 항목은 좋아요/싫어요에 따라 다르다. 등급을 안 고르면 양쪽을 모두 펼친다.
  const reasonOptions = rating
    ? FEEDBACK_REASONS[rating as FeedbackRating]
    : [...FEEDBACK_REASONS.GOOD, ...FEEDBACK_REASONS.BAD];

  return (
    <div>
      <FeedbackStats
        stats={stats.data}
        error={stats.error}
        isLoading={stats.isLoading}
        onReload={stats.reload}
        onSelect={(nextRating, nextAgreement) =>
          updateParams({ rating: nextRating, agreement: nextAgreement, reason: null })
        }
      />

      <section className="border-border bg-card rounded-xl border">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="relative min-w-56 flex-1">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="질문 검색"
              className="pl-8"
              aria-label="피드백 검색"
            />
          </div>

          <NativeSelect
            className="w-28"
            value={rating}
            onChange={(event) => updateParams({ rating: event.target.value || null, reason: null })}
            aria-label="사용자 평가"
          >
            <option value="">평가 전체</option>
            <option value="GOOD">좋아요</option>
            <option value="BAD">싫어요</option>
          </NativeSelect>

          <NativeSelect
            className="w-36"
            value={reason}
            onChange={(event) => updateParams({ reason: event.target.value || null })}
            aria-label="사용자가 고른 항목"
          >
            <option value="">항목 전체</option>
            {reasonOptions.map((option) => (
              <option key={option} value={option}>
                {REASON_LABELS[option] ?? option}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            className="w-32"
            value={agreement}
            onChange={(event) => updateParams({ agreement: event.target.value || null })}
            aria-label="판정자와의 일치 여부"
          >
            <option value="">대조 전체</option>
            <option value="match">일치</option>
            <option value="mismatch">엇갈림</option>
            <option value="unevaluated">미평가</option>
          </NativeSelect>

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              feedback.reload();
              stats.reload();
            }}
          >
            새로고침
          </Button>
        </div>

        {feedback.isInitialLoading ? (
          <LoadingBlock />
        ) : feedback.error ? (
          <ErrorBlock message={feedback.error} onRetry={feedback.reload} />
        ) : feedback.data && feedback.data.items.length === 0 ? (
          <EmptyBlock label="조건에 맞는 피드백이 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] border-collapse text-left">
              <thead className="text-muted-foreground bg-muted/40 text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">질문</th>
                  <th className="w-24 px-3 py-2 font-medium">사용자</th>
                  <th className="w-32 px-3 py-2 font-medium">고른 항목</th>
                  <th className="w-24 px-3 py-2 font-medium">판정자</th>
                  <th className="w-52 px-3 py-2 font-medium">점수</th>
                  <th className="w-24 px-3 py-2 font-medium">대조</th>
                  <th className="w-36 px-3 py-2 font-medium">피드백 시각</th>
                </tr>
              </thead>
              <tbody>
                {feedback.data?.items.map((item) => {
                  const isGood = item.rating === 'GOOD';
                  // qna_uuid가 없으면 단건 API로 되짚을 수 없다.
                  const canOpen = Boolean(item.qna_uuid);

                  return (
                    <tr
                      key={item.message_id}
                      className={cn(
                        'border-b transition-colors',
                        canOpen ? 'hover:bg-muted/60 cursor-pointer' : 'cursor-default',
                        item.qna_uuid && item.qna_uuid === selected && 'bg-muted',
                      )}
                      title={canOpen ? undefined : '우리 로그에 없는 턴이라 상세를 열 수 없습니다'}
                      onClick={() => canOpen && updateParams({ qna: item.qna_uuid ?? null }, false)}
                    >
                      <td className="px-3 py-2.5">
                        {item.raw_query ? (
                          <p className="text-sm">{item.raw_query}</p>
                        ) : (
                          <p className="text-muted-foreground text-sm italic">
                            로그에 없는 턴 (메시지 #{item.message_id})
                          </p>
                        )}
                        {item.answer_type && (
                          <p className="text-muted-foreground text-xs">{item.answer_type}</p>
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        <Badge tone={isGood ? 'success' : 'danger'}>
                          {isGood ? (
                            <ThumbsUpIcon className="size-3" />
                          ) : (
                            <ThumbsDownIcon className="size-3" />
                          )}
                          {isGood ? '좋아요' : '싫어요'}
                        </Badge>
                      </td>

                      <td className="px-3 py-2.5">
                        {item.reason ? (
                          <Badge tone="outline">{REASON_LABELS[item.reason] ?? item.reason}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        <VerdictBadge verdict={item.verdict} />
                      </td>

                      <td className="px-3 py-2.5">
                        {item.faithfulness != null &&
                        item.answer_relevance != null &&
                        item.context_relevance != null ? (
                          <div className="flex flex-wrap gap-1">
                            <ScoreChip label="충실" value={item.faithfulness} />
                            <ScoreChip label="답변" value={item.answer_relevance} />
                            <ScoreChip label="문서" value={item.context_relevance} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                        {item.issues && item.issues.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.issues.map((issue) => (
                              <Badge key={issue} tone="danger">
                                {ISSUE_LABELS[issue] ?? issue}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        <Badge tone={AGREEMENT_TONE[item.agreement]}>
                          {AGREEMENT_LABELS[item.agreement]}
                        </Badge>
                      </td>

                      <td className="text-muted-foreground px-3 py-2.5 text-xs">
                        {formatDateTime(item.feedback_created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {feedback.data && (
          <div className="border-t px-4 py-3">
            <Pagination
              total={feedback.data.total}
              limit={feedback.data.limit}
              offset={feedback.data.offset}
              onOffsetChange={(next) => updateParams({ offset: String(next) }, false)}
              onLimitChange={(next) => updateParams({ limit: String(next) })}
            />
          </div>
        )}
      </section>

      {selected && (
        <FeedbackPanel
          key={selected}
          qnaUuid={selected}
          onClose={() => updateParams({ qna: null }, false)}
        />
      )}
    </div>
  );
}

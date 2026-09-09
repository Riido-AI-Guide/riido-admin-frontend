import { ExternalLinkIcon, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { getIndexStatus, listAnswerUnits } from '@/api/console';
import type { AnswerUnitListItem, ViewTypeCounts } from '@/api/types';
import { VIEW_TYPE_LABELS } from '@/api/types';
import { DocPanel } from '@/components/console/DocPanel';
import { Pagination } from '@/components/console/Pagination';
import { ReviewPanel } from '@/components/console/ReviewPanel';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/console/StateBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, NativeSelect } from '@/components/ui/input';
import { useDebounced } from '@/hooks/useDebounced';
import { useHealth } from '@/hooks/useHealth';
import { useResource } from '@/hooks/useResource';
import { cn } from '@/lib/utils';

function totalUnits(viewTypes?: ViewTypeCounts): number {
  return Object.values(viewTypes ?? {}).reduce((sum, count) => sum + count, 0);
}

function DocRow({
  item,
  isSelected,
  onSelect,
}: {
  item: AnswerUnitListItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const units = totalUnits(item.view_types);
  const entries = Object.entries(item.view_types ?? {});

  return (
    <tr
      className={cn(
        'hover:bg-muted/60 cursor-pointer border-b transition-colors',
        isSelected && 'bg-muted',
      )}
      onClick={onSelect}
    >
      <td className="px-3 py-2.5">
        <p className="text-sm font-medium">{item.title}</p>
        <p className="text-muted-foreground truncate text-xs">{item.section}</p>
        <p className="text-muted-foreground truncate font-mono text-[11px]">{item.doc_id}</p>
      </td>

      <td className="px-3 py-2.5">
        <Badge tone="outline">{item.source_type}</Badge>
      </td>

      <td className="px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {units === 0 ? (
            <Badge tone="danger">문장 없음</Badge>
          ) : (
            <>
              <span className="text-sm font-semibold tabular-nums">{units}</span>
              {entries.map(([type, count]) => (
                <Badge key={type} tone="neutral">
                  {VIEW_TYPE_LABELS[type] ?? type} {count}
                </Badge>
              ))}
            </>
          )}
        </div>
      </td>

      <td className="px-3 py-2.5 text-right">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            원문 <ExternalLinkIcon className="size-3" />
          </a>
        )}
      </td>
    </tr>
  );
}

export default function DocumentsPage() {
  const [params, setParams] = useSearchParams();
  const health = useHealth();

  const q = params.get('q') ?? '';
  const sourceType = params.get('source') ?? '';
  const limit = Number(params.get('limit') ?? 20);
  const offset = Number(params.get('offset') ?? 0);
  const selectedDocId = params.get('doc');

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

  useEffect(() => {
    if (debouncedKeyword === q) return;
    updateParams({ q: debouncedKeyword || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  const documents = useResource(
    () =>
      listAnswerUnits({ q: q || undefined, source_type: sourceType || undefined, limit, offset }),
    [q, sourceType, limit, offset],
  );

  const indexStatus = useResource(() => getIndexStatus(), []);

  const sourceOptions = useMemo(() => {
    const values = new Set((documents.data?.items ?? []).map((item) => item.source_type));
    if (sourceType) values.add(sourceType);
    return [...values].sort();
  }, [documents.data, sourceType]);

  const missingCount = useMemo(
    () => (documents.data?.items ?? []).filter((item) => totalUnits(item.view_types) === 0).length,
    [documents.data],
  );

  const handleSaved = () => {
    documents.reload();
    indexStatus.reload();
    health.reload();
  };

  return (
    <div>
      <ReviewPanel
        status={indexStatus.data}
        error={indexStatus.error}
        isLoading={indexStatus.isLoading}
        onReload={indexStatus.reload}
        onSelectDoc={(docId) => updateParams({ doc: docId }, false)}
      />

      <section className="border-border bg-card rounded-xl border">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="relative min-w-56 flex-1">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="제목·섹션·본문 검색"
              className="pl-8"
              aria-label="근거 문서 검색"
            />
          </div>

          <NativeSelect
            className="w-36"
            value={sourceType}
            onChange={(event) => updateParams({ source: event.target.value || null })}
            aria-label="원본 유형"
          >
            <option value="">전체 유형</option>
            {sourceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>

          {missingCount > 0 && (
            <Badge tone="danger">이 페이지에 문장 없는 문서 {missingCount}건</Badge>
          )}

          <Button variant="ghost" size="sm" onClick={documents.reload} className="ml-auto">
            새로고침
          </Button>
        </div>

        {documents.isInitialLoading ? (
          <LoadingBlock />
        ) : documents.error ? (
          <ErrorBlock message={documents.error} onRetry={documents.reload} />
        ) : documents.data && documents.data.items.length === 0 ? (
          <EmptyBlock label="조건에 맞는 근거 문서가 없습니다." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead className="text-muted-foreground bg-muted/40 text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">문서</th>
                  <th className="w-24 px-3 py-2 font-medium">원본</th>
                  <th className="w-72 px-3 py-2 font-medium">연결된 질문 쿼리</th>
                  <th className="w-20 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {documents.data?.items.map((item) => (
                  <DocRow
                    key={item.doc_id}
                    item={item}
                    isSelected={item.doc_id === selectedDocId}
                    onSelect={() => updateParams({ doc: item.doc_id }, false)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {documents.data && (
          <div className="border-t px-4 py-3">
            <Pagination
              total={documents.data.total}
              limit={documents.data.limit}
              offset={documents.data.offset}
              onOffsetChange={(next) => updateParams({ offset: String(next) }, false)}
              onLimitChange={(next) => updateParams({ limit: String(next) })}
            />
          </div>
        )}
      </section>

      {selectedDocId && (
        <DocPanel
          key={selectedDocId}
          docId={selectedDocId}
          onClose={() => updateParams({ doc: null }, false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

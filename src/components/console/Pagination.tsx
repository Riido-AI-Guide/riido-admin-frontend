import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/input';

const PAGE_SIZES = [20, 50, 100];

type PaginationProps = {
  total: number;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
};

export function Pagination({
  total,
  limit,
  offset,
  onOffsetChange,
  onLimitChange,
}: PaginationProps) {
  const size = limit > 0 ? limit : PAGE_SIZES[0];
  const page = Math.floor(offset / size) + 1;
  const lastPage = Math.max(1, Math.ceil(total / size));
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + size, total);

  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs">
      <span className="tabular-nums">
        {from.toLocaleString('ko-KR')}–{to.toLocaleString('ko-KR')} / 총{' '}
        {total.toLocaleString('ko-KR')}건
      </span>

      <div className="flex items-center gap-2">
        <NativeSelect
          className="h-7 w-auto text-xs"
          value={size}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          aria-label="페이지당 건수"
        >
          {PAGE_SIZES.map((value) => (
            <option key={value} value={value}>
              {value}개씩
            </option>
          ))}
        </NativeSelect>

        <Button
          variant="outline"
          size="icon-sm"
          disabled={offset <= 0}
          onClick={() => onOffsetChange(Math.max(0, offset - size))}
          aria-label="이전 페이지"
        >
          <ChevronLeftIcon />
        </Button>
        <span className="tabular-nums">
          {page} / {lastPage}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={offset + size >= total}
          onClick={() => onOffsetChange(offset + size)}
          aria-label="다음 페이지"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}

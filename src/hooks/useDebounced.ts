import { useEffect, useState } from 'react';

/** 검색어처럼 타이핑마다 요청이 나가면 곤란한 값에 쓴다. */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

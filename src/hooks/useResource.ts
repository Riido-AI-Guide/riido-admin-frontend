import { useCallback, useEffect, useState } from 'react';

import { toUserMessage } from '@/api/client';

export type Resource<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  /** 첫 로딩인지. 목록을 다시 부를 때 화면을 비우지 않으려고 구분한다. */
  isInitialLoading: boolean;
  reload: () => void;
  setData: (updater: T | ((current: T | null) => T | null)) => void;
};

type Snapshot<T> = {
  /** 이 결과가 어떤 요청의 것인지. 지금 signature와 다르면 아직 로딩 중이다. */
  signature: string;
  data: T | null;
  error: string | null;
};

/**
 * 화면 하나가 쓰는 GET 하나를 담는다.
 *
 * deps가 바뀌면 다시 부르고, 늦게 도착한 이전 응답은 signature가 달라 버려진다.
 * 로딩 여부는 별도 state가 아니라 "요청 signature != 결과 signature"로 계산한다 —
 * effect 안에서 동기 setState를 하지 않기 위해서다.
 */
export function useResource<T>(loader: () => Promise<T>, deps: unknown[]): Resource<T> {
  const [nonce, setNonce] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    signature: '',
    data: null,
    error: null,
  });

  // deps는 필터·페이지 값처럼 원시값만 넣는다는 전제다.
  const signature = `${JSON.stringify(deps)}#${nonce}`;

  useEffect(() => {
    let cancelled = false;

    loader()
      .then((result) => {
        if (cancelled) return;
        setSnapshot({ signature, data: result, error: null });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setSnapshot((current) => ({
          signature,
          data: current.data,
          error: toUserMessage(cause),
        }));
      });

    return () => {
      cancelled = true;
    };
    // loader는 매 렌더 새로 만들어지므로 signature만 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const isLoading = snapshot.signature !== signature;
  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const setData = useCallback((updater: T | ((current: T | null) => T | null)) => {
    setSnapshot((current) => ({
      ...current,
      data:
        typeof updater === 'function'
          ? (updater as (value: T | null) => T | null)(current.data)
          : updater,
    }));
  }, []);

  return {
    data: snapshot.data,
    // 로딩 중에는 이전 요청의 에러를 남겨두지 않는다.
    error: isLoading ? null : snapshot.error,
    isLoading,
    isInitialLoading: isLoading && snapshot.data === null,
    reload,
    setData,
  };
}

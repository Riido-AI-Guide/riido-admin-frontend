import { createContext, useContext } from 'react';

import type { HealthResponse } from '@/api/types';

export type HealthContextValue = {
  health: HealthResponse | null;
  error: string | null;
  isLoading: boolean;
  /** 적재 건수가 달라지는 작업(문장 저장, 평가 실행) 뒤에 세그먼트 바를 다시 읽는다. */
  reload: () => void;
};

export const HealthContext = createContext<HealthContextValue | null>(null);

export function useHealth(): HealthContextValue {
  const value = useContext(HealthContext);
  if (!value) throw new Error('useHealth는 ConsoleLayout 안에서만 쓸 수 있습니다.');
  return value;
}

/** health의 tables에서 특정 테이블의 행 수를 꺼낸다. 없으면 null(=아직 모름). */
export function tableRows(health: HealthResponse | null, table: string): number | null {
  if (!health?.tables) return null;
  return health.tables.find((item) => item.table === table)?.rows ?? null;
}

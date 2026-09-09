import { createContext, useContext } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

export type ToastContextValue = {
  /** 화면 오른쪽 아래에 잠깐 뜨는 알림. 실패는 tone='error'로 조금 더 오래 남긴다. */
  push: (message: string, tone?: ToastTone) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast는 ToastProvider 안에서만 쓸 수 있습니다.');
  return value;
}

/**
 * lib/theme.ts — 라이트/다크 모드
 *
 * Tailwind v4의 `@custom-variant dark (&:is(.dark *))` 규칙에 맞춰
 * <html>에 `dark` 클래스를 붙였다 떼는 것으로 모드를 바꾼다.
 * 선택은 localStorage에 저장해 새로고침해도 유지한다.
 */
import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'riido.theme';

function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** 앱 시작 시 한 번 호출 — 저장된 모드를 복원한다 (없으면 라이트) */
export function initTheme(): Theme {
  const theme = readStoredTheme() ?? 'light';
  applyTheme(theme);
  return theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? 'light');

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // 저장 실패해도 현재 세션에서는 동작한다
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [],
  );

  return { theme, isDark: theme === 'dark', setTheme, toggleTheme };
}

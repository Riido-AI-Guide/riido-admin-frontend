import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from '@/App.tsx';
import { initTheme } from '@/lib/theme';

// 첫 렌더 전에 저장된 라이트/다크 모드를 <html>에 적용해 깜빡임을 막는다
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

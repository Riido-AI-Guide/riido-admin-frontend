import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import ConsoleLayout from '@/components/layout/ConsoleLayout';
import { ToastProvider } from '@/components/ui/toaster';
import DocumentsPage from '@/pages/DocumentsPage';
import EvaluationsPage from '@/pages/EvaluationsPage';
import FeedbackPage from '@/pages/FeedbackPage';
import QnaLogsPage from '@/pages/QnaLogsPage';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<ConsoleLayout />}>
            <Route path="/" element={<Navigate to="/documents" replace />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/evaluations" element={<EvaluationsPage />} />
            <Route path="/qna" element={<QnaLogsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Route>
          <Route
            path="*"
            element={
              <div className="flex h-screen items-center justify-center text-sm">
                페이지를 찾을 수 없습니다
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

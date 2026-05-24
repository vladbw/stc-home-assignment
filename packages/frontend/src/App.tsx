import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './services/query-client';
import { PresentationsListPage } from './pages/presentations-list-page';

// The editor/presentation js is only loaded on demand
const PresentationEditorPage = lazy(() =>
  import('./pages/presentation-editor-page').then((m) => ({ default: m.PresentationEditorPage })),
);
const PresentationViewerPage = lazy(() =>
  import('./pages/presentation-viewer-page').then((m) => ({ default: m.PresentationViewerPage })),
);

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface text-muted">
      Loading…
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<PresentationsListPage />} />
            <Route path="/presentations/:id" element={<PresentationEditorPage />} />
            <Route path="/presentations/:id/present" element={<PresentationViewerPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

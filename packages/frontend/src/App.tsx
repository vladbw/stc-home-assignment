import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './services/query-client';
import { PresentationsListRoute } from './routes/presentations-list-route';

// The editor and presentation js is only loaded on demand
const EditorRoute = lazy(() =>
  import('./routes/editor-route').then((m) => ({ default: m.EditorRoute })),
);
const PresentationRoute = lazy(() =>
  import('./routes/presentation-route').then((m) => ({ default: m.PresentationRoute })),
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
            <Route path="/" element={<PresentationsListRoute />} />
            <Route path="/presentations/:id" element={<EditorRoute />} />
            <Route path="/presentations/:id/present" element={<PresentationRoute />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

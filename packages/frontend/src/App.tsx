import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './services/query-client';
import { PresentationsListRoute } from './routes/presentations-list-route';
import { EditorRoute } from './routes/editor-route';
import { PresentationRoute } from './routes/presentation-route';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PresentationsListRoute />} />
          <Route path="/presentations/:id" element={<EditorRoute />} />
          <Route path="/presentations/:id/present" element={<PresentationRoute />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePresentationDetail } from '../queries/presentations';
import { Canvas } from '../features/editor/canvas';
import { PageSidebar } from '../features/editor/page-sidebar';
import { Toolbar } from '../features/editor/toolbar';
import { useEditorKeybindings } from '../features/editor/use-editor-keybindings';
import { buttonVariants } from '../components/ui/button';
import { PageShell } from '../components/ui/page-shell';
import { useEditorStore } from '../stores/editor-store';
import { useHistoryStore } from '../stores/history-store';

export function EditorRoute() {
  const { id } = useParams<{ id: string }>();
  const { data: presentation, isLoading, error } = usePresentationDetail(id);

  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const selectedContentId = useEditorStore((s) => s.selectedContentId);
  const reset = useEditorStore((s) => s.reset);
  const clearHistory = useHistoryStore((s) => s.clear);

  // Start every editor visit from clean local state, and clear again when
  // leaving so undo/redo history never leaks into the next editor session.
  useEffect(() => {
    reset();
    clearHistory();

    return () => {
      reset();
      clearHistory();
    };
  }, [id, reset, clearHistory]);

  // Keep the active page id valid against the latest data. If the current
  // active page disappears (e.g. just deleted, or we just navigated to a
  // presentation that doesn't contain that page), fall back to the first.
  useEffect(() => {
    if (!presentation) return;
    const stillExists = presentation.pages.some((p) => p.id === activePageId);
    if (!stillExists) {
      setActivePage(presentation.pages[0]?.id ?? null);
    }
  }, [presentation, activePageId, setActivePage]);

  useEditorKeybindings(id, presentation);

  if (isLoading) {
    return (
      <PageShell className="grid place-items-center">
        <p className="text-muted">Loading…</p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell className="grid place-items-center px-5 text-center">
        <div className="grid gap-4">
          <p className="text-red-300">{error.message}</p>
          <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
            ← Back to presentations
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!presentation) return null;

  const activePage =
    presentation.pages.find((p) => p.id === activePageId) ?? presentation.pages[0] ?? null;
  const selectedItem =
    activePage?.content.find((c) => c.id === selectedContentId) ?? null;

  return (
    <PageShell className="grid h-screen grid-rows-[auto_auto_1fr] overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border bg-panel-raised px-4 py-3">
        <Link to="/" className={buttonVariants({ size: 'icon', variant: 'secondary' })}>
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
          {presentation.title}
        </h1>
        <Link
          to={`/presentations/${presentation.id}/present`}
          className={buttonVariants({ variant: 'primary' })}
        >
          ▶ Present
        </Link>
      </header>
      <Toolbar
        presentationId={presentation.id}
        activePage={activePage}
        selectedItem={selectedItem}
      />
      <div className="grid min-h-0 grid-cols-[minmax(160px,220px)_1fr] overflow-hidden">
        <PageSidebar presentation={presentation} />
        <Canvas page={activePage} presentationId={presentation.id} />
      </div>
    </PageShell>
  );
}

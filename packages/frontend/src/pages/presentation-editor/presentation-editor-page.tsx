import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePresentationDetail } from '../../queries/presentations';
import { EditorHeader } from '../../features/editor/editor-header';
import { EditorWorkspace } from '../../features/editor/editor-workspace';
import { Toolbar } from '../../features/editor/toolbar';
import { useEditorKeybindings } from '../../features/editor/use-editor-keybindings';
import { buttonVariants } from '../../generic-components/button';
import { PageShell } from '../../generic-components/page-shell';
import { useEditorStore } from '../../stores/editor-store';
import { useHistoryStore } from '../../stores/history-store';


// The page where we can edit the contents of a presentation
export function PresentationEditorPage() {
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

  // Keep the active page id valid against the latest data.
  useEffect(() => {
    if (!presentation) return;
    const stillExists = presentation.pages.some((p) => p.id === activePageId);
    if (!stillExists) {
      setActivePage(presentation.pages[0]?.id ?? null);
    }
  }, [presentation, activePageId, setActivePage]);

  useEditorKeybindings(id, presentation);

  // Track previous-id so we only reset *between* presentations, not on every
  // mount. Used by the cleanup logic above (which also fires on actual unmount).
  const prevIdRef = useRef(id);
  prevIdRef.current = id;

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
      <EditorHeader presentation={presentation} />
      <Toolbar
        presentationId={presentation.id}
        activePage={activePage}
        selectedItem={selectedItem}
      />
      <EditorWorkspace presentation={presentation} activePage={activePage} />
    </PageShell>
  );
}

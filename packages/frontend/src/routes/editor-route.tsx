import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePresentationDetail } from '../queries/presentations';
import { Canvas } from '../features/editor/canvas';
import { PageSidebar } from '../features/editor/page-sidebar';
import { Toolbar } from '../features/editor/toolbar';
import { useEditorStore } from '../stores/editor-store';
import styles from './editor-route.module.css';

export function EditorRoute() {
  const { id } = useParams<{ id: string }>();
  const { data: presentation, isLoading, error } = usePresentationDetail(id);

  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const selectedContentId = useEditorStore((s) => s.selectedContentId);
  const reset = useEditorStore((s) => s.reset);

  // Reset editor state only when navigating between *different* presentations.
  // We keep state across editor↔presentation hops so the user returns to the
  // same slide after a presentation. On initial mount, prevIdRef === id so
  // no reset fires.
  const prevIdRef = useRef(id);
  useEffect(() => {
    if (prevIdRef.current !== id) {
      reset();
      prevIdRef.current = id;
    }
  }, [id, reset]);

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

  if (isLoading) {
    return (
      <main className={styles.editor}>
        <p className={styles.status}>Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.editor}>
        <p className={`${styles.status} ${styles.error}`}>{error.message}</p>
        <p className={styles.status}>
          <Link to="/">← Back to presentations</Link>
        </p>
      </main>
    );
  }

  if (!presentation) return null;

  const activePage =
    presentation.pages.find((p) => p.id === activePageId) ?? presentation.pages[0] ?? null;
  const selectedItem =
    activePage?.content.find((c) => c.id === selectedContentId) ?? null;

  return (
    <main className={styles.editor}>
      <header className={styles.header}>
        <Link to="/">←</Link>
        <h1 className={styles.title}>{presentation.title}</h1>
        <Link
          to={`/presentations/${presentation.id}/present`}
          className={styles.presentButton}
        >
          ▶ Present
        </Link>
      </header>
      <Toolbar
        presentationId={presentation.id}
        activePage={activePage}
        selectedItem={selectedItem}
      />
      <div className={styles.body}>
        <PageSidebar presentation={presentation} />
        <Canvas page={activePage} presentationId={presentation.id} />
      </div>
    </main>
  );
}

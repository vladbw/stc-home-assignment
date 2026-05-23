import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePresentationDetail } from '../queries/presentations';
import { PageSidebar } from '../features/editor/page-sidebar';
import { Canvas } from '../features/editor/canvas';
import styles from './editor-route.module.css';

export function EditorRoute() {
  const { id } = useParams<{ id: string }>();
  const { data: presentation, isLoading, error } = usePresentationDetail(id);

  const [activePageId, setActivePageId] = useState<string | null>(null);

  // When the presentation loads or its pages change, make sure the active
  // page id is still valid; otherwise fall back to the first page.
  useEffect(() => {
    if (!presentation) return;
    const stillExists = presentation.pages.some((p) => p.id === activePageId);
    if (!stillExists) {
      setActivePageId(presentation.pages[0]?.id ?? null);
    }
  }, [presentation, activePageId]);

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

  return (
    <main className={styles.editor}>
      <header className={styles.header}>
        <Link to="/">←</Link>
        <h1 className={styles.title}>{presentation.title}</h1>
      </header>
      <div className={styles.body}>
        <PageSidebar
          presentation={presentation}
          activePageId={activePage?.id ?? null}
          onSelectPage={setActivePageId}
        />
        <Canvas page={activePage} />
      </div>
    </main>
  );
}

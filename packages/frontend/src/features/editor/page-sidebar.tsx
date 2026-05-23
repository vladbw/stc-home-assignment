import { MAX_PAGES_PER_PRESENTATION, type PresentationDetail } from '@sts/shared';
import { useAddPage, useDeletePage } from '../../queries/pages';
import { useEditorStore } from '../../stores/editor-store';
import styles from './editor.module.css';

type Props = {
  presentation: PresentationDetail;
};

export function PageSidebar({ presentation }: Props) {
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);

  const add = useAddPage(presentation.id);
  const remove = useDeletePage(presentation.id);

  const pageCount = presentation.pages.length;
  const atMax = pageCount >= MAX_PAGES_PER_PRESENTATION;

  const handleAdd = () => {
    add.mutate(undefined, {
      onSuccess: (newPage) => setActivePage(newPage.id),
    });
  };

  const handleRemove = (pageId: string) => {
    if (!confirm('Delete this page?')) return;
    remove.mutate(pageId, {
      onSuccess: () => {
        if (pageId === activePageId) {
          const idx = presentation.pages.findIndex((p) => p.id === pageId);
          const remaining = presentation.pages.filter((p) => p.id !== pageId);
          const next = remaining[idx] ?? remaining[idx - 1] ?? null;
          setActivePage(next?.id ?? null);
        }
      },
    });
  };

  return (
    <aside className={styles.sidebar} aria-label="Pages">
      <ol className={styles.sidebarList}>
        {presentation.pages.map((page, index) => {
          const isActive = page.id === activePageId;
          return (
            <li key={page.id} className={styles.sidebarItem}>
              <button
                type="button"
                className={`${styles.sidebarSelect} ${isActive ? styles.sidebarSelectActive : ''}`}
                onClick={() => setActivePage(page.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                Page {index + 1}
              </button>
              <button
                type="button"
                className={styles.sidebarRemove}
                onClick={() => handleRemove(page.id)}
                disabled={remove.isPending || pageCount <= 1}
                title={pageCount <= 1 ? 'A presentation must have at least one page' : 'Delete page'}
                aria-label={`Delete page ${index + 1}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className={styles.addPageButton}
        onClick={handleAdd}
        disabled={add.isPending || atMax}
        title={atMax ? `Max ${MAX_PAGES_PER_PRESENTATION} pages` : undefined}
      >
        {add.isPending ? 'Adding…' : '+ Add page'}
      </button>
      <p className={styles.pageCount}>
        {pageCount} / {MAX_PAGES_PER_PRESENTATION}
      </p>
    </aside>
  );
}

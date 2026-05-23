import { MAX_PAGES_PER_PRESENTATION, type PresentationDetail } from '@sts/shared';
import { useAddPage, useDeletePage } from '../../queries/pages';
import styles from './editor.module.css';

type Props = {
  presentation: PresentationDetail;
  activePageId: string | null;
  onSelectPage: (id: string) => void;
};

export function PageSidebar({ presentation, activePageId, onSelectPage }: Props) {
  const add = useAddPage(presentation.id);
  const remove = useDeletePage(presentation.id);

  const pageCount = presentation.pages.length;
  const atMax = pageCount >= MAX_PAGES_PER_PRESENTATION;

  const handleAdd = () => {
    add.mutate(undefined, {
      onSuccess: (newPage) => onSelectPage(newPage.id),
    });
  };

  const handleRemove = (pageId: string) => {
    if (!confirm('Delete this page?')) return;
    remove.mutate(pageId, {
      onSuccess: () => {
        // If we just deleted the active page, jump to a neighbor.
        if (pageId === activePageId) {
          const idx = presentation.pages.findIndex((p) => p.id === pageId);
          const remaining = presentation.pages.filter((p) => p.id !== pageId);
          // Prefer the next page, fall back to the previous, then null.
          const next = remaining[idx] ?? remaining[idx - 1] ?? null;
          if (next) onSelectPage(next.id);
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
                onClick={() => onSelectPage(page.id)}
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

import { MAX_PAGES_PER_PRESENTATION, type PresentationDetail } from '@sts/shared';
import { useAddPage, useDeletePage } from '../../queries/pages';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/cn';
import { useEditorStore } from '../../stores/editor-store';

type Props = {
  presentation: PresentationDetail;
};

export function PageSidebar({ presentation }: Props) {
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const isSidebarOpen = useEditorStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useEditorStore((s) => s.setSidebarOpen);

  const add = useAddPage(presentation.id);
  const remove = useDeletePage(presentation.id);

  const pageCount = presentation.pages.length;
  const atMax = pageCount >= MAX_PAGES_PER_PRESENTATION;

  const handleAdd = () => {
    add.mutate(undefined, {
      onSuccess: (newPage) => {
        setActivePage(newPage.id);
        setSidebarOpen(false);
      },
    });
  };

  const handleSelect = (pageId: string) => {
    setActivePage(pageId);
    // Auto-dismiss the drawer on mobile after picking a page. No-op on
    // desktop because `isSidebarOpen` doesn't affect rendering there.
    setSidebarOpen(false);
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
    <aside
      className={cn(
        // Layout (applies in both modes)
        'flex min-h-0 flex-col gap-3 overflow-y-auto border-r border-border bg-panel px-3 py-4',
        // Mobile: off-canvas drawer absolutely positioned inside the
        // workspace area. The header + toolbar stay reachable above.
        'absolute inset-y-0 left-0 z-50 w-64 transition-transform duration-200',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop (md+): grid child, static, full natural width.
        'md:static md:z-auto md:w-auto md:translate-x-0 md:transition-none',
      )}
      aria-label="Pages"
    >
      <ol className="grid list-none gap-2 p-0 m-0">
        {presentation.pages.map((page, index) => {
          const isActive = page.id === activePageId;
          return (
            <li key={page.id} className="flex items-stretch gap-2">
              <button
                type="button"
                className={cn(
                  'min-h-10 flex-1 rounded-control border border-border bg-control px-3 py-2 text-left text-sm text-foreground transition hover:border-accent/45 hover:bg-control-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15',
                  isActive && 'border-accent/55 bg-control-hover font-semibold text-accent',
                )}
                onClick={() => handleSelect(page.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                Page {index + 1}
              </button>
              <Button
                onClick={() => handleRemove(page.id)}
                disabled={remove.isPending || pageCount <= 1}
                size="icon"
                variant="destructive"
                className="h-auto min-h-10"
                title={pageCount <= 1 ? 'A presentation must have at least one page' : 'Delete page'}
                aria-label={`Delete page ${index + 1}`}
              >
                ×
              </Button>
            </li>
          );
        })}
      </ol>

      <Button
        onClick={handleAdd}
        disabled={add.isPending || atMax}
        variant="secondary"
        className="border-dashed"
        title={atMax ? `Max ${MAX_PAGES_PER_PRESENTATION} pages` : undefined}
      >
        {add.isPending ? 'Adding…' : '+ Add page'}
      </Button>
      <p className="m-0 text-center text-xs text-muted">
        {pageCount} / {MAX_PAGES_PER_PRESENTATION}
      </p>
    </aside>
  );
}

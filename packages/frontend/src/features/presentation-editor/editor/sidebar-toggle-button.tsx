import { Button } from '../../../generic-components/button';
import { useEditorStore } from '../../../stores/editor-store';

/**
 * Hamburger / close toggle for the pages drawer. Rendered only below the
 * `md` breakpoint; on larger viewports the sidebar is always visible and
 * this control is hidden via CSS.
 */
export function SidebarToggleButton() {
  const isOpen = useEditorStore((s) => s.isSidebarOpen);
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      onClick={toggleSidebar}
      aria-label={isOpen ? 'Close pages panel' : 'Open pages panel'}
      aria-expanded={isOpen}
      className="md:hidden"
    >
      {isOpen ? '✕' : '☰'}
    </Button>
  );
}

import type { PageResponse, PresentationDetail } from '@sts/shared';
import { useEditorStore } from '../../../stores/editor-store';
import { Canvas } from './canvas/canvas';
import { PageSidebar } from './page-sidebar';

type Props = {
  presentation: PresentationDetail;
  activePage: PageResponse | null;
};

/**
 * Two-column body of the editor on `md` and up; on smaller viewports the
 * grid collapses to a single column and the pages sidebar floats in as a
 * drawer (absolutely positioned within this container). The backdrop
 * here intercepts taps outside the drawer to close it.
 */
export function EditorWorkspace({ presentation, activePage }: Props) {
  const isSidebarOpen = useEditorStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useEditorStore((s) => s.setSidebarOpen);

  return (
    <div className="relative grid min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[minmax(160px,220px)_1fr]">
      <PageSidebar presentation={presentation} />
      <Canvas page={activePage} presentationId={presentation.id} />

      {isSidebarOpen && (
        <div
          aria-hidden
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-40 bg-black/50 md:hidden"
        />
      )}
    </div>
  );
}

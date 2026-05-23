import type { PageResponse, PresentationDetail } from '@sts/shared';
import { Canvas } from './canvas';
import { PageSidebar } from './page-sidebar';

type Props = {
  presentation: PresentationDetail;
  activePage: PageResponse | null;
};

/** Two-column body of the editor: pages on the left, canvas on the right. */
export function EditorWorkspace({ presentation, activePage }: Props) {
  return (
    <div className="grid min-h-0 grid-cols-[minmax(160px,220px)_1fr] overflow-hidden">
      <PageSidebar presentation={presentation} />
      <Canvas page={activePage} presentationId={presentation.id} />
    </div>
  );
}

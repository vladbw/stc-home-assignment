import { type ContentResponse, type PageResponse } from '@sts/shared';
import { ToolbarAddGroup } from './add-group';
import { ToolbarDeleteButton } from './delete-button';
import { ToolbarDivider } from './divider';
import { ToolbarHistoryGroup } from './history-group';
import { ToolbarPageBgControl } from './page-bg-control';
import { ToolbarTextStyleGroup } from './text-style-group';
import { SidebarToggleButton } from '../sidebar-toggle-button';

type Props = {
  presentationId: string;
  activePage: PageResponse | null;
  selectedItem: ContentResponse | null;
};

/**
 * Editor toolbar — pure composition. Each group is a small component that
 * owns its own state and dispatches through the action layer.
 */
export function Toolbar({ presentationId, activePage, selectedItem }: Props) {
  const isTextSelected = selectedItem?.type === 'text';
  const showPageControls = !selectedItem && !!activePage;

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-border bg-panel-raised px-4 py-3"
      role="toolbar"
      aria-label="Editor tools"
    > 
      <SidebarToggleButton />
      <ToolbarHistoryGroup presentationId={presentationId} />
      <ToolbarDivider />
      <ToolbarAddGroup presentationId={presentationId} activePage={activePage} />
      <ToolbarDeleteButton presentationId={presentationId} selectedItem={selectedItem} />

      {isTextSelected && (
        <>
          <ToolbarDivider />
          <ToolbarTextStyleGroup presentationId={presentationId} item={selectedItem} />
        </>
      )}

      {showPageControls && (
        <>
          <ToolbarDivider />
          <ToolbarPageBgControl presentationId={presentationId} page={activePage} />
        </>
      )}
    </div>
  );
}

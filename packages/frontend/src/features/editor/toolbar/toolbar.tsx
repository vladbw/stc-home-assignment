import { type ContentResponse, type PageResponse } from '@sts/shared';
import { ToolbarAddGroup } from './add-group';
import { ToolbarDeleteButton } from './delete-button';
import { ToolbarDivider } from './divider';
import { ToolbarHistoryGroup } from './history-group';
import { ToolbarTextStyleGroup } from './text-style-group';
import { SidebarToggleButton } from '../sidebar-toggle-button';
import { useEditorActions } from '../use-editor-actions';
import { DebouncedColorPicker } from '../../../components/ui/debounced-color-picker';

type Props = {
  presentationId: string;
  activePage: PageResponse | null;
  selectedItem: ContentResponse | null;
};

export function Toolbar({ presentationId, activePage, selectedItem }: Props) {
  const isTextSelected = selectedItem?.type === 'text';
  const showPageControls = !selectedItem && !!activePage;
  const actions = useEditorActions(presentationId);
  
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
          <DebouncedColorPicker
                label="Page background"
                title="Page background color"
                value={activePage.backgroundColor}
                onCommit={(newColor) => actions.patchPage(activePage, { backgroundColor: newColor })}
          />
        </>
      )}
    </div>
  );
}

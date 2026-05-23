import { type ContentResponse } from '@sts/shared';
import { Button } from '../../../components/ui/button';
import { useEditorStore } from '../../../stores/editor-store';
import { useEditorActions } from '../use-editor-actions';

type Props = {
  presentationId: string;
  selectedItem: ContentResponse | null;
};

export function ToolbarDeleteButton({ presentationId, selectedItem }: Props) {
  const selectContent = useEditorStore((s) => s.selectContent);
  const actions = useEditorActions(presentationId);

  const handleDelete = () => {
    if (!selectedItem) return;
    actions.removeContent(selectedItem);
    selectContent(null);
  };

  return (
    <Button
      onClick={handleDelete}
      disabled={!selectedItem}
      shortcut="editor.deleteSelected"
      variant="destructive"
    >
      Delete
    </Button>
  );
}

import { Button } from '../../../components/ui/button';
import { useHistoryStore } from '../../../stores/history-store';
import { useEditorActions } from '../use-editor-actions';

type Props = { presentationId: string };

/** Undo / redo. Shortcut chord shows in the tooltip via Button's `shortcut` prop. */
export function ToolbarHistoryGroup({ presentationId }: Props) {
  const actions = useEditorActions(presentationId);
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);

  return (
    <>
      <Button
        size="icon"
        shortcut="editor.undo"
        title="Undo"
        aria-label="Undo"
        onClick={actions.undo}
        disabled={!canUndo}
      >
        ↶
      </Button>
      <Button
        size="icon"
        shortcut="editor.redo"
        title="Redo"
        aria-label="Redo"
        onClick={actions.redo}
        disabled={!canRedo}
      >
        ↷
      </Button>
    </>
  );
}

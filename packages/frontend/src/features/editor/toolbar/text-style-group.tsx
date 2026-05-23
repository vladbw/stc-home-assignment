import {
  DEFAULT_TEXT_STYLE,
  type ContentResponse,
  type TextStyle,
} from '@sts/shared';
import { Button } from '../../../components/ui/button';
import { useEditorActions } from '../use-editor-actions';

type Props = {
  presentationId: string;
  item: ContentResponse;
};

/**
 * B / I / Color controls. Visible only when a text content item is selected.
 * Each toggle/picker dispatches through the action layer so the change is
 * captured by the undo stack.
 */
export function ToolbarTextStyleGroup({ presentationId, item }: Props) {
  const actions = useEditorActions(presentationId);

  const currentStyle: TextStyle = item.style
    ? { ...DEFAULT_TEXT_STYLE, ...item.style }
    : DEFAULT_TEXT_STYLE;

  const patchStyle = (next: TextStyle) => {
    actions.patchContent(item, { style: next });
  };

  const toggleBold = () => patchStyle({ ...currentStyle, bold: !currentStyle.bold });
  const toggleItalic = () => patchStyle({ ...currentStyle, italic: !currentStyle.italic });
  const onColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    patchStyle({ ...currentStyle, color: e.target.value.toUpperCase() });
  };

  return (
    <>
      <Button
        onClick={toggleBold}
        aria-pressed={currentStyle.bold}
        active={currentStyle.bold}
        title="Bold"
        size="icon"
        className="font-bold"
      >
        B
      </Button>
      <Button
        onClick={toggleItalic}
        aria-pressed={currentStyle.italic}
        active={currentStyle.italic}
        title="Italic"
        size="icon"
        className="italic"
      >
        I
      </Button>
      <label
        className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted"
        title="Text color"
      >
        <span>Color</span>
        <input
          type="color"
          value={currentStyle.color.toLowerCase()}
          onChange={onColorChange}
          className="h-8 w-10 cursor-pointer border border-border bg-transparent p-0"
        />
      </label>
    </>
  );
}

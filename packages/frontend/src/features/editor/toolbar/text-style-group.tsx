import {
  DEFAULT_TEXT_STYLE,
  type ContentResponse,
  type TextStyle,
} from '@sts/shared';
import { Button } from '../../../generic-components/button';
import { DebouncedColorPicker } from '../../../generic-components/debounced-color-picker';
import { useEditorActions } from '../use-editor-actions';

type Props = {
  presentationId: string;
  item: ContentResponse;
};

/**
 * Bold/italic toggles commit immediately. The color picker is debounced
 * via the <DebouncedColorPicker> so a single pick produces one
 * mutation, not one per dragged pixel (in the screen with the circular palette).
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
      <DebouncedColorPicker
        label="Color"
        title="Text color"
        value={currentStyle.color}
        onCommit={(newColor) => patchStyle({ ...currentStyle, color: newColor })}
      />
    </>
  );
}

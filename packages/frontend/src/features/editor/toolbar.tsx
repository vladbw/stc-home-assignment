import { useState } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_TEXT_STYLE,
  type ContentResponse,
  type PageResponse,
  type TextStyle,
} from '@sts/shared';
import { useEditorStore } from '../../stores/editor-store';
import { useHistoryStore } from '../../stores/history-store';
import { useEditorActions } from './use-editor-actions';
import { fitDimensionsToBox } from './media-dimensions';
import { MediaPicker, type PickedMedia } from './media-picker';
import styles from './editor.module.css';

type Props = {
  presentationId: string;
  activePage: PageResponse | null;
  selectedItem: ContentResponse | null;
};

export function Toolbar({ presentationId, activePage, selectedItem }: Props) {
  const selectContent = useEditorStore((s) => s.selectContent);

  const actions = useEditorActions(presentationId);
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);

  const [pickerKind, setPickerKind] = useState<'image' | 'video' | null>(null);

  const isTextSelected = selectedItem?.type === 'text';
  const currentStyle: TextStyle = selectedItem?.style
    ? { ...DEFAULT_TEXT_STYLE, ...selectedItem.style }
    : DEFAULT_TEXT_STYLE;
  const showPageControls = !selectedItem && !!activePage;

  const handleAddText = () => {
    if (!activePage) return;
    const id = actions.addContent(activePage.id, {
      type: 'text',
      x: 100,
      y: 100,
      width: 100,
      height: 40,
      text: 'Text',
      style: DEFAULT_TEXT_STYLE,
    });
    selectContent(id);
  };

  const handlePickMedia = (picked: PickedMedia) => {
    if (!activePage || !pickerKind) return;
    const fitted = fitDimensionsToBox(
      { width: picked.naturalWidth, height: picked.naturalHeight },
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );
    const x = Math.max(0, Math.min(CANVAS_WIDTH - fitted.width, 100));
    const y = Math.max(0, Math.min(CANVAS_HEIGHT - fitted.height, 100));
    const baseProps = {
      x,
      y,
      width: fitted.width,
      height: fitted.height,
      mediaId: picked.mediaId,
    };
    // Branch so `type` narrows to a literal (the discriminated union won't
    // accept `type: 'image' | 'video'` directly).
    const id =
      pickerKind === 'image'
        ? actions.addContent(activePage.id, { type: 'image', ...baseProps })
        : actions.addContent(activePage.id, { type: 'video', ...baseProps });
    selectContent(id);
    setPickerKind(null);
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    actions.removeContent(selectedItem);
    selectContent(null);
  };

  const patchStyle = (next: TextStyle) => {
    if (!selectedItem) return;
    actions.patchContent(selectedItem, { style: next });
  };

  const toggleBold = () => patchStyle({ ...currentStyle, bold: !currentStyle.bold });
  const toggleItalic = () => patchStyle({ ...currentStyle, italic: !currentStyle.italic });
  const onTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    patchStyle({ ...currentStyle, color: e.target.value.toUpperCase() });
  };

  const onPageBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activePage) return;
    actions.patchPage(activePage, { backgroundColor: e.target.value.toUpperCase() });
  };

  return (
    <>
      <div className={styles.toolbar} role="toolbar" aria-label="Editor tools">
        <button
          type="button"
          onClick={actions.undo}
          disabled={!canUndo}
          title="Undo"
          aria-label="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={actions.redo}
          disabled={!canRedo}
          title="Redo"
          aria-label="Redo"
        >
          ↷
        </button>
        <span className={styles.toolbarDivider} aria-hidden />

        <button type="button" onClick={handleAddText} disabled={!activePage}>
          + Text
        </button>
        <button
          type="button"
          onClick={() => setPickerKind('image')}
          disabled={!activePage}
        >
          + Image
        </button>
        <button
          type="button"
          onClick={() => setPickerKind('video')}
          disabled={!activePage}
        >
          + Video
        </button>
        <button type="button" onClick={handleDelete} disabled={!selectedItem}>
          Delete
        </button>

        {isTextSelected && (
          <>
            <span className={styles.toolbarDivider} aria-hidden />
            <button
              type="button"
              onClick={toggleBold}
              aria-pressed={currentStyle.bold}
              className={currentStyle.bold ? styles.toolbarToggleActive : ''}
              title="Bold"
              style={{ fontWeight: 700, minWidth: '2rem' }}
            >
              B
            </button>
            <button
              type="button"
              onClick={toggleItalic}
              aria-pressed={currentStyle.italic}
              className={currentStyle.italic ? styles.toolbarToggleActive : ''}
              title="Italic"
              style={{ fontStyle: 'italic', minWidth: '2rem' }}
            >
              I
            </button>
            <label className={styles.colorPicker} title="Text color">
              <span>Color</span>
              <input
                type="color"
                value={currentStyle.color.toLowerCase()}
                onChange={onTextColorChange}
              />
            </label>
          </>
        )}

        {showPageControls && (
          <>
            <span className={styles.toolbarDivider} aria-hidden />
            <label className={styles.colorPicker} title="Page background color">
              <span>Page background</span>
              <input
                type="color"
                value={activePage.backgroundColor.toLowerCase()}
                onChange={onPageBgChange}
              />
            </label>
          </>
        )}
      </div>

      {pickerKind && (
        <MediaPicker
          kind={pickerKind}
          onClose={() => setPickerKind(null)}
          onPick={handlePickMedia}
        />
      )}
    </>
  );
}

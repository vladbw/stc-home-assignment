import {
  DEFAULT_TEXT_STYLE,
  type ContentResponse,
  type PageResponse,
  type TextStyle,
} from '@sts/shared';
import {
  useCreateContent,
  useDeleteContent,
  useUpdateContent,
} from '../../queries/content';
import { useUpdatePage } from '../../queries/pages';
import { useEditorStore } from '../../stores/editor-store';
import styles from './editor.module.css';

type Props = {
  presentationId: string;
  activePage: PageResponse | null;
  selectedItem: ContentResponse | null;
};

export function Toolbar({ presentationId, activePage, selectedItem }: Props) {
  const selectContent = useEditorStore((s) => s.selectContent);

  const create = useCreateContent(presentationId);
  const remove = useDeleteContent(presentationId);
  const updateContent = useUpdateContent(presentationId);
  const updatePage = useUpdatePage(presentationId);

  const isTextSelected = selectedItem?.type === 'text';
  const currentStyle: TextStyle = selectedItem?.style ?? DEFAULT_TEXT_STYLE;
  const showPageControls = !selectedItem && !!activePage;

  const handleAddText = () => {
    if (!activePage) return;
    create.mutate(
      {
        pageId: activePage.id,
        input: {
          type: 'text',
          x: 100,
          y: 100,
          width: 400,
          height: 80,
          text: 'Text',
          style: DEFAULT_TEXT_STYLE,
        },
      },
      {
        onSuccess: (newItem) => selectContent(newItem.id),
      },
    );
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    remove.mutate(selectedItem.id, {
      onSuccess: () => selectContent(null),
    });
  };

  const patchStyle = (next: TextStyle) => {
    if (!selectedItem) return;
    updateContent.mutate({ id: selectedItem.id, input: { style: next } });
  };

  const toggleBold = () => patchStyle({ ...currentStyle, bold: !currentStyle.bold });
  const toggleItalic = () => patchStyle({ ...currentStyle, italic: !currentStyle.italic });
  const onTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    patchStyle({ ...currentStyle, color: e.target.value.toUpperCase() });
  };

  const onPageBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activePage) return;
    updatePage.mutate({
      id: activePage.id,
      input: { backgroundColor: e.target.value.toUpperCase() },
    });
  };

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Editor tools">
      <button
        type="button"
        onClick={handleAddText}
        disabled={!activePage || create.isPending}
      >
        + Text
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={!selectedItem || remove.isPending}
      >
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
  );
}

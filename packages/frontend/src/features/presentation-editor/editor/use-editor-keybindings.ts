import { MAX_PAGES_PER_PRESENTATION, type PresentationDetail } from '@sts/shared';
import { useAddPage } from '../../../queries/pages';
import { useShortcut } from '../../../shortcuts/use-shortcut';
import { useEditorStore } from '../../../stores/editor-store';
import { useHistoryStore } from '../../../stores/history-store';
import { useEditorActions } from './use-editor-actions';

/**
 * Registers every editor shortcut in one place. Each call to `useShortcut`
 * looks up the chord/scope/repeat behavior from the central registry, so
 * the only thing here is which handlers run.
 */
export function useEditorKeybindings(
  presentationId: string | undefined,
  presentation: PresentationDetail | undefined,
) {
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const selectedContentId = useEditorStore((s) => s.selectedContentId);
  const selectContent = useEditorStore((s) => s.selectContent);

  const actions = useEditorActions(presentationId ?? '');
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);
  const { isPending: isAddingPage, mutate: addPage } = useAddPage(presentationId ?? '');

  const pageCount = presentation?.pages.length ?? 0;
  const atMaxPages = pageCount >= MAX_PAGES_PER_PRESENTATION;

  const createPage = () => {
    if (!presentationId || isAddingPage || atMaxPages) return;
    addPage();
  };

  const navigatePage = (direction: -1 | 1) => {
    if (!presentation || presentation.pages.length === 0) return;
    const currentIndex = presentation.pages.findIndex((p) => p.id === activePageId);
    const fallback = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = Math.max(
      0,
      Math.min(presentation.pages.length - 1, fallback + direction),
    );
    const nextPageId = presentation.pages[nextIndex]?.id ?? null;
    if (nextPageId && nextPageId !== activePageId) {
      setActivePage(nextPageId);
    }
  };

  const deleteSelected = () => {
    if (!presentation || !selectedContentId) return;
    const page = presentation.pages.find((p) => p.id === activePageId);
    const item = page?.content.find((c) => c.id === selectedContentId);
    if (!item) return;
    actions.removeContent(item);
    selectContent(null);
  };

  const deselect = () => {
    if (!selectedContentId) return;
    selectContent(null);
  };

  useShortcut('editor.newPage', createPage, {
    enabled: () => !!presentationId && !isAddingPage && !atMaxPages,
  });
  useShortcut('editor.undo', actions.undo, { enabled: () => canUndo });
  useShortcut('editor.redo', actions.redo, { enabled: () => canRedo });
  useShortcut('editor.prevPage', () => navigatePage(-1));
  useShortcut('editor.nextPage', () => navigatePage(1));
  useShortcut('editor.deleteSelected', deleteSelected, {
    enabled: () => !!selectedContentId,
  });
  useShortcut('editor.deleteSelectedAlt', deleteSelected, {
    enabled: () => !!selectedContentId,
  });
  useShortcut('editor.deselect', deselect, { enabled: () => !!selectedContentId });
}

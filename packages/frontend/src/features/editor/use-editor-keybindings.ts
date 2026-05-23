import { useEffect } from 'react';
import { MAX_PAGES_PER_PRESENTATION, type PresentationDetail } from '@sts/shared';
import { useAddPage } from '../../queries/pages';
import { useEditorStore } from '../../stores/editor-store';
import { isPlainModShortcut, isTypingTarget } from '../../utils/keyboard';
import { useEditorActions } from './use-editor-actions';

export function useEditorKeybindings(
  presentationId: string | undefined,
  presentation: PresentationDetail | undefined,
) {
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const { redo, undo } = useEditorActions(presentationId ?? '');
  const { isPending: isAddingPage, mutate: addPage } = useAddPage(presentationId ?? '');

  useEffect(() => {
    if (!presentationId) return;

    const createPage = () => {
      if (
        isAddingPage ||
        (presentation?.pages.length ?? 0) >= MAX_PAGES_PER_PRESENTATION
      ) {
        return;
      }

      addPage(undefined, {
        onSuccess: (newPage) => setActivePage(newPage.id),
      });
    };

    const navigatePage = (direction: -1 | 1) => {
      const pages = presentation?.pages ?? [];
      if (pages.length === 0) return;

      const currentIndex = pages.findIndex((p) => p.id === activePageId);
      const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = Math.max(
        0,
        Math.min(pages.length - 1, fallbackIndex + direction),
      );
      const nextPageId = pages[nextIndex]?.id ?? null;

      if (nextPageId && nextPageId !== activePageId) {
        setActivePage(nextPageId);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (isPlainModShortcut(e)) {
        const key = e.key.toLowerCase();
        if (key === 'n') {
          e.preventDefault();
          if (!e.repeat) createPage();
          return;
        }

        if (key === 'z') {
          e.preventDefault();
          undo();
          return;
        }

        if (key === 'y') {
          e.preventDefault();
          redo();
          return;
        }
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePage(-1);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigatePage(1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    presentationId,
    presentation,
    activePageId,
    setActivePage,
    redo,
    undo,
    addPage,
    isAddingPage,
  ]);
}

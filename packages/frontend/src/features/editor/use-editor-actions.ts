import { useCallback, useMemo } from 'react';
import {
  DEFAULT_TEXT_STYLE,
  type ContentResponse,
  type CreateContentInput,
  type UpdateContentInput,
  type UpdatePageInput,
} from '@sts/shared';
import {
  useCreateContent,
  useDeleteContent,
  useUpdateContent,
} from '../../queries/content';
import { useUpdatePage } from '../../queries/pages';
import { useHistoryStore, type Command } from '../../stores/history-store';

/**
 * Unified action layer for the editor.
 *
 * Each method:
 *  1. Computes the *inverse* command (what would undo this).
 *  2. Fires the mutation (forward).
 *  3. Pushes the {forward, inverse} pair onto the undo stack.
 *
 * `undo()` / `redo()` simply pop and execute. Because commands are pure
 * data, redo replays the exact same operation that was originally requested.
 *
 * The returned methods and the returned object are memoized so consumers
 * that pass these to `React.memo`-wrapped children don't see spurious prop
 * changes on every render. The dependencies (`*.mutate` from TanStack
 * Query, Zustand store actions) are guaranteed-stable across renders.
 */
export function useEditorActions(presentationId: string) {
  const createContent = useCreateContent(presentationId);
  const deleteContent = useDeleteContent(presentationId);
  const updateContent = useUpdateContent(presentationId);
  const updatePage = useUpdatePage(presentationId);

  const pushHistory = useHistoryStore((s) => s.push);
  const popUndo = useHistoryStore((s) => s.popUndo);
  const popRedo = useHistoryStore((s) => s.popRedo);
  const pushUndo = useHistoryStore((s) => s.pushUndo);
  const pushRedo = useHistoryStore((s) => s.pushRedo);

  // TanStack Query promises `mutate` is stable across renders, so depending
  // on it is safe — useCallback won't re-create on every parent re-render.
  const createMutate = createContent.mutate;
  const deleteMutate = deleteContent.mutate;
  const updateContentMutate = updateContent.mutate;
  const updatePageMutate = updatePage.mutate;

  const execute = useCallback(
    (cmd: Command) => {
      switch (cmd.type) {
        case 'createContent':
          createMutate({ pageId: cmd.pageId, input: cmd.input });
          return;
        case 'deleteContent':
          deleteMutate(cmd.id);
          return;
        case 'updateContent':
          updateContentMutate({ id: cmd.id, input: cmd.input });
          return;
        case 'updatePage':
          updatePageMutate({ id: cmd.id, input: cmd.input });
          return;
      }
    },
    [createMutate, deleteMutate, updateContentMutate, updatePageMutate],
  );

  /**
   * Add a content item. If the caller doesn't supply an id, we generate one
   * here — needed so undo→redo round trips re-create the row with the same
   * id, keeping later history commands referring to the correct row.
   */
  const addContent = useCallback(
    (pageId: string, input: CreateContentInput): string => {
      const id = input.id ?? crypto.randomUUID();
      const inputWithId: CreateContentInput = { ...input, id };
      const forward: Command = { type: 'createContent', pageId, input: inputWithId };
      const inverse: Command = { type: 'deleteContent', id };
      execute(forward);
      pushHistory({ forward, inverse });
      return id;
    },
    [execute, pushHistory],
  );

  const removeContent = useCallback(
    (item: ContentResponse) => {
      const forward: Command = { type: 'deleteContent', id: item.id };
      const inverse: Command = {
        type: 'createContent',
        pageId: item.pageId,
        input: contentToCreateInput(item),
      };
      execute(forward);
      pushHistory({ forward, inverse });
    },
    [execute, pushHistory],
  );

  const patchContent = useCallback(
    (item: ContentResponse, patch: UpdateContentInput) => {
      const forward: Command = { type: 'updateContent', id: item.id, input: patch };
      const inverse: Command = {
        type: 'updateContent',
        id: item.id,
        input: inverseUpdate(item, patch),
      };
      execute(forward);
      pushHistory({ forward, inverse });
    },
    [execute, pushHistory],
  );

  const patchPage = useCallback(
    (
      page: { id: string; backgroundColor: string },
      patch: UpdatePageInput,
    ) => {
      const inversePatch: UpdatePageInput = {};
      if (patch.backgroundColor !== undefined) {
        inversePatch.backgroundColor = page.backgroundColor;
      }
      const forward: Command = { type: 'updatePage', id: page.id, input: patch };
      const inverse: Command = { type: 'updatePage', id: page.id, input: inversePatch };
      execute(forward);
      pushHistory({ forward, inverse });
    },
    [execute, pushHistory],
  );

  const undo = useCallback(() => {
    const action = popUndo();
    if (!action) return;
    execute(action.inverse);
    pushRedo(action);
  }, [execute, popUndo, pushRedo]);

  const redo = useCallback(() => {
    const action = popRedo();
    if (!action) return;
    execute(action.forward);
    pushUndo(action);
  }, [execute, popRedo, pushUndo]);

  // Object identity is stable as long as the individual callbacks are. This
  // lets `React.memo` consumers that take `actions` (or anything derived
  // from it) skip re-renders cleanly.
  return useMemo(
    () => ({ addContent, removeContent, patchContent, patchPage, undo, redo }),
    [addContent, removeContent, patchContent, patchPage, undo, redo],
  );
}

/**
 * Build a CreateContentInput from an existing ContentResponse. Used to
 * record the inverse of a delete (so undo can re-create the row with
 * exactly the same id and content).
 */
function contentToCreateInput(item: ContentResponse): CreateContentInput {
  const base = {
    id: item.id,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    zIndex: item.zIndex,
  };
  if (item.type === 'text') {
    return {
      ...base,
      type: 'text',
      text: item.text ?? '',
      style: item.style ?? DEFAULT_TEXT_STYLE,
    };
  }
  // image | video — both share { mediaId } as the type-discriminating field
  return {
    ...base,
    type: item.type,
    mediaId: item.mediaId ?? '',
  };
}

/**
 * For each field the user is updating, read the *previous* value off the
 * item snapshot. That set of previous values is the inverse: applying it
 * undoes the patch.
 *
 * Style is replace-not-merge per the schema, so the inverse style is the
 * complete previous style object.
 */
function inverseUpdate(
  item: ContentResponse,
  patch: UpdateContentInput,
): UpdateContentInput {
  const result: UpdateContentInput = {};
  if (patch.x !== undefined) result.x = item.x;
  if (patch.y !== undefined) result.y = item.y;
  if (patch.width !== undefined) result.width = item.width;
  if (patch.height !== undefined) result.height = item.height;
  if (patch.zIndex !== undefined) result.zIndex = item.zIndex;
  if (patch.text !== undefined) result.text = item.text ?? '';
  if (patch.style !== undefined) {
    result.style = item.style
      ? { ...DEFAULT_TEXT_STYLE, ...item.style }
      : DEFAULT_TEXT_STYLE;
  }
  return result;
}

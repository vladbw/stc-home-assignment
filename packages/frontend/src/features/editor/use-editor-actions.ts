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
 * Components used to call mutations directly; now they call these methods
 * instead. Each method:
 *  1. Computes the *inverse* command (what would undo this).
 *  2. Fires the mutation (forward).
 *  3. Pushes the {forward, inverse} pair onto the undo stack.
 *
 * `undo()` / `redo()` simply pop and execute. Because commands are pure
 * data, redo replays the exact same operation that was originally requested.
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

  const execute = (cmd: Command) => {
    switch (cmd.type) {
      case 'createContent':
        createContent.mutate({ pageId: cmd.pageId, input: cmd.input });
        return;
      case 'deleteContent':
        deleteContent.mutate(cmd.id);
        return;
      case 'updateContent':
        updateContent.mutate({ id: cmd.id, input: cmd.input });
        return;
      case 'updatePage':
        updatePage.mutate({ id: cmd.id, input: cmd.input });
        return;
    }
  };

  /**
   * Add a content item. If the caller doesn't supply an id, we generate one
   * here — needed so undo→redo round trips re-create the row with the same
   * id, keeping later history commands referring to the correct row.
   *
   * Note: we accept the full `CreateContentInput` (where id is already
   * optional) rather than `Omit<..., 'id'>`, because `Omit` collapses a
   * discriminated union into a single member with only the common keys.
   */
  const addContent = (pageId: string, input: CreateContentInput): string => {
    const id = input.id ?? crypto.randomUUID();
    const inputWithId: CreateContentInput = { ...input, id };
    const forward: Command = { type: 'createContent', pageId, input: inputWithId };
    const inverse: Command = { type: 'deleteContent', id };
    execute(forward);
    pushHistory({ forward, inverse });
    return id;
  };

  const removeContent = (item: ContentResponse) => {
    const forward: Command = { type: 'deleteContent', id: item.id };
    const inverse: Command = {
      type: 'createContent',
      pageId: item.pageId,
      input: contentToCreateInput(item),
    };
    execute(forward);
    pushHistory({ forward, inverse });
  };

  const patchContent = (item: ContentResponse, patch: UpdateContentInput) => {
    const forward: Command = { type: 'updateContent', id: item.id, input: patch };
    const inverse: Command = {
      type: 'updateContent',
      id: item.id,
      input: inverseUpdate(item, patch),
    };
    execute(forward);
    pushHistory({ forward, inverse });
  };

  const patchPage = (
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
  };

  const undo = () => {
    const action = popUndo();
    if (!action) return;
    execute(action.inverse);
    pushRedo(action);
  };

  const redo = () => {
    const action = popRedo();
    if (!action) return;
    execute(action.forward);
    pushUndo(action);
  };

  return { addContent, removeContent, patchContent, patchPage, undo, redo };
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

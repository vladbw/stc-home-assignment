import { create } from 'zustand';
import type {
  CreateContentInput,
  UpdateContentInput,
  UpdatePageInput,
} from '@sts/shared';

/**
 * A serializable description of a single state-changing operation. The undo
 * stack stores `{ forward, inverse }` pairs; `forward` is what the user did,
 * `inverse` is what gets executed when they hit undo. Redo replays `forward`.
 */
export type Command =
  | { type: 'createContent'; pageId: string; input: CreateContentInput }
  | { type: 'deleteContent'; id: string }
  | { type: 'updateContent'; id: string; input: UpdateContentInput }
  | { type: 'updatePage'; id: string; input: UpdatePageInput };

export type HistoryAction = { forward: Command; inverse: Command };

const MAX_HISTORY = 50;

interface HistoryState {
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];

  push: (action: HistoryAction) => void;
  popUndo: () => HistoryAction | null;
  popRedo: () => HistoryAction | null;
  pushUndo: (action: HistoryAction) => void;
  pushRedo: (action: HistoryAction) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  push: (action) =>
    set((state) => ({
      undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
      redoStack: [],
    })),

  popUndo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const top = undoStack[undoStack.length - 1]!;
    set({ undoStack: undoStack.slice(0, -1) });
    return top;
  },

  popRedo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const top = redoStack[redoStack.length - 1]!;
    set({ redoStack: redoStack.slice(0, -1) });
    return top;
  },

  pushUndo: (action) =>
    set((state) => ({
      undoStack: [...state.undoStack, action].slice(-MAX_HISTORY),
    })),

  pushRedo: (action) =>
    set((state) => ({
      redoStack: [...state.redoStack, action].slice(-MAX_HISTORY),
    })),

  clear: () => set({ undoStack: [], redoStack: [] }),
}));

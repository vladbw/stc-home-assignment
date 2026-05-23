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
 *
 * The choice to make this a pure-data structure (rather than a closure) means
 * the same record can travel through the redo stack and be replayed
 * identically. It also means we *can't* store any in-memory references —
 * everything needed to re-execute must be in the record itself.
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

  /** User performed a new action: push to undo, clear redo. */
  push: (action: HistoryAction) => void;
  popUndo: () => HistoryAction | null;
  popRedo: () => HistoryAction | null;
  /** Used when undo/redo re-fills the opposite stack. Does NOT clear redo. */
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

import { create } from 'zustand';

/**
 * Cross-component UI state for the editor.
 * Server data still lives in TanStack Query. This store only holds transient
 * UI state shared between toolbar / sidebar / canvas / content items.
 */
interface EditorState {
  activePageId: string | null;
  selectedContentId: string | null;
  /** Content item currently in inline-edit mode (text only). Null when not editing. */
  editingContentId: string | null;
  /**
   * Whether the pages drawer is open. Only meaningful below the `md`
   * breakpoint — on larger viewports the sidebar is always visible via CSS
   * regardless of this flag.
   */
  isSidebarOpen: boolean;

  /** Switch to a different page. Also clears any selection (selections are per-page). */
  setActivePage: (id: string | null) => void;
  /** Select a content item (or deselect with null). Implicitly ends any active edit. */
  selectContent: (id: string | null) => void;
  /** Enter inline-edit mode for a text item. Also marks it as selected. */
  beginEdit: (id: string) => void;
  /** Leave inline-edit mode without changing selection. */
  endEdit: () => void;
  /** Open or close the mobile pages drawer. */
  setSidebarOpen: (open: boolean) => void;
  /** Toggle the mobile pages drawer. */
  toggleSidebar: () => void;
  /** Wipe all editor-local state — used when navigating between presentations. */
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activePageId: null,
  selectedContentId: null,
  editingContentId: null,
  isSidebarOpen: false,

  setActivePage: (id) =>
    set({ activePageId: id, selectedContentId: null, editingContentId: null }),
  selectContent: (id) => set({ selectedContentId: id, editingContentId: null }),
  beginEdit: (id) => set({ selectedContentId: id, editingContentId: id }),
  endEdit: () => set({ editingContentId: null }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  reset: () =>
    set({
      activePageId: null,
      selectedContentId: null,
      editingContentId: null,
      isSidebarOpen: false,
    }),
}));

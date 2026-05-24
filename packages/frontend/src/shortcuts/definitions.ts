import type { ShortcutDef } from './types';

/**
 * Single source of truth for every shortcut in the app.
 *
 * - `scope` is metadata (used for documentation / future help UI). At
 *   runtime only the active route's hooks have registered handlers, so
 *   shortcuts from other scopes simply don't fire.
 * - Each definition is a single chord. To bind two chords to the same
 *   action (e.g. Delete + Backspace), define both and register a handler
 *   for each id with `useShortcut`.
 */
export const SHORTCUTS = {
  // Home -----------------------------------------------------------------
  // Note: ⌘N alone is reserved by every browser ("New Window") and can't be
  // intercepted reliably. Adding Alt sidesteps the conflict on every OS.
  'home.newPresentation': {
    scope: 'home',
    chord: { key: '.', modifiers: ['mod'] },
    description: 'New presentation',
  },

  // Editor ---------------------------------------------------------------
  'editor.newPage': {
    scope: 'editor',
    chord: { key: '.', modifiers: ['mod'] },
    description: 'New page',
  },
  'editor.undo': {
    scope: 'editor',
    chord: { key: 'z', modifiers: ['mod'] },
    description: 'Undo',
    allowRepeat: true,
  },
  // ⌘⇧Z / Ctrl+Shift+Z is the cross-platform redo chord. ⌘Y was dropped
  // because Chrome and Firefox bind it to the History panel on macOS.
  'editor.redo': {
    scope: 'editor',
    chord: { key: 'z', modifiers: ['mod', 'shift'] },
    description: 'Redo',
    allowRepeat: true,
  },
  'editor.prevPage': {
    scope: 'editor',
    chord: { key: 'ArrowLeft' },
    description: 'Previous page',
    allowRepeat: true,
  },
  'editor.nextPage': {
    scope: 'editor',
    chord: { key: 'ArrowRight' },
    description: 'Next page',
    allowRepeat: true,
  },
  'editor.deleteSelected': {
    scope: 'editor',
    chord: { key: 'Delete' },
    description: 'Delete selected',
  },
  'editor.deleteSelectedAlt': {
    scope: 'editor',
    chord: { key: 'Backspace' },
    description: 'Delete selected (Backspace)',
  },
  'editor.deselect': {
    scope: 'editor',
    chord: { key: 'Escape' },
    description: 'Deselect',
  },

  // Presentation ---------------------------------------------------------
  'presentation.prevSlide': {
    scope: 'presentation',
    chord: { key: 'ArrowLeft' },
    description: 'Previous slide',
  },
  'presentation.nextSlide': {
    scope: 'presentation',
    chord: { key: 'ArrowRight' },
    description: 'Next slide',
  },
  'presentation.nextSlideAlt': {
    scope: 'presentation',
    chord: { key: ' ' },
    description: 'Next slide (Space)',
  },
  'presentation.exit': {
    scope: 'presentation',
    chord: { key: 'Escape' },
    description: 'Exit presentation',
  },
} as const satisfies Record<string, ShortcutDef>;

export type ShortcutId = keyof typeof SHORTCUTS;

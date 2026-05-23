import type { Chord, Modifier } from './types';

/**
 * Treat the event as happening "inside a typing context" — so we skip
 * shortcuts that aren't whitelisted with `allowInTypingContext`. This
 * stops e.g. Cmd+N from firing while the user is typing in the rename
 * input, and stops Delete from removing a content item while the user
 * is deleting characters in the inline text editor.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.tagName === 'INPUT') return true;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

export const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

function modifierActive(mod: Modifier, e: KeyboardEvent): boolean {
  switch (mod) {
    case 'mod':
      return isMac ? e.metaKey : e.ctrlKey;
    case 'shift':
      return e.shiftKey;
    case 'alt':
      return e.altKey;
  }
}

const ALL_MODIFIERS: readonly Modifier[] = ['mod', 'shift', 'alt'];

/**
 * Exact chord match: every modifier required must be active, every
 * modifier NOT required must be inactive. (So Cmd+Z does not fire when
 * Cmd+Shift+Z is pressed — that distinction is how undo vs redo coexist.)
 *
 * Key matching is case-insensitive for single letters and case-sensitive
 * for named keys like 'ArrowLeft' or 'Escape'.
 */
export function matchesChord(e: KeyboardEvent, chord: Chord): boolean {
  const eventKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const chordKey = chord.key.length === 1 ? chord.key.toLowerCase() : chord.key;
  if (eventKey !== chordKey) return false;

  const required = new Set<Modifier>(chord.modifiers ?? []);
  for (const mod of ALL_MODIFIERS) {
    if (modifierActive(mod, e) !== required.has(mod)) return false;
  }
  return true;
}

import { SHORTCUTS, type ShortcutId } from './definitions';
import { isMac } from './matchers';
import type { Chord, Modifier } from './types';

/** Symbol-only on Mac (⌘⇧Z), name + plus on Windows (Ctrl+Shift+Z). */
const MODIFIER_LABEL: Record<Modifier, () => string> = {
  mod: () => (isMac ? '⌘' : 'Ctrl'),
  shift: () => (isMac ? '⇧' : 'Shift'),
  alt: () => (isMac ? '⌥' : 'Alt'),
};

/** Named keys → printable labels. */
const KEY_LABEL: Record<string, string> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Enter: '↵',
  Escape: 'Esc',
  Backspace: '⌫',
  Delete: '⌦',
  Tab: 'Tab',
  ' ': 'Space',
};

export function formatChord(chord: Chord): string {
  const modifierTokens = (chord.modifiers ?? []).map((m) => MODIFIER_LABEL[m]());
  const keyLabel = KEY_LABEL[chord.key] ?? (chord.key.length === 1 ? chord.key.toUpperCase() : chord.key);

  if (modifierTokens.length === 0) return keyLabel;
  const separator = isMac ? '' : '+';
  return [...modifierTokens, keyLabel].join(separator);
}

export function formatShortcut(id: ShortcutId): string {
  return formatChord(SHORTCUTS[id].chord);
}

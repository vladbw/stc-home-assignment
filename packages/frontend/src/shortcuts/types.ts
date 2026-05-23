/**
 * Logical modifier name. `mod` collapses ⌘ (Mac) and Ctrl (everywhere else)
 * into one cross-platform token — the dispatch service resolves it at
 * keydown time by sniffing the platform.
 */
export type Modifier = 'mod' | 'shift' | 'alt';

/** One chord. Letters use lowercase ('z'); named keys use KeyboardEvent.key ('ArrowLeft', 'Escape', ' '). */
export type Chord = {
  readonly key: string;
  readonly modifiers?: readonly Modifier[];
};

/** Scope is metadata only — see service.ts. */
export type Scope = 'home' | 'editor' | 'presentation';

export type ShortcutDef = {
  readonly scope: Scope;
  readonly chord: Chord;
  /** Human-readable label for help / tooltips. */
  readonly description: string;
  /** Default false — set true for shortcuts the user would naturally hold (undo, nudge). */
  readonly allowRepeat?: boolean;
  /** Default false — set true only for shortcuts that must fire even when an input/textarea is focused. */
  readonly allowInTypingContext?: boolean;
};

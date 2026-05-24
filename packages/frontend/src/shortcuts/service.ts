import { SHORTCUTS, type ShortcutId } from './definitions';
import { isTypingTarget, matchesChord } from './matchers';
import type { ShortcutDef } from './types';

type Handler = () => void;
type Predicate = () => boolean;

type Binding = {
  handler: Handler;
  enabled: Predicate;
};

class ShortcutService {
  private bindings = new Map<ShortcutId, Binding>();
  private listenerInstalled = false;

  register(id: ShortcutId, handler: Handler, enabled: Predicate): () => void {
    this.bindings.set(id, { handler, enabled });
    this.ensureListener();
    return () => {
      this.bindings.delete(id);
    };
  }

  private ensureListener() {
    if (this.listenerInstalled) return;
    this.listenerInstalled = true;
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    for (const [id, binding] of this.bindings) {
      // Cast to widen the over-narrowed union from `as const satisfies` so
      // the optional fields (allowRepeat / allowInTypingContext) are visible.
      const def = SHORTCUTS[id] as ShortcutDef;
      if (!def.allowInTypingContext && isTypingTarget(e.target)) continue;
      if (!def.allowRepeat && e.repeat) continue;
      if (!matchesChord(e, def.chord)) continue;
      if (!binding.enabled()) continue;
      e.preventDefault();
      binding.handler();
      return;
    }
  };
}

export const shortcuts = new ShortcutService();

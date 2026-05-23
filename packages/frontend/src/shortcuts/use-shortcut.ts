import { useEffect, useRef } from 'react';
import type { ShortcutId } from './definitions';
import { shortcuts } from './service';

type UseShortcutOptions = {
  /**
   * Returns true while the shortcut should be active. Re-evaluated on every
   * keydown — pass a closure that reads the latest state. Default: always.
   */
  enabled?: () => boolean;
};

/**
 * Bind a handler to a shortcut id. The handler and enabled predicate are
 * read fresh on every dispatch (via refs), so you can pass inline closures
 * without worrying about stale captures.
 */
export function useShortcut(
  id: ShortcutId,
  handler: () => void,
  options?: UseShortcutOptions,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const enabledRef = useRef(options?.enabled);
  enabledRef.current = options?.enabled;

  useEffect(() => {
    return shortcuts.register(
      id,
      () => handlerRef.current(),
      () => (enabledRef.current ? enabledRef.current() : true),
    );
  }, [id]);
}

import { useCallback, useEffect, useRef } from 'react';

/**
 * Debounced commit primitive.
 *
 * Calling `schedule(fn)` replaces any previously-scheduled commit and starts
 * a fresh timer; only the latest `fn` ends up running, `delay` ms after the
 * last call. `flush()` runs the pending commit immediately (used on unmount
 * so a draft isn't dropped if the user navigates away mid-pick).
 *
 * The commit closure is captured fresh on every `schedule` call, so the
 * caller can rely on it reading the freshest cache snapshot at fire time.
 */
export function useDebouncedCommit(delay: number) {
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const fn = pendingRef.current;
    pendingRef.current = null;
    fn?.();
  }, []);

  const schedule = useCallback(
    (commitFn: () => void) => {
      pendingRef.current = commitFn;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const fn = pendingRef.current;
        pendingRef.current = null;
        fn?.();
      }, delay);
    },
    [delay],
  );

  useEffect(() => {
    return () => {
      // Flush on unmount so a pending pick isn't lost if the user selects a
      // different item, switches pages, or navigates away mid-pick.
      flush();
    };
  }, [flush]);

  return { schedule, flush };
}

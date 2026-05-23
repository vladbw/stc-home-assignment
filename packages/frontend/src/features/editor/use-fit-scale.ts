import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Compute a CSS scale factor so a `naturalWidth × naturalHeight` element fits
 * inside the referenced container (preserves aspect ratio, never grows past 1).
 *
 * Re-measures on container resize via ResizeObserver.
 */
export function useFitScale(
  containerRef: RefObject<HTMLElement | null>,
  naturalWidth: number,
  naturalHeight: number,
): number {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      const s = Math.min(w / naturalWidth, h / naturalHeight, 1);
      setScale(s);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, naturalWidth, naturalHeight]);

  return scale;
}

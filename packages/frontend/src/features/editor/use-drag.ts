import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const DRAG_THRESHOLD_PX = 3;

type DragHandlers = {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
};

type Options = {
  /** Current canvas scale, so screen deltas convert to canvas-space deltas. */
  scale: number;
  /** Called once on drag-end with the cumulative canvas-space delta. */
  onCommit: (delta: { dx: number; dy: number }) => void;
};

type DragState = {
  /** True only once the pointer has actually moved past the threshold. */
  dragging: boolean;
  /** Live delta during a drag, in canvas-space pixels. Zero when not dragging. */
  delta: { dx: number; dy: number };
  handlers: DragHandlers;
};

/**
 * Pointer-events based drag primitive.
 *
 * Lifecycle:
 *   1. pointerdown → record start point, capture the pointer
 *   2. pointermove → if movement > threshold, transition to dragging and emit live delta
 *   3. pointerup   → if we were dragging, fire `onCommit` once; otherwise treat as a click
 *
 * The hook deliberately doesn't touch the DOM directly — the consumer reads
 * `delta` and `dragging` and applies them however it wants (e.g. translate,
 * inline left/top, etc.). Scale is read fresh on every move so window resizes
 * mid-drag stay correct.
 */
export function useDrag({ scale, onCommit }: Options): DragState {
  const [dragging, setDragging] = useState(false);
  const [delta, setDelta] = useState({ dx: 0, dy: 0 });

  const startRef = useRef<{ clientX: number; clientY: number; pointerId: number } | null>(null);
  const draggingRef = useRef(false);

  const reset = () => {
    startRef.current = null;
    draggingRef.current = false;
    setDelta({ dx: 0, dy: 0 });
    setDragging(false);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return; // primary button only
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || e.pointerId !== start.pointerId) return;

    const dxScreen = e.clientX - start.clientX;
    const dyScreen = e.clientY - start.clientY;

    if (!draggingRef.current) {
      if (Math.hypot(dxScreen, dyScreen) < DRAG_THRESHOLD_PX) return;
      draggingRef.current = true;
      setDragging(true);
    }

    setDelta({ dx: dxScreen / scale, dy: dyScreen / scale });
  };

  const finish = (e: ReactPointerEvent<HTMLElement>, commit: boolean) => {
    const start = startRef.current;
    if (!start || e.pointerId !== start.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer may already have been released by the browser
    }

    if (commit && draggingRef.current) {
      const dxScreen = e.clientX - start.clientX;
      const dyScreen = e.clientY - start.clientY;
      onCommit({ dx: dxScreen / scale, dy: dyScreen / scale });
    }

    reset();
  };

  return {
    dragging,
    delta,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e) => finish(e, true),
      onPointerCancel: (e) => finish(e, false),
    },
  };
}

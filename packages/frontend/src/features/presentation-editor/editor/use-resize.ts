import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export type ResizeCorner = 'nw' | 'ne' | 'se' | 'sw';

export type ResizeBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Proportional resize math.
 *
 * The opposite corner is the *anchor* — it stays exactly where it was. We
 * project the cursor's displacement onto the original diagonal direction
 * (anchor → dragged corner) and use that projection as a uniform scale
 * factor. This preserves aspect ratio regardless of cursor angle.
 *
 * Movement away from the anchor (along the diagonal) → projection grows →
 * box grows. Movement toward the anchor → projection shrinks → box shrinks,
 * down to `minSize`.
 */
export function computeProportionalResize(
  item: ResizeBox,
  corner: ResizeCorner,
  deltaCanvas: { x: number; y: number },
  minSize: number,
): ResizeBox {
  // Sign per axis: +1 means the dragged corner is on the +x / +y edge.
  const sx = corner === 'ne' || corner === 'se' ? 1 : -1;
  const sy = corner === 'sw' || corner === 'se' ? 1 : -1;

  // Anchor = opposite corner, stays fixed.
  const anchorX = item.x + (sx === -1 ? item.width : 0);
  const anchorY = item.y + (sy === -1 ? item.height : 0);

  // Original dragged-corner position.
  const origCornerX = anchorX + sx * item.width;
  const origCornerY = anchorY + sy * item.height;

  // New dragged-corner position after the cursor moved.
  const newCornerX = origCornerX + deltaCanvas.x;
  const newCornerY = origCornerY + deltaCanvas.y;

  // Diagonal direction from anchor to original dragged corner.
  const diagX = sx * item.width;
  const diagY = sy * item.height;
  const diagLen = Math.hypot(diagX, diagY);
  if (diagLen === 0) return item;

  const diagUx = diagX / diagLen;
  const diagUy = diagY / diagLen;

  // Project (newCorner - anchor) onto the diagonal unit vector.
  const projX = newCornerX - anchorX;
  const projY = newCornerY - anchorY;
  const projection = projX * diagUx + projY * diagUy;

  // Uniform scale = projection / original diagonal length.
  let scale = projection / diagLen;

  // Clamp so neither dimension drops below minSize.
  const minScale = minSize / Math.min(item.width, item.height);
  if (scale < minScale) scale = minScale;

  const newW = item.width * scale;
  const newH = item.height * scale;

  // Recompute top-left so the anchor stays put.
  const newX = sx === 1 ? anchorX : anchorX - newW;
  const newY = sy === 1 ? anchorY : anchorY - newH;

  return { x: newX, y: newY, width: newW, height: newH };
}

type Options = {
  item: ResizeBox;
  scale: number;
  onCommit: (next: ResizeBox) => void;
  minSize?: number;
};

type ResizeStart = {
  pointerId: number;
  corner: ResizeCorner;
  cursorStart: { x: number; y: number };
  itemStart: ResizeBox;
};

/**
 * Single resize state shared across all four corner handles of an item.
 *
 * Call `handlersFor('se')` etc. to get the four pointer event handlers
 * to spread onto each handle element. `transient` reflects the live box
 * during a resize; it's null when idle.
 */
export function useResize({ item, scale, onCommit, minSize = 20 }: Options) {
  const [transient, setTransient] = useState<ResizeBox | null>(null);
  const startRef = useRef<ResizeStart | null>(null);
  const transientRef = useRef<ResizeBox | null>(null);

  const onPointerDown = (corner: ResizeCorner) => (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = {
      pointerId: e.pointerId,
      corner,
      cursorStart: { x: e.clientX, y: e.clientY },
      itemStart: { x: item.x, y: item.y, width: item.width, height: item.height },
    };
    transientRef.current = null;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || e.pointerId !== start.pointerId) return;
    const dxScreen = e.clientX - start.cursorStart.x;
    const dyScreen = e.clientY - start.cursorStart.y;
    const next = computeProportionalResize(
      start.itemStart,
      start.corner,
      { x: dxScreen / scale, y: dyScreen / scale },
      minSize,
    );
    transientRef.current = next;
    setTransient(next);
  };

  const finish = (e: ReactPointerEvent<HTMLElement>, commit: boolean) => {
    const start = startRef.current;
    if (!start || e.pointerId !== start.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    const final = transientRef.current;
    startRef.current = null;
    transientRef.current = null;
    setTransient(null);
    if (commit && final) onCommit(final);
  };

  const handlersFor = (corner: ResizeCorner) => ({
    onPointerDown: onPointerDown(corner),
    onPointerMove,
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => finish(e, true),
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => finish(e, false),
  });

  return { transient, handlersFor };
}

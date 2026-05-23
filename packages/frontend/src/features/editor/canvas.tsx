import { useRef, type CSSProperties, type KeyboardEvent } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type ContentResponse,
  type PageResponse,
} from '@sts/shared';
import { useUpdateContent } from '../../queries/content';
import { useEditorStore } from '../../stores/editor-store';
import { useDrag } from './use-drag';
import { useFitScale } from './use-fit-scale';
import { useResize, type ResizeCorner } from './use-resize';
import styles from './editor.module.css';

type Props = {
  page: PageResponse | null;
  presentationId: string;
};

export function Canvas({ page, presentationId }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(areaRef, CANVAS_WIDTH, CANVAS_HEIGHT);
  const selectContent = useEditorStore((s) => s.selectContent);

  if (!page) {
    return (
      <div ref={areaRef} className={styles.canvasArea}>
        <p className={styles.canvasEmpty}>No page selected</p>
      </div>
    );
  }

  // Deselect when the user clicks anywhere that isn't a content item.
  // Items stop pointer-event propagation, so clicks on them don't reach here.
  const handleBackdropPointerDown = () => selectContent(null);

  return (
    <div
      ref={areaRef}
      className={styles.canvasArea}
      onPointerDown={handleBackdropPointerDown}
    >
      <div
        className={styles.canvasStage}
        style={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}
      >
        <div
          className={styles.canvas}
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            backgroundColor: page.backgroundColor,
          }}
        >
          {page.content.map((item) => (
            <ContentItemView
              key={item.id}
              item={item}
              scale={scale}
              presentationId={presentationId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type ItemProps = {
  item: ContentResponse;
  scale: number;
  presentationId: string;
};

function ContentItemView({ item, scale, presentationId }: ItemProps) {
  const selectedId = useEditorStore((s) => s.selectedContentId);
  const editingId = useEditorStore((s) => s.editingContentId);
  const selectContent = useEditorStore((s) => s.selectContent);
  const beginEdit = useEditorStore((s) => s.beginEdit);

  const isSelected = selectedId === item.id;
  const isEditing = editingId === item.id;

  const update = useUpdateContent(presentationId);

  const { dragging, delta, handlers: dragHandlers } = useDrag({
    scale,
    onCommit: ({ dx, dy }) => {
      const nextX = Math.max(0, Math.min(CANVAS_WIDTH - item.width, item.x + dx));
      const nextY = Math.max(0, Math.min(CANVAS_HEIGHT - item.height, item.y + dy));
      if (nextX === item.x && nextY === item.y) return;
      update.mutate({ id: item.id, input: { x: nextX, y: nextY } });
    },
  });

  const { transient: resizeT, handlersFor: makeResizeHandlers } = useResize({
    item: { x: item.x, y: item.y, width: item.width, height: item.height },
    scale,
    onCommit: ({ x, y, width, height }) => {
      // Clamp to canvas bounds — never let the item extend past the page.
      const clampedW = Math.min(width, CANVAS_WIDTH);
      const clampedH = Math.min(height, CANVAS_HEIGHT);
      const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - clampedW, x));
      const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - clampedH, y));
      update.mutate({
        id: item.id,
        input: { x: clampedX, y: clampedY, width: clampedW, height: clampedH },
      });
    },
  });

  // While editing a text item, render the textarea overlay instead.
  if (item.type === 'text' && isEditing) {
    return <TextEditView item={item} presentationId={presentationId} />;
  }

  const onPointerDownItem = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    selectContent(item.id);
    dragHandlers.onPointerDown(e);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (item.type !== 'text') return;
    e.stopPropagation();
    beginEdit(item.id);
  };

  // Live geometry: resize transient takes precedence over drag delta.
  const liveX = resizeT?.x ?? item.x + delta.dx;
  const liveY = resizeT?.y ?? item.y + delta.dy;
  const liveW = resizeT?.width ?? item.width;
  const liveH = resizeT?.height ?? item.height;

  const isInteracting = dragging || resizeT !== null;

  const baseStyle: CSSProperties = {
    position: 'absolute',
    left: liveX,
    top: liveY,
    width: liveW,
    height: liveH,
    zIndex: isInteracting ? 9999 : item.zIndex,
    cursor: dragging ? 'grabbing' : 'grab',
  };

  const className = `${styles.contentItem} ${isSelected ? styles.contentItemSelected : ''}`;

  // Handles render outside the item's content (negative offset), so they sit
  // on the edge of the selection ring. They sit *inside* the item's DOM tree
  // so they get the same canvas-space transform; we scale their pixel size
  // by 1/scale so they always look ~14px on screen.
  const showHandles = isSelected && !isEditing;
  const handleSize = 14 / scale;

  const body =
    item.type === 'text' ? (
      <div
        className={styles.contentText}
        style={{
          width: '100%',
          height: '100%',
          fontWeight: item.style?.bold ? 700 : 400,
          fontStyle: item.style?.italic ? 'italic' : 'normal',
          color: item.style?.color ?? '#000000',
          pointerEvents: 'none',
        }}
      >
        {item.text}
      </div>
    ) : (
      <span style={{ pointerEvents: 'none' }}>[{item.type}]</span>
    );

  return (
    <div
      className={className}
      style={baseStyle}
      onPointerDown={onPointerDownItem}
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={dragHandlers.onPointerUp}
      onPointerCancel={dragHandlers.onPointerCancel}
      onDoubleClick={onDoubleClick}
      title={item.type === 'text' ? undefined : `${item.type} (phase 9)`}
    >
      {body}
      {showHandles && (
        <>
          <ResizeHandleView corner="nw" handleSize={handleSize} handlers={makeResizeHandlers('nw')} />
          <ResizeHandleView corner="ne" handleSize={handleSize} handlers={makeResizeHandlers('ne')} />
          <ResizeHandleView corner="se" handleSize={handleSize} handlers={makeResizeHandlers('se')} />
          <ResizeHandleView corner="sw" handleSize={handleSize} handlers={makeResizeHandlers('sw')} />
        </>
      )}
    </div>
  );
}

function ResizeHandleView({
  corner,
  handleSize,
  handlers,
}: {
  corner: ResizeCorner;
  handleSize: number;
  handlers: ReturnType<ReturnType<typeof useResize>['handlersFor']>;
}) {
  const half = handleSize / 2;
  const positionByCorner: Record<ResizeCorner, CSSProperties> = {
    nw: { top: -half, left: -half, cursor: 'nwse-resize' },
    ne: { top: -half, right: -half, cursor: 'nesw-resize' },
    se: { bottom: -half, right: -half, cursor: 'nwse-resize' },
    sw: { bottom: -half, left: -half, cursor: 'nesw-resize' },
  };

  return (
    <div
      className={styles.resizeHandle}
      style={{ width: handleSize, height: handleSize, ...positionByCorner[corner] }}
      {...handlers}
      aria-hidden
    />
  );
}

/**
 * Inline text editor. Mounted in place of the read-only text div while the
 * item is being edited. Saves on blur, Escape cancels.
 */
function TextEditView({
  item,
  presentationId,
}: {
  item: ContentResponse;
  presentationId: string;
}) {
  const endEdit = useEditorStore((s) => s.endEdit);
  const update = useUpdateContent(presentationId);
  const cancelledRef = useRef(false);

  const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    const cancelled = cancelledRef.current;
    cancelledRef.current = false;
    if (!cancelled && value !== (item.text ?? '')) {
      update.mutate({ id: item.id, input: { text: value } });
    }
    endEdit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      e.currentTarget.blur();
    }
  };

  return (
    <textarea
      autoFocus
      defaultValue={item.text ?? ''}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={styles.contentTextEditing}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        zIndex: 9999,
        fontWeight: item.style?.bold ? 700 : 400,
        fontStyle: item.style?.italic ? 'italic' : 'normal',
        color: item.style?.color ?? '#000000',
      }}
    />
  );
}

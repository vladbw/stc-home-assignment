import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_TEXT_STYLE,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  type ContentResponse,
  type PageResponse,
  type TextStyle,
} from '@sts/shared';
import { useMediaItem } from '../../../queries/media';
import { useEditorStore } from '../../../stores/editor-store';
import { useDrag } from './use-drag';
import { useEditorActions } from './use-editor-actions';
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

/** Resolve the full style with defaults filled in for legacy / partial style data. */
function resolveStyle(item: ContentResponse): TextStyle {
  return {
    bold: item.style?.bold ?? DEFAULT_TEXT_STYLE.bold,
    italic: item.style?.italic ?? DEFAULT_TEXT_STYLE.italic,
    color: item.style?.color ?? DEFAULT_TEXT_STYLE.color,
    fontSize: item.style?.fontSize ?? DEFAULT_TEXT_STYLE.fontSize,
  };
}

function clampFontSize(n: number): number {
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(n)));
}

const ContentItemView = memo(function ContentItemView({
  item,
  scale,
  presentationId,
}: ItemProps) {
  // Derived boolean selectors. Zustand only re-renders when the *result*
  // changes (=== compare), so an item that isn't this one being selected/
  // deselected doesn't bounce this component. Without this, every selection
  // change rerendered every content item on the page.
  const isSelected = useEditorStore((s) => s.selectedContentId === item.id);
  const isEditing = useEditorStore((s) => s.editingContentId === item.id);
  const selectContent = useEditorStore((s) => s.selectContent);
  const beginEdit = useEditorStore((s) => s.beginEdit);

  const isText = item.type === 'text';

  const actions = useEditorActions(presentationId);
  const currentStyle = resolveStyle(item);

  const itemDomRef = useRef<HTMLDivElement>(null);
  // For text items, the *displayed* size is determined by content + fontSize
  // (the box hugs the text). The drag/resize math needs to know the real
  // pixel dimensions, so we measure them via offsetWidth/offsetHeight after
  // every render that could affect them.
  // For media items we just trust the stored width/height.
  const [renderedSize, setRenderedSize] = useState<{ w: number; h: number }>(() => ({
    w: item.width,
    h: item.height,
  }));

  useLayoutEffect(() => {
    if (!isText) {
      setRenderedSize({ w: item.width, h: item.height });
      return;
    }
    const el = itemDomRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0 && h > 0) setRenderedSize({ w, h });
  }, [
    isText,
    item.text,
    item.width,
    item.height,
    currentStyle.fontSize,
    currentStyle.bold,
    currentStyle.italic,
  ]);

  const { dragging, delta, handlers: dragHandlers } = useDrag({
    scale,
    onCommit: ({ dx, dy }) => {
      const w = renderedSize.w;
      const h = renderedSize.h;
      const nextX = Math.max(0, Math.min(CANVAS_WIDTH - w, item.x + dx));
      const nextY = Math.max(0, Math.min(CANVAS_HEIGHT - h, item.y + dy));
      if (Math.round(nextX) === Math.round(item.x) && Math.round(nextY) === Math.round(item.y))
        return;
      actions.patchContent(item, { x: nextX, y: nextY });
    },
  });

  const { transient: resizeT, handlersFor: makeResizeHandlers } = useResize({
    // Pass the measured/displayed size as the resize starting box — for text
    // this is the rendered text bounds, not the stale stored width/height.
    item: { x: item.x, y: item.y, width: renderedSize.w, height: renderedSize.h },
    scale,
    onCommit: ({ x, y, width, height }) => {
      if (isText) {
        const startW = Math.max(1, renderedSize.w);
        const scaleFactor = width / startW;
        const newFontSize = clampFontSize(currentStyle.fontSize * scaleFactor);
        if (
          newFontSize === currentStyle.fontSize &&
          Math.round(x) === Math.round(item.x) &&
          Math.round(y) === Math.round(item.y)
        ) {
          return;
        }
        actions.patchContent(item, {
          x: Math.round(x),
          y: Math.round(y),
          style: { ...currentStyle, fontSize: newFontSize },
        });
      } else {
        const clampedW = Math.min(width, CANVAS_WIDTH);
        const clampedH = Math.min(height, CANVAS_HEIGHT);
        const clampedX = Math.max(0, Math.min(CANVAS_WIDTH - clampedW, x));
        const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT - clampedH, y));
        actions.patchContent(item, {
          x: clampedX,
          y: clampedY,
          width: clampedW,
          height: clampedH,
        });
      }
    },
  });

  // While editing a text item, render the textarea overlay instead.
  if (isText && isEditing) {
    return <TextEditView item={item} presentationId={presentationId} style={currentStyle} />;
  }

  const onPointerDownItem = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    selectContent(item.id);
    dragHandlers.onPointerDown(e);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!isText) return;
    e.stopPropagation();
    beginEdit(item.id);
  };

  // Live geometry: resize transient takes precedence over drag delta.
  const liveX = resizeT?.x ?? item.x + delta.dx;
  const liveY = resizeT?.y ?? item.y + delta.dy;

  // For text: derive live fontSize from the projection scale during resize.
  // For media: width/height come straight from the transient.
  const liveFontSize = (() => {
    if (!isText) return undefined;
    if (resizeT && renderedSize.w > 0) {
      const scaleFactor = resizeT.width / renderedSize.w;
      return clampFontSize(currentStyle.fontSize * scaleFactor);
    }
    return currentStyle.fontSize;
  })();

  const isInteracting = dragging || resizeT !== null;

  const baseStyle: CSSProperties = {
    position: 'absolute',
    left: liveX,
    top: liveY,
    zIndex: isInteracting ? 9999 : item.zIndex,
    cursor: dragging ? 'grabbing' : 'grab',
    ...(isText
      ? {} // no fixed width/height — box hugs the text content
      : {
          width: resizeT?.width ?? item.width,
          height: resizeT?.height ?? item.height,
        }),
  };

  const className = `${styles.contentItem} ${isSelected ? styles.contentItemSelected : ''}`;

  const showHandles = isSelected && !isEditing;
  const handleSize = 14 / scale;

  const body = isText ? (
    <div
      className={styles.contentText}
      style={{
        fontSize: liveFontSize,
        fontWeight: currentStyle.bold ? 700 : 400,
        fontStyle: currentStyle.italic ? 'italic' : 'normal',
        color: currentStyle.color,
      }}
    >
      {item.text || ' '}
    </div>
  ) : (
    <MediaContent item={item} />
  );

  return (
    <div
      ref={itemDomRef}
      className={className}
      style={baseStyle}
      onPointerDown={onPointerDownItem}
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={dragHandlers.onPointerUp}
      onPointerCancel={dragHandlers.onPointerCancel}
      onDoubleClick={onDoubleClick}
      title={isText ? undefined : `${item.type} (phase 9)`}
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
});

/**
 * Renders an image or video content item by fetching its Media record
 * (and presigned GET URL) through useMediaItem. Pointer events are disabled
 * on the inner img/video so the parent's drag/resize handlers receive them
 * cleanly.
 */
function MediaContent({ item }: { item: ContentResponse }) {
  const { data: media } = useMediaItem(item.mediaId);

  if (!media || !media.url) {
    return <div className={styles.mediaLoading}>Loading…</div>;
  }

  if (item.type === 'image') {
    return (
      <img
        loading='lazy'
        src={media.url}
        alt={media.originalFilename}
        draggable={false}
        className={styles.mediaContent}
      />
    );
  }

  // Editor-mode video: static first-frame preview, no controls.
  // Playback happens in presentation mode. We nudge currentTime past 0 to
  // force the browser to actually composite a frame instead of showing a
  // black box.
  return (
    <video
      src={media.url}
      muted
      preload="auto"
      playsInline
      className={styles.mediaContent}
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        if (v.currentTime === 0) v.currentTime = 0.001;
      }}
    />
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
 * item is being edited.
 *
 * Persistence is driven by the unmount cleanup, NOT by `onBlur`. This is
 * necessary because the parent unmounts this component synchronously when
 * the user does any of: click another content item, click outside the page,
 * change pages, navigate away. None of those cause the browser to fire a
 * blur event before the textarea is gone — relying on blur alone would drop
 * the user's edits in every one of those cases.
 *
 * The textarea auto-sizes to its content via `field-sizing: content`
 * (supported in modern Chromium / Safari; Firefox falls back gracefully).
 */
function TextEditView({
  item,
  presentationId,
  style,
}: {
  item: ContentResponse;
  presentationId: string;
  style: TextStyle;
}) {
  const endEdit = useEditorStore((s) => s.endEdit);
  const actions = useEditorActions(presentationId);

  const draftRef = useRef(item.text ?? '');
  const cancelledRef = useRef(false);
  const itemRef = useRef(item);
  itemRef.current = item;
  // Capture `actions` in a ref so the unmount cleanup can call the latest
  // version (actions is recreated on each render).
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    return () => {
      const value = draftRef.current;
      if (!cancelledRef.current && value !== (itemRef.current.text ?? '')) {
        actionsRef.current.patchContent(itemRef.current, { text: value });
      }
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    draftRef.current = e.target.value;
  };

  const onBlur = () => {
    endEdit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      endEdit();
    }
  };

  return (
    <textarea
      autoFocus
      defaultValue={item.text ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={styles.contentTextEditing}
      style={{
        left: item.x,
        top: item.y,
        zIndex: 9999,
        fontSize: style.fontSize,
        fontWeight: style.bold ? 700 : 400,
        fontStyle: style.italic ? 'italic' : 'normal',
        color: style.color,
      }}
    />
  );
}

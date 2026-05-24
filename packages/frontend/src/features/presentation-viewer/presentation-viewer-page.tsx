import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_TEXT_STYLE,
  type ContentResponse,
  type PageResponse,
  type TextStyle,
} from '@sts/shared';
import { useMediaItem } from '../../queries/media';
import { usePresentationDetail } from '../../queries/presentations';
import { useShortcut } from '../../shortcuts/use-shortcut';
import { useEditorStore } from '../../stores/editor-store';
import { useFitScale} from '../presentation-editor/editor/use-fit-scale';
import styles from './presentation-viewer.module.css';


// The page where we view (in presentation mode) a given presentation
export function PresentationViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: presentation, isLoading, error } = usePresentationDetail(id);

  // currentIndex is set once, the first time we have presentation data, from
  // whichever page the user was viewing in the editor (via the editor store).
  // It then becomes purely local to this route.
  const initializedRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (initializedRef.current || !presentation) return;
    initializedRef.current = true;
    const fromStore = useEditorStore.getState().activePageId;
    if (!fromStore) {
      setCurrentIndex(0);
      return;
    }
    const idx = presentation.pages.findIndex((p) => p.id === fromStore);
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [presentation]);

  const pageCount = presentation?.pages.length ?? 0;
  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(pageCount - 1, i + 1));
  const exit = () => navigate(`/presentations/${id}`);

  useShortcut('presentation.prevSlide', goPrev);
  useShortcut('presentation.nextSlide', goNext);
  useShortcut('presentation.nextSlideAlt', goNext);
  useShortcut('presentation.exit', exit);

  if (isLoading) {
    return <div className={styles.status}>Loading…</div>;
  }
  if (error) {
    return (
      <div className={styles.status}>
        <p className={styles.statusError}>{error.message}</p>
        <button type="button" className={styles.statusExit} onClick={exit}>
          Back to editor
        </button>
      </div>
    );
  }
  if (!presentation) return null;
  if (presentation.pages.length === 0) {
    return (
      <div className={styles.status}>
        <p>This presentation has no pages.</p>
        <button type="button" className={styles.statusExit} onClick={exit}>
          Back to editor
        </button>
      </div>
    );
  }

  const clampedIndex = Math.min(currentIndex, presentation.pages.length - 1);
  const currentPage = presentation.pages[clampedIndex]!;

  return (
    <div className={styles.presentation}>
      <PresentationCanvas page={currentPage} />

      <button
        type="button"
        className={`${styles.navButton} ${styles.navPrev}`}
        onClick={goPrev}
        disabled={clampedIndex === 0}
        aria-label="Previous slide"
      >
        ‹
      </button>

      <button
        type="button"
        className={`${styles.navButton} ${styles.navNext}`}
        onClick={goNext}
        disabled={clampedIndex === presentation.pages.length - 1}
        aria-label="Next slide"
      >
        ›
      </button>

      <button
        type="button"
        className={styles.exitButton}
        onClick={exit}
        aria-label="Exit presentation"
        title="Exit (Esc)"
      >
        ×
      </button>

      <div className={styles.pageIndicator} aria-live="polite">
        {clampedIndex + 1} / {presentation.pages.length}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Canvas + content rendering                                                 */
/* -------------------------------------------------------------------------- */

function PresentationCanvas({ page }: { page: PageResponse }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(areaRef, CANVAS_WIDTH, CANVAS_HEIGHT);

  // The "first video" is the first video item in the page's content list as
  // returned by the API (which sorts by zIndex asc, then createdAt asc).
  // That one autoplays; the others have controls but don't autoplay.
  const firstVideoId = useMemo(
    () => page.content.find((c) => c.type === 'video')?.id ?? null,
    [page.content],
  );

  return (
    <div ref={areaRef} className={styles.canvasArea}>
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
            <ContentView
              key={item.id}
              item={item}
              autoPlay={item.id === firstVideoId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentView({
  item,
  autoPlay,
}: {
  item: ContentResponse;
  autoPlay: boolean;
}) {
  if (item.type === 'text') {
    return <TextView item={item} />;
  }
  return <MediaView item={item} autoPlay={autoPlay} />;
}

function TextView({ item }: { item: ContentResponse }) {
  const style: TextStyle = {
    bold: item.style?.bold ?? DEFAULT_TEXT_STYLE.bold,
    italic: item.style?.italic ?? DEFAULT_TEXT_STYLE.italic,
    color: item.style?.color ?? DEFAULT_TEXT_STYLE.color,
    fontSize: item.style?.fontSize ?? DEFAULT_TEXT_STYLE.fontSize,
  };

  return (
    <div
      className={styles.contentText}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        zIndex: item.zIndex,
        fontSize: style.fontSize,
        fontWeight: style.bold ? 700 : 400,
        fontStyle: style.italic ? 'italic' : 'normal',
        color: style.color,
      }}
    >
      {item.text}
    </div>
  );
}

function MediaView({
  item,
  autoPlay,
}: {
  item: ContentResponse;
  autoPlay: boolean;
}) {
  const { data: media } = useMediaItem(item.mediaId);

  const baseStyle: CSSProperties = {
    position: 'absolute',
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    zIndex: item.zIndex,
  };

  if (!media || !media.url) {
    return (
      <div className={styles.mediaLoading} style={baseStyle}>
        Loading…
      </div>
    );
  }

  if (item.type === 'image') {
    return (
      <img
        loading='lazy'
        src={media.url}
        alt={media.originalFilename}
        draggable={false}
        className={styles.mediaImage}
        style={baseStyle}
      />
    );
  }

  // Video. The first video on the page autoplays muted (browsers require
  // muted for unprompted autoplay); the user can unmute via the controls.
  // All videos get controls so the viewer can play/pause/seek at will.
  return (
    <video
      key={`${item.id}:${autoPlay}`} // remount when autoplay decision changes (page change)
      src={media.url}
      controls
      autoPlay={autoPlay}
      muted={autoPlay}
      preload="auto"
      playsInline
      className={styles.mediaVideo}
      style={baseStyle}
    />
  );
}

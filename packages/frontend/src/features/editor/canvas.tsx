import { useRef } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type ContentResponse,
  type PageResponse,
} from '@sts/shared';
import { useFitScale } from './use-fit-scale';
import styles from './editor.module.css';

type Props = {
  page: PageResponse | null;
};

export function Canvas({ page }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(areaRef, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (!page) {
    return (
      <div ref={areaRef} className={styles.canvasArea}>
        <p className={styles.canvasEmpty}>No page selected</p>
      </div>
    );
  }

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
            <ContentItemView key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Read-only rendering of a content item. Interaction comes in phase 8. */
function ContentItemView({ item }: { item: ContentResponse }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    zIndex: item.zIndex,
  };

  if (item.type === 'text') {
    return (
      <div
        className={`${styles.contentItem} ${styles.contentText}`}
        style={{
          ...style,
          fontWeight: item.style?.bold ? 700 : 400,
          fontStyle: item.style?.italic ? 'italic' : 'normal',
          color: item.style?.color ?? '#000000',
        }}
      >
        {item.text}
      </div>
    );
  }

  // image / video rendering lands in phase 9
  return (
    <div className={styles.contentItem} style={style} title={`${item.type} (phase 9)`}>
      [{item.type}]
    </div>
  );
}

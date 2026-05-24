import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  VIDEO_MIME_TYPES,
  type MediaResponse,
} from '@sts/shared';
import { useMediaList } from '../../queries/media';
import { getMediaDimensions, type NaturalDimensions } from './media-dimensions';
import { uploadFile } from './upload-file';
import styles from './media-picker.module.css';

export type PickedMedia = {
  mediaId: string;
  naturalWidth: number;
  naturalHeight: number;
};

type Props = {
  kind: 'image' | 'video';
  onClose: () => void;
  onPick: (picked: PickedMedia) => void;
};

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'error'; message: string };

/** Fallbacks for when intrinsic dimensions can't be read for any reason. */
const FALLBACK_DIMENSIONS: Record<'image' | 'video', NaturalDimensions> = {
  image: { width: 400, height: 300 },
  video: { width: 480, height: 270 },
};

async function measureSafely(
  kind: 'image' | 'video',
  src: string,
): Promise<NaturalDimensions> {
  try {
    return await getMediaDimensions(kind, src);
  } catch {
    return FALLBACK_DIMENSIONS[kind];
  }
}

export function MediaPicker({ kind, onClose, onPick }: Props) {
  const { data: library, isLoading } = useMediaList({ type: kind });
  const [upload, setUpload] = useState<UploadState>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedMimes = kind === 'image' ? IMAGE_MIME_TYPES : VIDEO_MIME_TYPES;
  const maxSize = kind === 'image' ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
  const maxMb = (maxSize / 1024 / 1024).toFixed(0);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!(allowedMimes as readonly string[]).includes(file.type)) {
      setUpload({
        status: 'error',
        message: `Unsupported file type: ${file.type || 'unknown'}`,
      });
      return;
    }
    if (file.size > maxSize) {
      setUpload({ status: 'error', message: `File exceeds ${maxMb} MB` });
      return;
    }

    setUpload({ status: 'uploading', progress: 0 });

    // Measure dimensions locally from the File while/before uploading.
    // This is a cheap browser-side decode (no network) and we keep the
    // object URL alive only as long as needed.
    const objectUrl = URL.createObjectURL(file);
    let dimensions: NaturalDimensions;
    try {
      dimensions = await measureSafely(kind, objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    try {
      const mediaId = await uploadFile(file, (progress) => {
        setUpload({ status: 'uploading', progress });
      });
      onPick({
        mediaId,
        naturalWidth: dimensions.width,
        naturalHeight: dimensions.height,
      });
    } catch (err) {
      setUpload({
        status: 'error',
        message: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  const onLibraryItemClick = async (m: MediaResponse) => {
    // Library items already have a presigned GET URL; the browser likely
    // cached the bytes when rendering the thumbnail.
    const dimensions = m.url
      ? await measureSafely(kind, m.url)
      : FALLBACK_DIMENSIONS[kind];
    onPick({
      mediaId: m.id,
      naturalWidth: dimensions.width,
      naturalHeight: dimensions.height,
    });
  };

  const isUploading = upload.status === 'uploading';

  return createPortal(
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${kind}`}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Add {kind}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Upload new</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedMimes.join(',')}
            onChange={onFileChange}
            disabled={isUploading}
          />
          <p className={styles.hint}>
            Max {maxMb} MB. Allowed: {allowedMimes.join(', ')}.
          </p>

          {upload.status === 'uploading' && (
            <div className={styles.progressRow}>
              <progress value={upload.progress} max={1} />
              <span>{Math.round(upload.progress * 100)}%</span>
            </div>
          )}
          {upload.status === 'error' && (
            <p className={styles.error}>{upload.message}</p>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>From library</h3>
          {isLoading && <p>Loading…</p>}
          {library && library.length === 0 && (
            <p className={styles.empty}>No {kind}s uploaded yet.</p>
          )}
          {library && library.length > 0 && (
            <div className={styles.libraryGrid}>
              {library.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={styles.libraryItem}
                  onClick={() => onLibraryItemClick(m)}
                  title={m.originalFilename}
                  disabled={isUploading}
                >
                  {m.contentType.startsWith('image/') ? (
                    <img
                      loading='lazy'
                      src={m.url ?? ''}
                      alt={m.originalFilename}
                      className={styles.libraryThumb}
                    />
                  ) : (
                    <video
                      src={m.url ?? ''}
                      muted
                      preload="metadata"
                      className={styles.libraryThumb}
                    />
                  )}
                  <span className={styles.libraryLabel}>
                    {m.originalFilename}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>,
    document.body,
  );
}

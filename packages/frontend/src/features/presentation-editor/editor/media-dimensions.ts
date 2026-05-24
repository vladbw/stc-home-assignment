/**
 * Helpers for reading an image / video's intrinsic dimensions before we
 * create a content item for it. Without this, a freshly-added media item
 * is fixed to a hardcoded 400×300 / 480×270 box, and `object-fit: contain`
 * letterboxes inside it — that empty padding becomes un-grabbable space
 * that the canvas-edge clamp can't see past.
 *
 * Both helpers work with any URL the browser can load: blob/object URLs
 * for in-memory `File`s, or remote presigned GET URLs for already-uploaded
 * media in the library.
 */

export type NaturalDimensions = { width: number; height: number };

export async function getImageDimensions(src: string): Promise<NaturalDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image for measurement'));
    img.src = src;
  });
}

export async function getVideoDimensions(src: string): Promise<NaturalDimensions> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error('Video has zero dimensions'));
      } else {
        resolve({ width: video.videoWidth, height: video.videoHeight });
      }
    };
    video.onerror = () => reject(new Error('Failed to load video for measurement'));
    video.src = src;
  });
}

export async function getMediaDimensions(
  kind: 'image' | 'video',
  src: string,
): Promise<NaturalDimensions> {
  return kind === 'image' ? getImageDimensions(src) : getVideoDimensions(src);
}

/**
 * Scale `natural` down (preserving aspect ratio) so it fits inside the box
 * defined by `maxWidth × maxHeight`. If it already fits, returns it as-is.
 * Output is rounded to integer pixels.
 */
export function fitDimensionsToBox(
  natural: NaturalDimensions,
  maxWidth: number,
  maxHeight: number,
): NaturalDimensions {
  const { width: w, height: h } = natural;
  if (w <= 0 || h <= 0) return { width: 1, height: 1 };
  if (w <= maxWidth && h <= maxHeight) {
    return { width: Math.round(w), height: Math.round(h) };
  }
  const scale = Math.min(maxWidth / w, maxHeight / h);
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

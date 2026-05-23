import { mediaService } from '../../services/media';

/**
 * Three-step upload pipeline, mirroring the backend's design from phase 5:
 *
 *   1. Reserve a Media row + signed PUT URL on our backend.
 *   2. PUT the file directly to S3 — via XHR rather than fetch, because
 *      `fetch` has no upload-progress API.
 *   3. Confirm on our backend, which HEADs the S3 object and flips the
 *      Media row to `uploaded`.
 *
 * If step 2 fails, we explicitly POST /media/:id/cancel so the reserved
 * Media row gets flagged `failed` instead of left as a stale `pending`.
 */
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const reserve = await mediaService.requestUploadUrl({
    contentType: file.type,
    size: file.size,
    filename: file.name,
  });

  try {
    await uploadToS3(reserve.uploadUrl, file, onProgress);
  } catch (err) {
    void mediaService.cancel(reserve.mediaId);
    throw err;
  }

  await mediaService.confirm(reserve.mediaId);
  return reserve.mediaId;
}

function uploadToS3(
  url: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));
    xhr.send(file);
  });
}

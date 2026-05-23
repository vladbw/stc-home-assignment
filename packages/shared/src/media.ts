import { z } from 'zod';

/** Allowlists. Anything not in here is rejected by the backend. */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;

export const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

function isImageMime(contentType: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(contentType);
}

function isVideoMime(contentType: string): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(contentType);
}

export function maxSizeFor(contentType: string): number {
  if (isImageMime(contentType)) return MAX_IMAGE_SIZE_BYTES;
  if (isVideoMime(contentType)) return MAX_VIDEO_SIZE_BYTES;
  return 0;
}

/** Body for POST /api/media/upload-url */
export const RequestUploadUrlSchema = z
  .object({
    contentType: z.string().min(1),
    size: z.number().int().positive(),
    filename: z.string().min(1).max(255),
  })
  .superRefine((data, ctx) => {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(data.contentType)) {
      ctx.addIssue({
        path: ['contentType'],
        code: z.ZodIssueCode.custom,
        message: `Unsupported file type: ${data.contentType}`,
      });
      return;
    }
    const max = maxSizeFor(data.contentType);
    if (data.size > max) {
      ctx.addIssue({
        path: ['size'],
        code: z.ZodIssueCode.custom,
        message: `File exceeds ${(max / 1024 / 1024).toFixed(0)} MB`,
      });
    }
  });
export type RequestUploadUrlInput = z.infer<typeof RequestUploadUrlSchema>;

/** Response for POST /api/media/upload-url */
export const UploadUrlResponseSchema = z.object({
  mediaId: z.string().uuid(),
  uploadUrl: z.string().url(),
  key: z.string(),
  expiresIn: z.number().int().positive(),
});
export type UploadUrlResponse = z.infer<typeof UploadUrlResponseSchema>;

export const MediaStatusSchema = z.enum(['pending', 'uploaded', 'failed']);
export type MediaStatus = z.infer<typeof MediaStatusSchema>;

/** Public Media shape returned by the API. `url` is a presigned GET URL when uploaded. */
export const MediaResponseSchema = z.object({
  id: z.string().uuid(),
  contentType: z.string(),
  size: z.number().int().nonnegative(),
  originalFilename: z.string(),
  status: MediaStatusSchema,
  url: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  uploadedAt: z.string().datetime().nullable(),
});
export type MediaResponse = z.infer<typeof MediaResponseSchema>;

/** Query string for GET /api/media */
export const ListMediaQuerySchema = z.object({
  type: z.enum(['image', 'video']).optional(),
});
export type ListMediaQuery = z.infer<typeof ListMediaQuerySchema>;

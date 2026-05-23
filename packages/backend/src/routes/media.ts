import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Media } from '@prisma/client';
import {
  ListMediaQuerySchema,
  RequestUploadUrlSchema,
  type MediaResponse,
} from '@sts/shared';
import { db } from '../db';
import { badRequest, notFound } from '../errors';
import { headObject, presignedGetUrl, presignedPutUrl } from '../s3';

const IdParams = z.object({ id: z.string().uuid() });

const UPLOAD_URL_TTL_SECONDS = 300;
const VIEW_URL_TTL_SECONDS = 3600;

/** Map a Prisma Media row to the public response shape, including a fresh GET URL. */
async function toMediaResponse(media: Media): Promise<MediaResponse> {
  const url = media.status === 'uploaded' ? await presignedGetUrl(media.s3Key, VIEW_URL_TTL_SECONDS) : null;
  return {
    id: media.id,
    contentType: media.contentType,
    size: media.size,
    originalFilename: media.originalFilename,
    status: media.status,
    url,
    createdAt: media.createdAt.toISOString(),
    uploadedAt: media.uploadedAt?.toISOString() ?? null,
  };
}

/** Derive an S3 key extension from the validated MIME (not from the client filename). */
function extensionFor(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
  };
  return map[contentType] ?? '';
}

export const mediaRoutes: FastifyPluginAsync = async (app) => {
  /**
   * Reserve a Media row and return a presigned PUT URL.
   * Client uploads directly to S3 against this URL, then calls /confirm.
   */
  app.post('/media/upload-url', async (req, reply) => {
    const body = RequestUploadUrlSchema.parse(req.body);

    const key = `media/${randomUUID()}${extensionFor(body.contentType)}`;

    const media = await db.media.create({
      data: {
        s3Key: key,
        contentType: body.contentType,
        size: body.size,
        originalFilename: body.filename,
        status: 'pending',
      },
    });

    const uploadUrl = await presignedPutUrl(
      key,
      body.contentType,
      body.size,
      UPLOAD_URL_TTL_SECONDS,
    );

    reply.status(201);
    return {
      mediaId: media.id,
      uploadUrl,
      key,
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    };
  });

  /**
   * Verify the S3 object exists and matches what we reserved, then flip status
   * to `uploaded`. Idempotent.
   */
  app.post('/media/:id/confirm', async (req) => {
    const { id } = IdParams.parse(req.params);
    const media = await db.media.findUnique({ where: { id } });
    if (!media) throw notFound('Media not found');

    if (media.status === 'uploaded') return toMediaResponse(media);
    if (media.status === 'failed') throw badRequest('Media is marked as failed');

    const head = await headObject(media.s3Key);
    if (!head) throw badRequest('Object not found in storage');
    if (head.size !== media.size) {
      throw badRequest(`Uploaded size ${head.size} does not match reserved ${media.size}`);
    }
    if (head.contentType && head.contentType !== media.contentType) {
      throw badRequest(
        `Uploaded content-type ${head.contentType} does not match reserved ${media.contentType}`,
      );
    }

    const updated = await db.media.update({
      where: { id },
      data: { status: 'uploaded', uploadedAt: new Date() },
    });
    return toMediaResponse(updated);
  });

  /** Mark a pending upload as failed (explicit dead-letter, client-side trigger). */
  app.post('/media/:id/cancel', async (req) => {
    const { id } = IdParams.parse(req.params);
    const media = await db.media.findUnique({ where: { id } });
    if (!media) throw notFound('Media not found');

    if (media.status === 'uploaded') throw badRequest('Cannot cancel an uploaded media');
    if (media.status === 'failed') return toMediaResponse(media);

    const updated = await db.media.update({
      where: { id },
      data: { status: 'failed' },
    });
    return toMediaResponse(updated);
  });

  app.get('/media/:id', async (req) => {
    const { id } = IdParams.parse(req.params);
    const media = await db.media.findUnique({ where: { id } });
    if (!media) throw notFound('Media not found');
    return toMediaResponse(media);
  });

  /** List uploaded media for the library browser. Optional ?type=image|video filter. */
  app.get('/media', async (req) => {
    const { type } = ListMediaQuerySchema.parse(req.query);

    const rows = await db.media.findMany({
      where: {
        status: 'uploaded',
        ...(type === 'image' && { contentType: { startsWith: 'image/' } }),
        ...(type === 'video' && { contentType: { startsWith: 'video/' } }),
      },
      orderBy: { uploadedAt: 'desc' },
      take: 100,
    });

    return Promise.all(rows.map(toMediaResponse));
  });
};

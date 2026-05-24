import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  CreateContentSchema,
  DEFAULT_TEXT_STYLE,
  UpdateContentSchema,
} from '@sts/shared';
import { db } from '../db';
import { badRequest, notFound } from '../errors';

const IdParams = z.object({ id: z.string().uuid() });

/** Verify a Media row exists, is uploaded, and matches the expected MIME family. */
async function ensureMediaUsable(mediaId: string, kind: 'image' | 'video') {
  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) throw notFound('Media not found');
  if (media.status !== 'uploaded') throw badRequest('Media is not ready');
  const prefix = kind === 'image' ? 'image/' : 'video/';
  if (!media.contentType.startsWith(prefix)) {
    throw badRequest(`Media is not a ${kind}`);
  }
}

export const contentRoutes: FastifyPluginAsync = async (app) => {
  /** Add a content item to a page. */
  app.post('/pages/:id/content', async (req, reply) => {
    const { id: pageId } = IdParams.parse(req.params);
    const body = CreateContentSchema.parse(req.body);

    const page = await db.page.findUnique({ where: { id: pageId }, select: { id: true } });
    if (!page) throw notFound('Page not found');

    if (body.type === 'image' || body.type === 'video') {
      await ensureMediaUsable(body.mediaId, body.type);
    }

    const created = await db.contentItem.create({
      data: {
        // Client may pre-assign an id (used by undo/redo to keep ids stable
        // across recreate cycles). Otherwise Prisma's @default(uuid()) generates.
        ...(body.id ? { id: body.id } : {}),
        pageId,
        type: body.type,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        zIndex: body.zIndex ?? 0,
        text: body.type === 'text' ? body.text : null,
        style: body.type === 'text' ? (body.style ?? DEFAULT_TEXT_STYLE) : undefined,
        mediaId: body.type === 'text' ? null : body.mediaId,
      },
    });

    reply.status(201);
    return created;
  });

  /**
   * If `style` is provided it must be a complete TextStyle (replace, not merge).
   */
  app.patch('/content/:id', async (req) => {
    const { id } = IdParams.parse(req.params);
    const body = UpdateContentSchema.parse(req.body);

    if (Object.keys(body).length === 0) {
      const current = await db.contentItem.findUnique({ where: { id } });
      if (!current) throw notFound('Content not found');
      return current;
    }

    return db.contentItem.update({
      where: { id },
      data: {
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        zIndex: body.zIndex,
        text: body.text,
        style: body.style,
      },
    });
  });

  app.delete('/content/:id', async (req, reply) => {
    const { id } = IdParams.parse(req.params);
    await db.contentItem.delete({ where: { id } });
    reply.status(204);
    return null;
  });
};

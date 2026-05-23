import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  MAX_PAGES_PER_PRESENTATION,
  ReorderPagesSchema,
  UpdatePageSchema,
} from '@sts/shared';
import { db } from '../db';
import { badRequest, conflict, notFound } from '../errors';

const IdParams = z.object({ id: z.string().uuid() });

export const pageRoutes: FastifyPluginAsync = async (app) => {
  /** Append a new page to a presentation. Enforces the 10-page cap. */
  app.post('/presentations/:id/pages', async (req, reply) => {
    const { id: presentationId } = IdParams.parse(req.params);

    const page = await db.$transaction(async (tx) => {
      const presentation = await tx.presentation.findUnique({
        where: { id: presentationId },
        select: { id: true },
      });
      if (!presentation) throw notFound('Presentation not found');

      const count = await tx.page.count({ where: { presentationId } });
      if (count >= MAX_PAGES_PER_PRESENTATION) {
        throw conflict(`Max ${MAX_PAGES_PER_PRESENTATION} pages per presentation`);
      }

      const { _max } = await tx.page.aggregate({
        where: { presentationId },
        _max: { order: true },
      });
      const newOrder = (_max.order ?? -1) + 1;

      return tx.page.create({ data: { presentationId, order: newOrder } });
    });

    reply.status(201);
    return page;
  });

  /**
   * Re-set page order atomically. Body lists pageIds in the new order;
   * the array must exactly match the existing pages of this presentation.
   */
  app.post('/presentations/:id/pages/reorder', async (req) => {
    const { id: presentationId } = IdParams.parse(req.params);
    const { pageIds } = ReorderPagesSchema.parse(req.body);

    await db.$transaction(async (tx) => {
      const existing = await tx.page.findMany({
        where: { presentationId },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((p) => p.id));
      const sameSet =
        pageIds.length === existingIds.size && pageIds.every((id) => existingIds.has(id));
      if (!sameSet) {
        throw badRequest('pageIds must exactly match existing pages of this presentation');
      }

      // No unique constraint on (presentationId, order), so per-row updates are safe.
      await Promise.all(
        pageIds.map((id, idx) => tx.page.update({ where: { id }, data: { order: idx } })),
      );
    });

    return { ok: true };
  });

  /** Update page-level props (currently just backgroundColor). */
  app.patch('/pages/:id', async (req) => {
    const { id } = IdParams.parse(req.params);
    const body = UpdatePageSchema.parse(req.body);

    if (Object.keys(body).length === 0) {
      const current = await db.page.findUnique({ where: { id } });
      if (!current) throw notFound('Page not found');
      return current;
    }

    return db.page.update({ where: { id }, data: body });
  });

  /** Delete a page; content cascades. Surrounding orders are NOT renumbered. */
  app.delete('/pages/:id', async (req, reply) => {
    const { id } = IdParams.parse(req.params);
    await db.page.delete({ where: { id } });
    reply.status(204);
    return null;
  });
};

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  CreatePresentationSchema,
  UpdatePresentationSchema,
  type PresentationListItem,
} from '@sts/shared';
import { db } from '../db';
import { notFound } from '../errors';

const IdParams = z.object({ id: z.string().uuid() });

export const presentationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/presentations', async (): Promise<PresentationListItem[]> => {
    const rows = await db.presentation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { pages: true } } },
    });
    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      pageCount: p._count.pages,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  });

  app.post('/presentations', async (req, reply) => {
    const body = CreatePresentationSchema.parse(req.body);

    const created = await db.presentation.create({
      data: {
        title: body.title,
        pages: { create: [{ order: 0 }] },
      },
      include: { _count: { select: { pages: true } } },
    });

    reply.status(201);
    return {
      id: created.id,
      title: created.title,
      pageCount: created._count.pages,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  });

  app.get('/presentations/:id', async (req) => {
    const { id } = IdParams.parse(req.params);
    const presentation = await db.presentation.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { order: 'asc' },
          include: {
            content: { orderBy: [{ zIndex: 'asc' }, { createdAt: 'asc' }] },
          },
        },
      },
    });
    if (!presentation) throw notFound('Presentation not found');
    return presentation;
  });

  app.patch('/presentations/:id', async (req) => {
    const { id } = IdParams.parse(req.params);
    const body = UpdatePresentationSchema.parse(req.body);

    if (Object.keys(body).length === 0) {
      const current = await db.presentation.findUnique({ where: { id } });
      if (!current) throw notFound('Presentation not found');
      return current;
    }

    return db.presentation.update({ where: { id }, data: body });
  });

  app.delete('/presentations/:id', async (req, reply) => {
    const { id } = IdParams.parse(req.params);
    await db.presentation.delete({ where: { id } });
    reply.status(204);
    return null;
  });
};

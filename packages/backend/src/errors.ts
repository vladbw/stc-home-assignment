import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = 'Not found') => new HttpError(404, message, 'NOT_FOUND');
export const conflict = (message: string) => new HttpError(409, message, 'CONFLICT');
export const badRequest = (message: string) => new HttpError(400, message, 'BAD_REQUEST');

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) {
      return reply.status(err.statusCode).send({ error: err.message, code: err.code });
    }

    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation failed',
        code: 'VALIDATION',
        details: err.flatten(),
      });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = unique constraint violation
      if (err.code === 'P2002') {
        return reply.status(409).send({
          error: 'Resource already exists',
          code: 'CONFLICT',
          fields: err.meta?.target,
        });
      }
      // P2025 = record not found (update/delete target missing)
      if (err.code === 'P2025') {
        return reply.status(404).send({ error: 'Resource not found', code: 'NOT_FOUND' });
      }
    }

    req.log.error({ err }, 'Unhandled error');
    return reply.status(500).send({ error: 'Internal server error' });
  });
}

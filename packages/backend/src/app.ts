import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { registerErrorHandler } from './errors';
import { presentationRoutes } from './routes/presentations';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  });

  registerErrorHandler(app);

  app.get('/api/health', async () => ({ status: 'running' }));

  await app.register(presentationRoutes, { prefix: '/api' });

  return app;
}

import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
});

app.get('/api/health', async () => ({ status: 'ok' }));

const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

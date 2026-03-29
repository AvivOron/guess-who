import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerSocket } from './ws/handler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = Fastify({ logger: false });

await app.register(fastifyCors, {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
});

await app.register(fastifyWebsocket);

await app.register(fastifyStatic, {
  root: join(__dirname, '..', 'public'),
  prefix: '/',
});

// WebSocket endpoint
app.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const socketId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    registerSocket(socket, socketId);
    socket.send(JSON.stringify({ type: 'CONNECTED', payload: { socketId } }));
  });
});

app.get('/health', async () => ({ status: 'ok' }));

const port = process.env.PORT || 3001;
await app.listen({ port, host: '0.0.0.0' });
console.log(`Server running on http://localhost:${port}`);

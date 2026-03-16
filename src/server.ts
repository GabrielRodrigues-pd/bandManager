import 'dotenv/config';
import fastify from 'fastify';
import { z } from 'zod';
import { userRoutes } from './routes/users.js';
import { bandRoutes } from './routes/bands.js';

import fastifySocketIO from '@wick_studio/fastify-socket.io';

import { socketRoutes } from './socket/sync.js';

import { songRoutes } from './routes/songs.js';
import { authRoutes } from './routes/auth.js';
import { setlistRoutes } from './routes/setlists.js';
import fastifyJwt from '@fastify/jwt';

const app = fastify({
  logger: true,
});

// Register JWT
app.register(fastifyJwt, {
  secret: 'band-manager-secret-key-super-secure', // In prod, use environment variable
});

// Decorator to protect routes
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Register Socket.io
// @ts-ignore
app.register(fastifySocketIO, {
  cors: {
    origin: '*',
  },
});

// Error Handler for Zod
app.setErrorHandler((error, request, reply) => {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: error.format(),
    });
  }

  return reply.send(error);
});

// Health Check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register Routes
app.register(authRoutes);
app.register(userRoutes);
app.register(bandRoutes);
app.register(songRoutes);
app.register(setlistRoutes);
app.register(socketRoutes);

const start = async () => {
  try {
    const port = 3333;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 BandManager API running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

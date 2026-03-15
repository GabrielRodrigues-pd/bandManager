import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export async function setlistRoutes(app: FastifyInstance) {
  // Create Setlist
  app.post('/bands/:bandId/setlists', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({
      bandId: z.string().uuid(),
    });

    const bodySchema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      date: z.string().datetime().optional(),
    });

    const { bandId } = paramsSchema.parse(request.params);
    const { title, description, date } = bodySchema.parse(request.body);

    const setlist = await prisma.setlist.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : null,
        bandId,
      },
    });

    return reply.status(201).send(setlist);
  });

  // List Setlists for a Band
  app.get('/bands/:bandId/setlists', { onRequest: [(app as any).authenticate] }, async (request) => {
    const paramsSchema = z.object({
      bandId: z.string().uuid(),
    });

    const { bandId } = paramsSchema.parse(request.params);

    const setlists = await prisma.setlist.findMany({
      where: { bandId },
      orderBy: { createdAt: 'desc' },
    });

    return { setlists };
  });

  // Get Setlist with ordered songs
  app.get('/setlists/:id', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const setlist = await prisma.setlist.findUnique({
      where: { id },
      include: {
        songs: {
          include: {
            song: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!setlist) {
      return reply.status(404).send({ message: 'Setlist not found.' });
    }

    return { setlist };
  });

  // Add Song to Setlist
  app.post('/setlists/:id/songs', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      songId: z.string().uuid(),
      position: z.number().int(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { songId, position } = bodySchema.parse(request.body);

    const setlistSong = await prisma.setlistSong.create({
      data: {
        setlistId: id,
        songId,
        position,
      },
    });

    return reply.status(201).send(setlistSong);
  });

  // Remove Song from Setlist
  app.delete('/setlists/:id/songs/:songId', { onRequest: [(app as any).authenticate] }, async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
      songId: z.string().uuid(),
    });

    const { id, songId } = paramsSchema.parse(request.params);

    await prisma.setlistSong.deleteMany({
      where: {
        setlistId: id,
        songId,
      },
    });

    return reply.status(204).send();
  });
}

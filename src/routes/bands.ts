import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export async function bandRoutes(app: FastifyInstance) {
  // Create Band
  app.post('/bands', async (request, reply) => {
    const createBandSchema = z.object({
      name: z.string().min(2),
      ownerId: z.string().uuid(),
    });

    const { name, ownerId } = createBandSchema.parse(request.body);

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return reply.status(404).send({ message: 'Owner not found.' });
    }

    // Create band and the first member as Leader
    const band = await prisma.band.create({
      data: {
        name,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'Leader',
          },
        },
      },
      include: {
        members: true,
      },
    });

    return reply.status(201).send(band);
  });

  // List all bands (useful for dev)
  app.get('/bands', async () => {
    const bands = await prisma.band.findMany({
      include: {
        owner: {
          select: { name: true, email: true },
        },
        _count: {
          select: { members: true, songs: true },
        },
      },
    });
    return { bands };
  });
}

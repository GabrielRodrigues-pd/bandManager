import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export async function userRoutes(app: FastifyInstance) {
  // Create User
  app.post('/users', async (request, reply) => {
    const createUserSchema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
    });

    const { name, email } = createUserSchema.parse(request.body);

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return reply.status(400).send({ message: 'User already exists.' });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    return reply.status(201).send(user);
  });

  // List all users (useful for dev)
  app.get('/users', async () => {
    const users = await prisma.user.findMany();
    return { users };
  });
}

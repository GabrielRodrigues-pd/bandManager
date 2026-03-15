import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

export async function authRoutes(app: FastifyInstance) {
  // Register User
  app.post('/register', async (request, reply) => {
    const registerSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    });

    const { name, email, password } = registerSchema.parse(request.body);

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return reply.status(400).send({ message: 'User already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 6);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
      },
    });

    return reply.status(201).send({ userId: user.id });
  });

  // Login (Session)
  app.post('/sessions', async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.status(400).send({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return reply.status(400).send({ message: 'Invalid credentials.' });
    }

    const token = app.jwt.sign(
      { name: user.name },
      {
        sub: user.id,
        expiresIn: '7d',
      }
    );

    return reply.status(200).send({ token });
  });

  // Get Me (Profile)
  app.get('/me', { onRequest: [(app as any).authenticate] }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: (request.user as any).sub },
      select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
      }
    });

    return { user };
  });
}

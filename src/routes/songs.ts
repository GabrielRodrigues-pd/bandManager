import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getInterval, transposeText } from '../utils/transposer.js';
import { ImportService } from '../services/import-service.js';

export async function songRoutes(app: FastifyInstance) {
  // Import Song from URL or Text
  app.post('/songs/import', async (request, reply) => {
    const importSchema = z.object({
      url: z.string().url().optional(),
      rawText: z.string().optional(),
      bandId: z.string().uuid(),
    });

    const { url, rawText, bandId } = importSchema.parse(request.body);

    if (!url && !rawText) {
      return reply.status(400).send({ message: 'Provide either a URL or rawText.' });
    }

    let importedData;

    if (url) {
      importedData = await ImportService.fromUrl(url);
    } else {
      importedData = ImportService.fromRawText(rawText!);
    }

    // Save imported song to database
    const song = await prisma.song.create({
      data: {
        ...importedData,
        bandId,
      },
    });

    return reply.status(201).send(song);
  });

  // Create Song
  app.post('/songs', async (request, reply) => {
    const createSongSchema = z.object({
      title: z.string().min(1),
      artist: z.string().min(1),
      originalKey: z.string(),
      content: z.string(),
      bandId: z.string().uuid(),
    });

    const { title, artist, originalKey, content, bandId } = createSongSchema.parse(request.body);

    const song = await prisma.song.create({
      data: {
        title,
        artist,
        originalKey,
        content,
        bandId,
      },
    });

    return reply.status(201).send(song);
  });

  // Get Song with optional Transposition
  app.get('/songs/:id', async (request, reply) => {
    const getSongParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const getSongQuerySchema = z.object({
      targetKey: z.string().optional(),
    });

    const { id } = getSongParamsSchema.parse(request.params);
    const { targetKey } = getSongQuerySchema.parse(request.query);

    const song = await prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      return reply.status(404).send({ message: 'Song not found.' });
    }

    if (targetKey && targetKey !== song.originalKey) {
      const interval = getInterval(song.originalKey, targetKey);
      const transposedContent = transposeText(song.content, interval);
      
      return {
        ...song,
        currentKey: targetKey,
        content: transposedContent,
        transposed: true
      };
    }

    return { ...song, currentKey: song.originalKey, transposed: false };
  });

  // List songs for a band
  app.get('/bands/:bandId/songs', async (request) => {
    const paramsSchema = z.object({
      bandId: z.string().uuid(),
    });

    const { bandId } = paramsSchema.parse(request.params);

    const songs = await prisma.song.findMany({
      where: { bandId },
    });

    return { songs };
  });
}

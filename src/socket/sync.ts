import { FastifyInstance } from 'fastify';

export async function socketRoutes(app: FastifyInstance) {
  app.ready((err) => {
    if (err) throw err;

    // @ts-ignore
    app.io.on('connection', (socket) => {
      console.log(`🔌 New connection: ${socket.id}`);

      // Musician joins a specific band room
      socket.on('join-band', (bandId: string) => {
        socket.join(bandId);
        console.log(`👤 Socket ${socket.id} joined band room: ${bandId}`);
      });

      // Sync song/key change
      socket.on('sync-song', (data: { bandId: string; songId: string; currentKey: string }) => {
        const { bandId, songId, currentKey } = data;
        
        console.log(`🎵 Syncing song ${songId} in room ${bandId} to key ${currentKey}`);

        // Broadcast to everyone ELSE in the room
        socket.to(bandId).emit('song-updated', {
          songId,
          currentKey,
          updatedBy: socket.id
        });
      });

      socket.on('disconnect', () => {
        console.log(`❌ Connection closed: ${socket.id}`);
      });
    });
  });
}

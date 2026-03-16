import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("123456", 6);

  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email: "gabriel@example.com" },
    update: {
      password_hash: passwordHash,
    },
    create: {
      email: "gabriel@example.com",
      name: "Gabriel Rodrigues",
      password_hash: passwordHash,
    },
  });

  // 2. Create Band
  const band = await prisma.band.upsert({
    where: { inviteCode: "rock-band-123" },
    update: {},
    create: {
      name: "Os Antigravitacionais",
      ownerId: user.id,
      inviteCode: "rock-band-123",
      members: {
        create: {
          userId: user.id,
          role: "Leader",
        },
      },
    },
  });

  // 3. Create Song
  await prisma.song.create({
    data: {
      title: "Bohemian Rhapsody",
      artist: "Queen",
      originalKey: "Bb",
      content: "Is this the real life? Is this just fantasy?",
      bandId: band.id,
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

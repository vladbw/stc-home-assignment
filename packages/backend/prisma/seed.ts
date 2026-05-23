import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // Idempotent: wipe the seeded presentation if it exists, then recreate it.
  await db.presentation.deleteMany({ where: { title: 'Welcome' } });

  await db.presentation.create({
    data: {
      title: 'Welcome',
      pages: {
        create: [
          {
            order: 0,
            content: {
              create: [
                {
                  type: 'text',
                  x: 100,
                  y: 100,
                  width: 600,
                  height: 80,
                  zIndex: 0,
                  text: 'Welcome to STC',
                  style: { bold: true, italic: false, color: '#FF0000' },
                },
              ],
            },
          },
          { order: 1 },
        ],
      },
    },
  });

  console.log('Seed: created "Welcome" presentation with 2 pages.');
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });

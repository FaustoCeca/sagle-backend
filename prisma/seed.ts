import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { sagas } from './seed-data';

const prisma = new PrismaClient();

// El manifest lo genera `build-seed-images.ts` (corre en local, sube las
// imágenes a DO Spaces). Acá solo lo leemos para obtener las URLs del CDN.
// Claves: `saga:<título>` y `game:<título>` (títulos exactos de seed-data).
type ImageManifest = Record<string, string>;

function loadImageManifest(): ImageManifest {
  const manifestPath = path.resolve(process.cwd(), 'prisma', 'seed-images.json');
  if (!fs.existsSync(manifestPath)) {
    console.warn(
      `\n⚠️  No se encontró ${manifestPath}. Se usarán placeholders.\n` +
        `   Corré primero: npx ts-node prisma/build-seed-images.ts\n`,
    );
    return {};
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ImageManifest;
}

const placeholder = (label: string) =>
  `https://placehold.co/600x400?text=${encodeURIComponent(label)}`;

async function main() {
  const images = loadImageManifest();
  const imageFor = (kind: 'saga' | 'game', title: string): string => {
    const url = images[`${kind}:${title}`];
    if (!url || url === 'MISSING' || url === 'REVIEW') {
      console.warn(`  ! sin imagen para ${kind}:${title} — usando placeholder`);
      return placeholder(title);
    }
    return url;
  };

  console.log('Clearing existing data...');
  await prisma.hint.deleteMany();
  await prisma.game.deleteMany();
  // Disconnect M2M by deleting sagas (relations on join tables auto-cleaned)
  await prisma.saga.deleteMany();
  await prisma.category.deleteMany();
  await prisma.perspective.deleteMany();
  await prisma.artStyles.deleteMany();

  console.log(`Seeding ${sagas.length} sagas...`);
  for (let i = 0; i < sagas.length; i++) {
    const s = sagas[i];
    // La primera saga arranca como el Sagle del día; el scheduler rota a diario.
    const isTodaySagle = i === 0;
    await prisma.saga.create({
      data: {
        title: s.title,
        imageUrl: imageFor('saga', s.title),
        link: s.link,
        hasMultiplayer: s.hasMultiplayer,
        isTheSagle: isTodaySagle,
        lastTimeBeingSagle: isTodaySagle ? new Date() : null,
        wasSagleYesterday: false,
        categories: {
          connectOrCreate: s.categories.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
        perspectives: {
          connectOrCreate: s.perspectives.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
        artStyles: {
          connectOrCreate: s.artStyles.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
        games: {
          create: s.games.map((g) => ({
            title: g.title,
            birthYear: g.birthYear,
            imageUrl: imageFor('game', g.title),
            steamLink: g.steamLink ?? null,
            votes: 0,
          })),
        },
        hint: {
          create: [
            { language: 'en', text: s.hints.en },
            { language: 'es', text: s.hints.es },
            { language: 'fr', text: s.hints.fr },
          ],
        },
      },
    });
    console.log(`  - ${s.title}${isTodaySagle ? " (today's sagle)" : ''}`);
  }

  const totals = await Promise.all([
    prisma.saga.count(),
    prisma.game.count(),
    prisma.hint.count(),
    prisma.category.count(),
    prisma.perspective.count(),
    prisma.artStyles.count(),
  ]);
  console.log(
    `\nDone. Sagas=${totals[0]} Games=${totals[1]} Hints=${totals[2]} Categories=${totals[3]} Perspectives=${totals[4]} ArtStyles=${totals[5]}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

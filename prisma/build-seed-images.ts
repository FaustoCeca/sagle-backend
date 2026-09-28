/**
 * build-seed-images.ts — pipeline de imágenes del seed (corre en LOCAL).
 *
 * Para cada saga y cada juego de `seed-data.ts`:
 *   1. Resuelve una imagen real desde una fuente pública:
 *        - Juegos: Steam (por appid del steamLink, o búsqueda por nombre) → capsule del CDN.
 *                  Fallback: Wikipedia.
 *        - Sagas:  Wikipedia (artículo de la franquicia, vía el campo `link`).
 *                  Fallback: Steam por nombre.
 *   2. Descarga y valida la imagen (200 + content-type de imagen + tamaño mínimo).
 *   3. La sube a DigitalOcean Spaces bajo `seed/sagas/<slug>` o `seed/games/<slug>`.
 *   4. Guarda la URL del CDN en `prisma/seed-images.json`.
 *
 * Idempotente: re-ejecutar solo reintenta lo que falta o quedó marcado REVIEW
 * (salvo --force). Uso: `npx ts-node prisma/build-seed-images.ts [--force]`.
 *
 * Requiere las credenciales DO en el entorno (las toma de .env.prod).
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { sagas, type SeedSaga } from './seed-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env.prod') });

const FORCE = process.argv.includes('--force');
const MANIFEST_PATH = path.resolve(process.cwd(), 'prisma', 'seed-images.json');
const UA = 'sagle-seed-image-bot/1.0 (https://thesagle.com; contacto admin)';
const MIN_BYTES = 2500; // descarta imágenes de error diminutas
const CONCURRENCY = 4;

const bucket = process.env.BUCKET_NAME_DIGITAL_OCEAN || '';
const cdn = (process.env.BUCKET_CDN_URL_DIGITAL_OCEAN || '').replace(/\/$/, '');

const s3 = new S3Client({
  forcePathStyle: false,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  endpoint: 'https://nyc3.digitaloceanspaces.com',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_DIGITAL_OCEAN || '',
    secretAccessKey: process.env.SECRET_KEY_DIGITAL_OCEAN || '',
  },
});

type Manifest = Record<string, string>;

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function fetchImage(
  url: string,
): Promise<{ buf: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) return null;
    return { buf, contentType: ct };
  } catch {
    return null;
  }
}

// ── Fuentes ──────────────────────────────────────────────────────────────────

function steamCapsuleUrls(appid: string | number): string[] {
  const base = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}`;
  return [`${base}/library_600x900.jpg`, `${base}/header.jpg`];
}

function appidFromSteamLink(link?: string | null): string | null {
  if (!link) return null;
  const m = link.match(/\/app\/(\d+)/);
  return m ? m[1] : null;
}

// Páginas de Wikipedia explícitas para títulos ambiguos cuya búsqueda devuelve
// el artículo de franquicia en vez del juego concreto.
const WIKI_PAGE_OVERRIDES: Record<string, string> = {
  'game:Metroid': 'Metroid (video game)',
};

const alnum = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// Acepta el resultado de Steam solo si el nombre se parece al buscado, para no
// traer imágenes equivocadas en títulos que NO están en Steam (Nintendo, etc.).
function nameMatches(query: string, result: string): boolean {
  const a = alnum(query);
  const b = alnum(result);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

async function steamSearchAppid(term: string): Promise<string | null> {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
      term,
    )}&cc=us&l=english`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { items?: { id: number; name: string }[] };
    const top = json.items && json.items.length ? json.items[0] : null;
    if (!top) return null;
    return nameMatches(term, top.name) ? String(top.id) : null;
  } catch {
    return null;
  }
}

async function fromSteam(
  term: string,
  appid?: string | null,
): Promise<{ buf: Buffer; contentType: string } | null> {
  const id = appid || (await steamSearchAppid(term));
  if (!id) return null;
  for (const u of steamCapsuleUrls(id)) {
    const img = await fetchImage(u);
    if (img) return img;
  }
  return null;
}

function titleFromWikiLink(link: string): string | null {
  const m = link.match(/\/wiki\/([^?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function wikiSearchTitle(query: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(
      query,
    )}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { pages?: { key: string }[] };
    return json.pages && json.pages.length ? json.pages[0].key : null;
  } catch {
    return null;
  }
}

async function wikiImageUrl(pageTitle: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      pageTitle,
    )}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      originalimage?: { source: string };
      thumbnail?: { source: string };
    };
    return json.originalimage?.source || json.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function fromWikipedia(
  knownPage: string | null,
  searchQuery: string,
): Promise<{ buf: Buffer; contentType: string } | null> {
  const page = knownPage || (await wikiSearchTitle(searchQuery));
  if (!page) return null;
  const imgUrl = await wikiImageUrl(page);
  if (!imgUrl) return null;
  return fetchImage(imgUrl);
}

// ── Subida ───────────────────────────────────────────────────────────────────

async function upload(
  kind: 'sagas' | 'games',
  slug: string,
  img: { buf: Buffer; contentType: string },
): Promise<string> {
  const ext = img.contentType.includes('png') ? 'png' : img.contentType.includes('webp') ? 'webp' : 'jpg';
  const key = `seed/${kind}/${slug}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: img.buf,
      ACL: 'public-read',
      ContentType: img.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${cdn}/${key}`;
}

// ── Orquestación ─────────────────────────────────────────────────────────────

type Job = {
  manifestKey: string; // saga:Title / game:Title
  kind: 'sagas' | 'games';
  title: string;
  resolve: () => Promise<{ buf: Buffer; contentType: string } | null>;
};

function buildJobs(): Job[] {
  const jobs: Job[] = [];
  for (const s of sagas as SeedSaga[]) {
    const wikiPage = titleFromWikiLink(s.link);
    jobs.push({
      manifestKey: `saga:${s.title}`,
      kind: 'sagas',
      title: s.title,
      resolve: async () =>
        (await fromSteam(s.title)) ||
        (await fromWikipedia(wikiPage, `${s.title} (video game)`)),
    });
    for (const g of s.games) {
      const appid = appidFromSteamLink(g.steamLink);
      jobs.push({
        manifestKey: `game:${g.title}`,
        kind: 'games',
        title: g.title,
        resolve: async () => {
          const overridePage = WIKI_PAGE_OVERRIDES[`game:${g.title}`];
          if (overridePage) {
            const img = await fromWikipedia(overridePage, g.title);
            if (img) return img;
          }
          return (await fromSteam(g.title, appid)) || (await fromWikipedia(null, g.title));
        },
      });
    }
  }
  return jobs;
}

async function runJob(job: Job, manifest: Manifest): Promise<'ok' | 'review'> {
  try {
    const img = await job.resolve();
    if (!img) {
      manifest[job.manifestKey] = 'REVIEW';
      console.log(`  ⚠️  REVIEW  ${job.manifestKey} (sin imagen encontrada)`);
      return 'review';
    }
    const url = await upload(job.kind, slugify(job.title), img);
    manifest[job.manifestKey] = url;
    console.log(`  ✅ ${job.manifestKey} → ${url}`);
    return 'ok';
  } catch (e) {
    manifest[job.manifestKey] = 'REVIEW';
    console.log(`  ⚠️  REVIEW  ${job.manifestKey} (error: ${(e as Error).message})`);
    return 'review';
  }
}

async function main() {
  if (!bucket || !cdn || !process.env.SECRET_KEY_DIGITAL_OCEAN) {
    throw new Error(
      'Faltan credenciales/bucket DO en el entorno. Verificá .env.prod (BUCKET_NAME_DIGITAL_OCEAN, BUCKET_CDN_URL_DIGITAL_OCEAN, ACCESS/SECRET keys).',
    );
  }

  const manifest: Manifest =
    fs.existsSync(MANIFEST_PATH) && !FORCE
      ? (JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest)
      : {};

  const allJobs = buildJobs();
  const todo = allJobs.filter((j) => {
    const cur = manifest[j.manifestKey];
    return FORCE || !cur || cur === 'REVIEW' || cur === 'MISSING';
  });

  console.log(
    `Total: ${allJobs.length} imágenes. A procesar ahora: ${todo.length} (force=${FORCE}).\n`,
  );

  let ok = 0;
  let review = 0;
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((j) => runJob(j, manifest)));
    ok += results.filter((r) => r === 'ok').length;
    review += results.filter((r) => r === 'review').length;
    // persistimos parcial por si se corta
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  }

  // Post-pase: si una saga quedó sin imagen (típico de exclusivos de Nintendo/Sony,
  // cuyos artículos de franquicia no exponen logo), reusamos la carátula del juego
  // más nuevo de esa saga que sí haya resuelto.
  const isValid = (v?: string) => !!v && v !== 'REVIEW' && v !== 'MISSING';
  for (const s of sagas) {
    if (isValid(manifest[`saga:${s.title}`])) continue;
    const newestFirst = [...s.games].sort((a, b) => b.birthYear - a.birthYear);
    const donor = newestFirst.find((g) => isValid(manifest[`game:${g.title}`]));
    if (donor) {
      manifest[`saga:${s.title}`] = manifest[`game:${donor.title}`];
      console.log(`  ↪︎ saga:${s.title} usa la imagen de game:${donor.title}`);
    }
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  const reviews = Object.entries(manifest)
    .filter(([, v]) => v === 'REVIEW' || v === 'MISSING')
    .map(([k]) => k);

  console.log(`\n──────────────────────────────────────────────`);
  console.log(`OK en esta corrida: ${ok} · REVIEW: ${review}`);
  console.log(`Manifest: ${MANIFEST_PATH} (${Object.keys(manifest).length} entradas)`);
  if (reviews.length) {
    console.log(`\nPendientes de revisión/curado (${reviews.length}):`);
    reviews.forEach((k) => console.log(`  - ${k}`));
  } else {
    console.log(`\n🎉 Todas las imágenes resueltas.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

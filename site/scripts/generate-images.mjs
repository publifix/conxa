import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets-src");
const OUT = path.join(ROOT, "public", "img");

const LARGE = [640, 960, 1280, 1600, 1920, 2400];
const MEDIUM = [480, 768, 1080, 1440];
const SMALL = [400, 600, 900, 1200];

/** [sourceFile, outputSlug, widths, quality] */
const JOBS = [
  ["hero-conchas-patron.jpg", "hero", LARGE, 78],
  ["about-panadero-hogazas.jpg", "about", MEDIUM, 76],
  ["ubicacion-fachada-dia.jpg", "ubicacion", MEDIUM, 76],
  ["cta-fachada-neon.jpg", "cta", MEDIUM, 76],
  ["galeria-01-mostrador.jpg", "galeria-01-mostrador", SMALL, 74],
  ["galeria-02-anaquel.jpg", "galeria-02-anaquel", SMALL, 74],
  ["galeria-03-rosca-caja.jpg", "galeria-03-rosca", SMALL, 74],
  ["galeria-04-focaccia.webp", "galeria-04-focaccia", SMALL, 74],
  ["galeria-05-avellanas.jpg", "galeria-05-avellanas", SMALL, 74],
  ["galeria-06-espresso.jpg", "galeria-06-espresso", SMALL, 74],
  ["galeria-07-matcha.jpg", "galeria-07-matcha", SMALL, 74],
  ["galeria-08-vitrina-plantas.jpg", "galeria-08-vitrina", SMALL, 74],
  ["galeria-09-masa-madre.webp", "galeria-09-masa-madre", SMALL, 74],
];

async function buildResponsiveSet() {
  await mkdir(OUT, { recursive: true });
  for (const [file, slug, widths, quality] of JOBS) {
    const input = path.join(SRC, file);
    for (const width of widths) {
      const outFile = path.join(OUT, `${slug}-${width}.webp`);
      await sharp(input)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(outFile);
    }
    console.log(`✓ ${file} -> ${widths.length} responsive sizes`);
  }
}

async function buildOgImage() {
  const input = path.join(SRC, "hero-conchas-patron.jpg");
  const outFile = path.join(OUT, "og-image.jpg");
  await sharp(input)
    .resize({ width: 1200, height: 630, fit: "cover", position: "centre" })
    .flatten({ background: "#171512" })
    .jpeg({ quality: 82 })
    .toFile(outFile);
  console.log("✓ og-image.jpg");
}

async function buildLogo() {
  const input = path.join(SRC, "logo-conxa.png");
  await sharp(input)
    .resize({ width: 800, withoutEnlargement: true })
    .png({ quality: 90 })
    .toFile(path.join(OUT, "logo-conxa.png"));
  console.log("✓ logo-conxa.png");
}

async function buildFavicons() {
  const logo = path.join(SRC, "logo-conxa.png");
  const sizes = [
    ["favicon-16.png", 16],
    ["favicon-32.png", 32],
    ["favicon-48.png", 48],
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ];
  for (const [name, size] of sizes) {
    const markWidth = Math.round(size * 0.72);
    const mark = await sharp(logo)
      .resize({ width: markWidth, withoutEnlargement: true })
      .toBuffer();
    const markMeta = await sharp(mark).metadata();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: "#171512",
      },
    })
      .composite([
        {
          input: mark,
          top: Math.round((size - (markMeta.height ?? size)) / 2),
          left: Math.round((size - markWidth) / 2),
        },
      ])
      .png()
      .toFile(path.join(OUT, name));
  }
  console.log("✓ favicons + app icons");
}

await buildResponsiveSet();
await buildOgImage();
await buildLogo();
await buildFavicons();
console.log("Image pipeline complete.");

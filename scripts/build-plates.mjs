/**
 * Cinematic plate pipeline.
 *
 * Takes the supplied environment renders and produces the responsive AVIF/WebP
 * set the site ships, plus a tiny inline placeholder for each so a plate never
 * pops in against black.
 *
 * Source images live outside the repo (they are art direction, not code).
 * Point PLATE_SOURCE at the extracted pack and run:
 *
 *   node scripts/build-plates.mjs /path/to/03_New_Cinematic_Worlds
 *
 * Output: public/cinematic/<id>-<width>.avif|webp and src/content/plate-lqip.json
 */

import sharp from "sharp";
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const SOURCE = resolve(
  process.argv[2] ??
    process.env.PLATE_SOURCE ??
    "../velabuilt-pack/03_New_Cinematic_Worlds",
);
const OUT = resolve("public/cinematic");
const LQIP_OUT = resolve("src/content/plate-lqip.json");

/** Source filename → plate id used throughout the site. */
const PLATES = {
  "01_operator_atrium": "atrium",
  "02_website_chamber": "website-chamber",
  "03_enquiry_chamber": "enquiry-chamber",
  "04_system_lab": "system-lab",
  "05_destination_gateway": "gateway",
};

/**
 * Widths shipped. The sources are 1672px wide, so nothing above that is
 * generated — upscaling costs bytes and buys no detail.
 */
const WIDTHS = [640, 960, 1280, 1672];

await mkdir(OUT, { recursive: true });

const files = await readdir(SOURCE);
const lqip = {};

for (const [stem, id] of Object.entries(PLATES)) {
  const file = files.find((name) => name.startsWith(stem));
  if (!file) {
    console.warn(`  ! no source for ${id} (looked for ${stem}*)`);
    continue;
  }

  const source = join(SOURCE, file);
  const { width: nativeWidth, height: nativeHeight } =
    await sharp(source).metadata();

  for (const width of WIDTHS) {
    if (width > nativeWidth) continue;
    const resized = sharp(source).resize({ width, withoutEnlargement: true });

    await resized
      .clone()
      // Quality 52 on near-black architecture is visually lossless and roughly
      // a third of the WebP size; the banding these scenes would show at lower
      // settings is exactly what dark gradients cannot afford.
      .avif({ quality: 52, effort: 6, chromaSubsampling: "4:4:4" })
      .toFile(join(OUT, `${id}-${width}.avif`));

    await resized
      .clone()
      .webp({ quality: 76, effort: 5 })
      .toFile(join(OUT, `${id}-${width}.webp`));
  }

  // A 20px blurred base64 stand-in, inlined so the first frame is already the
  // right colours rather than a black hole.
  const placeholder = await sharp(source)
    .resize({ width: 20 })
    .blur(1.2)
    .webp({ quality: 40 })
    .toBuffer();

  lqip[id] = {
    src: `data:image/webp;base64,${placeholder.toString("base64")}`,
    aspect: Number((nativeWidth / nativeHeight).toFixed(4)),
  };

  console.log(`  ${id}: ${nativeWidth}x${nativeHeight} → ${WIDTHS.filter((w) => w <= nativeWidth).join(", ")}`);
}

await writeFile(LQIP_OUT, `${JSON.stringify(lqip, null, 2)}\n`);
console.log(`\nWrote ${Object.keys(lqip).length} plates to public/cinematic/`);

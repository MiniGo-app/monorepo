// Renders the app's icon, splash and favicon PNGs from the MiniGo mark, so they can be regenerated after any
// change to it. Needs playwright-core and a Chromium (set CHROMIUM_PATH):
//   CHROMIUM_PATH=/path/to/chromium node assets/brand/render.mjs   (from the minigo/ folder; run `npm i --no-save playwright-core`)
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, "..");

// The mark, in the 1582-unit space of the original artwork (fitted to it; see README.md).
const MARK = (fill) =>
  `<circle cx="742.16" cy="723.5" r="257" fill="none" stroke="${fill}" stroke-width="57"/>` +
  `<circle cx="982.18" cy="360.95" r="76.96" fill="${fill}"/>` +
  `<path d="M1029.75 982.94A169.44 169.44 0 0 1 711.78 1100.15" fill="none" stroke="${fill}" stroke-width="59.56"/>`;
const BOUNDS = { x: 456.66, y: 283.99, w: 613.31, h: 956.73 }; // tight box around the mark

const BLACK = "#000000";
const WHITE = "#FFFFFF";

// One PNG: a square canvas of `size` px, an optional background, and the mark `markHeight` px tall, centred.
// `original: true` keeps the artwork's own composition instead of centring the tight box.
const jobs = [
  { file: "icon.png", size: 1024, bg: BLACK, fill: WHITE, original: true },
  { file: "android-icon-foreground.png", size: 1024, bg: null, fill: WHITE, markHeight: 480 }, // inside the 66% safe zone
  { file: "android-icon-monochrome.png", size: 1024, bg: null, fill: BLACK, markHeight: 480 },
  { file: "splash-icon.png", size: 1024, bg: null, fill: BLACK, markHeight: 614 }, // on a white splash
  { file: "splash-icon-dark.png", size: 1024, bg: null, fill: WHITE, markHeight: 614 }, // on a black splash
  { file: "favicon.png", size: 96, bg: BLACK, fill: WHITE, markHeight: 58, radius: 22 },
];

const page = await (await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })).newPage();
for (const job of jobs) {
  const { size, bg, fill, markHeight, radius = 0, original } = job;
  const view = original ? `0 0 1582 1582` : `${BOUNDS.x} ${BOUNDS.y} ${BOUNDS.w} ${BOUNDS.h}`;
  const height = original ? size : markHeight;
  const width = original ? size : (markHeight * BOUNDS.w) / BOUNDS.h;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}
      #c{width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg ?? "transparent"};border-radius:${radius}px}</style>
     <div id="c"><svg width="${width}" height="${height}" viewBox="${view}">${MARK(fill)}</svg></div>`,
  );
  mkdirSync(assets, { recursive: true });
  await page.locator("#c").screenshot({ path: join(assets, job.file), omitBackground: bg === null || radius > 0 });
  console.log("wrote", job.file);
}
await page.context().browser().close();

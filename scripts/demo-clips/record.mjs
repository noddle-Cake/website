// Records each live demo as a series of short chapters, on a desktop browser and (where the demo has a
// phone layout) an iPhone, for the demo player in components/ProjectShot.astro.
//
//   npm run record-demos                      # every demo, every chapter
//   npm run record-demos -- vas               # one demo (vas, oncora, gridmerge, grantit, fudi)
//   npm run record-demos -- vas:pricing       # one chapter of one demo
//
// The chapters live in scripts/demo-clips/demos/<name>.mjs. Each one opens its own page, waits for it
// to be ready, then plays a short scripted visit. A headless Chrome drives the real public site with a
// drawn cursor (desktop) or touch ripples (phone) so the interactions read on video. Frames come from
// the DevTools screencast at 1.5x (desktop) and 2x (phone) pixel density: enough that the outputs are
// scaled down, never up, while frames stay small enough to capture at 20+ fps.
//
// Output, under public/demos/<name>/:
//   <chapter>-1920.{mp4,webm}, <chapter>-1280.{mp4,webm}   desktop, for high-DPI and other screens
//   <chapter>-m.{mp4,webm}                                 phone
//   <chapter>.webp, <chapter>-m.webp                       each chapter's first frame
//   still.webp, still-m.webp                               what shows before (or instead of) playback
// and the demo's entry in src/data/demoClips.json (chapters, durations, where playback starts, and a
// tiny blurred preview of each still).
//
// Needs Google Chrome and ffmpeg (with libx264, libvpx-vp9 and libwebp) on the PATH.

import { chromium, devices } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import vas from './demos/vas.mjs';
import oncora from './demos/oncora.mjs';
import gridmerge from './demos/gridmerge.mjs';
import grantit from './demos/grantit.mjs';
import fudi from './demos/fudi.mjs';

const DEMOS = { vas, oncora, gridmerge, grantit, fudi };
const failures = [];

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'public/demos');
const MANIFEST = join(ROOT, 'src/data/demoClips.json');
const FPS = 30;

/** How each device is emulated and encoded. */
const DEVICES = {
  desktop: {
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 }, // 16:10, the window frame
    outputs: [
      { suffix: '-1920', width: 1920, crf264: 24, crfVp9: 35 },
      { suffix: '-1280', width: 1280, crf264: 25, crfVp9: 37 },
    ],
    stillWidth: 1920,
  },
  mobile: {
    // An iPhone 15's screen below the status bar, which the player draws itself.
    context: { ...devices['iPhone 15'], viewport: { width: 393, height: 798 }, screen: { width: 393, height: 852 }, deviceScaleFactor: 2 },
    outputs: [{ suffix: '-m', width: 590, crf264: 25, crfVp9: 36 }],
    stillWidth: 590,
  },
};

/**
 * A phone app with no web version can still be recorded from a page that shows it in a phone (the
 * app's own site, say): with `phone: 'crop'` the demo's phone chapters run on a short page at 2.1x
 * (short, so frames stay small and quick to capture; wide enough that sites lay the phone out beside
 * their hero rather than under it) and each chapter's `crop(page)` gives the box of the screen to keep.
 */
const CROP_CONTEXT = { viewport: { width: 1024, height: 660 }, deviceScaleFactor: 2.1 };
const contextFor = (demo, device) => (device === 'mobile' && demo.phone === 'crop' ? CROP_CONTEXT : DEVICES[device].context);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// ---- Pointer overlays --------------------------------------------------------------------------
// Headless Chrome draws no pointer. On desktop the page gets an arrow that follows mousemove and a
// ring that pulses on mousedown; on the phone, a fingertip ripple wherever a tap lands
// (window.__demoTouch). Neither takes pointer events, so they never get in the way.
const OVERLAY_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__demo-ring')) return;
    const ring = document.createElement('div');
    ring.id = '__demo-ring';
    Object.assign(ring.style, { position: 'fixed', left: '0', top: '0', width: '34px', height: '34px', margin: '-17px 0 0 -17px',
      borderRadius: '50%', background: 'rgb(0 113 227 / .28)', zIndex: 2147483646, pointerEvents: 'none', opacity: '0' });
    document.documentElement.append(ring);
    const pulse = (x, y, size) => ring.animate([
      { opacity: 1, transform: 'translate(' + x + 'px,' + y + 'px) scale(.4)', width: size, height: size },
      { opacity: 0, transform: 'translate(' + x + 'px,' + y + 'px) scale(1.5)', width: size, height: size },
    ], { duration: 500, easing: 'ease-out' });
    window.__demoTouch = (x, y) => {
      ring.style.background = 'rgb(120 120 128 / .45)';
      ring.style.margin = '-22px 0 0 -22px';
      pulse(x, y, '44px');
    };
    if (matchMedia('(pointer: coarse)').matches) return;
    const c = document.createElement('div');
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.6 L14.6 20.3 L11.6 13.6 L17.8 13.6 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none',
      transform: 'translate(-100px,-100px)', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / .35))' });
    document.documentElement.append(c);
    let x = -100, y = -100;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; c.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 2) + 'px)'; }, true);
    addEventListener('mousedown', () => pulse(x, y, '34px'), true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', install); else install();
})();
`;

/**
 * The helpers chapters are written in, paced like a person. The same calls work on both devices: on
 * the phone `click` is a tap, `hover` just pauses, and `scroll` is a finger swipe.
 */
function director(page, cdp, device) {
  const mobile = device === 'mobile';
  const { width, height } = DEVICES[device].context.viewport;
  let pos = { x: width * 0.62, y: height * 0.55 };

  async function moveTo(x, y, ms = 650) {
    if (mobile) return void (pos = { x, y });
    const from = { ...pos };
    const steps = Math.max(8, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) {
      const t = ease(i / steps);
      await page.mouse.move(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
      await sleep(ms / steps);
    }
    pos = { x, y };
  }

  async function point(target) {
    if (typeof target.x === 'number') return target;
    await target.waitFor({ state: 'visible', timeout: 30000 });
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    return { x: box.x + Math.min(box.width / 2, mobile ? box.width / 2 : 120), y: box.y + box.height / 2 };
  }

  async function press(x, y) {
    if (mobile) {
      await page.evaluate(([x, y]) => window.__demoTouch?.(x, y), [x, y]);
      await sleep(120);
      await page.touchscreen.tap(x, y);
      return;
    }
    await page.mouse.down();
    await sleep(90);
    await page.mouse.up();
  }

  return {
    page,
    mobile,
    hold: (ms) => sleep(ms),
    /** Puts the cursor on screen where the clip starts. */
    async park() {
      if (!mobile) await page.mouse.move(pos.x, pos.y);
    },
    moveTo,
    /** Points at a locator or {x, y}; on the phone this is just a pause. */
    async hover(target, ms = 700) {
      if (mobile) return sleep(Math.min(ms, 400));
      const c = await point(target);
      await moveTo(c.x, c.y, ms);
    },
    /** Clicks (desktop) or taps (phone) a locator or {x, y}. */
    async click(target, ms = 700) {
      const c = await point(target);
      await moveTo(c.x, c.y, ms);
      await sleep(mobile ? 250 : 180);
      await press(c.x, c.y);
    },
    async type(text, delay = 85) {
      await page.keyboard.type(text, { delay });
    },
    /** Scrolls by `dy` pixels: the mouse wheel on desktop, a swipe on the phone. */
    async scroll(dy, ms = 1200, at) {
      const x = at?.x ?? (mobile ? width / 2 : pos.x);
      const y = at?.y ?? (mobile ? height * 0.6 : pos.y);
      // Headless Chrome ignores synthetic touch swipes, so the phone scrolls by wheel too, with a
      // fingertip ripple where the swipe would start.
      if (mobile) {
        await page.mouse.move(x, y);
        await page.evaluate(([x, y]) => window.__demoTouch?.(x, y), [x, y]);
        await sleep(150);
      }
      const steps = Math.round(ms / 16);
      let done = 0;
      for (let i = 1; i <= steps; i++) {
        const next = Math.round(dy * ease(i / steps));
        await page.mouse.wheel(0, next - done);
        done = next;
        await sleep(ms / steps);
      }
    },
  };
}

// ---- Recording ---------------------------------------------------------------------------------

/** Records one chapter on one device; returns the capture's working directory and frame list. */
async function capture(demo, chapter, device, context) {
  const work = mkdtempSync(join(tmpdir(), `demo-${demo.name}-${chapter.id}-${device}-`));
  const page = await context.newPage();
  await page.goto(new URL(chapter.path ?? '/', demo.url).href, { waitUntil: 'load', timeout: 60000 });
  const cdp = await context.newCDPSession(page);
  const d = director(page, cdp, device);
  await chapter.ready(page, d);
  await sleep(chapter.settle ?? 1200);
  const { viewport, deviceScaleFactor } = contextFor(demo, device);
  const box = chapter.crop ? await chapter.crop(page) : null;
  const crop = box && {
    x: Math.round(box.x * deviceScaleFactor), y: Math.round(box.y * deviceScaleFactor),
    width: Math.round(box.width * deviceScaleFactor), height: Math.round(box.height * deviceScaleFactor),
  };

  const frames = [];
  let recording = false;
  let started = 0;
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    if (!recording) return;
    const file = join(work, `f${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    // A still page's first frame can carry the time it was last painted, long before recording began.
    frames.push({ file, t: Math.max(metadata.timestamp, started) });
  });
  await cdp.send('Page.startScreencast', {
    format: 'jpeg', quality: 95, maxWidth: Math.round(viewport.width * deviceScaleFactor), maxHeight: Math.round(viewport.height * deviceScaleFactor),
  });
  await sleep(200);
  started = Date.now() / 1000;
  recording = true;
  // The screencast only sends a frame when something changes; nudge one out for the first frame.
  await page.evaluate(() => document.documentElement.animate([{ opacity: 1 }, { opacity: 0.999 }], 50));
  await d.park();
  await chapter[device](d);
  const end = Date.now() / 1000;
  await sleep(300);
  recording = false;
  await cdp.send('Page.stopScreencast');
  await page.close();
  if (frames.length < 2) throw new Error(`${demo.name}:${chapter.id} (${device}): only ${frames.length} frames captured`);
  return { work, frames, end, crop };
}

/** Turns a capture into the chapter's videos and first-frame still; returns its duration. */
function encode(demo, chapter, device, { work, frames, end, crop }) {
  // Each frame lasts until the next one arrives; the last one until the chapter finished.
  const lines = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(end, f.t + 0.05);
    lines.push(`file '${f.file}'`, `duration ${(next - f.t).toFixed(4)}`);
  });
  lines.push(`file '${frames.at(-1).file}'`);
  const list = join(work, 'frames.txt');
  writeFileSync(list, lines.join('\n'));
  const master = join(work, 'master.mp4');
  const cropFilter = crop ? `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},` : '';
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `fps=${FPS},${cropFilter}scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`,
    '-c:v', 'libx264', '-crf', '10', '-preset', 'fast', master]);

  const dir = join(OUT, demo.name);
  mkdirSync(dir, { recursive: true });
  const spec = DEVICES[device];
  for (const out of spec.outputs) {
    const scale = `scale=${out.width}:-2:flags=lanczos,format=yuv420p`;
    const stem = join(dir, `${chapter.id}${out.suffix}`);
    // Index (MP4) and cues (WebM) up front, so both start playing while they download.
    ffmpeg(['-i', master, '-vf', scale, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(out.crf264),
      '-profile:v', 'high', '-movflags', '+faststart', `${stem}.mp4`]);
    ffmpeg(['-i', master, '-vf', scale, '-an', '-c:v', 'libvpx-vp9', '-crf', String(out.crfVp9), '-b:v', '0',
      '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-cues_to_front', '1', `${stem}.webm`]);
  }
  const suffix = device === 'mobile' ? '-m' : '';
  still(master, 0, spec.stillWidth, join(dir, `${chapter.id}${suffix}.webp`));
  // Keep the master until the demo's still is taken from it.
  return { duration: Number(probeDuration(master).toFixed(2)), master };
}

function still(video, time, width, file) {
  ffmpeg(['-ss', String(time), '-i', video, '-frames:v', '1', '-vf', `scale=${width}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', '80', file]);
}

/** A 24px-wide copy of a still as a data URI: the blurred placeholder until the still arrives. */
function lqip(video, time, work) {
  const tiny = join(work, 'tiny.webp');
  ffmpeg(['-ss', String(time), '-i', video, '-frames:v', '1', '-vf', 'scale=24:-2:flags=area', '-c:v', 'libwebp', '-quality', '60', tiny]);
  return `data:image/webp;base64,${readFileSync(tiny).toString('base64')}`;
}

function probeDuration(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
}

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
}

async function recordDemo(demo, only, browserFor) {
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  const previous = manifest[demo.name];
  const chapters = demo.chapters.filter((c) => !only || c.id === only);
  if (!chapters.length) throw new Error(`${demo.name} has no chapter "${only}". Known: ${demo.chapters.map((c) => c.id).join(', ')}`);

  const results = {}; // chapter id -> { desktop?: {duration, master, work}, mobile?: ... }
  for (const device of Object.keys(DEVICES)) {
    const todo = chapters.filter((c) => c[device]);
    if (!todo.length) continue;
    const spec = contextFor(demo, device);
    const context = await (await browserFor(spec.deviceScaleFactor)).newContext(spec);
    await context.addInitScript(OVERLAY_SCRIPT);
    for (const chapter of todo) {
      // One chapter failing (say, a selector the demo's new UI no longer matches) keeps its previous
      // recording and doesn't stop the rest.
      try {
        const shot = await capture(demo, chapter, device, context);
        const { duration, master } = encode(demo, chapter, device, shot);
        (results[chapter.id] ??= {})[device] = { duration, master, work: shot.work };
        console.log(`  ${demo.name}:${chapter.id} ${device} ${duration.toFixed(1)}s (${shot.frames.length} frames)`);
      } catch (error) {
        failures.push(`${demo.name}:${chapter.id} (${device}): ${String(error.message).split('\n')[0]}`);
        console.log(`  ${demo.name}:${chapter.id} ${device} FAILED, keeping the previous recording`);
        for (const page of context.pages()) await page.close().catch(() => {});
      }
    }
    await context.close();
  }

  // The still: the poster chapter at `demo.poster.at` (a fraction of it) on desktop, and that
  // chapter's first frame on the phone, which is where each starts playing.
  // A chapter not recorded this run keeps its duration from the manifest, or failing that from its
  // video on disk.
  const onDisk = (file) => (existsSync(file) ? Number(probeDuration(file).toFixed(2)) : 0);
  const entry = {
    chapters: demo.chapters.map((c) => {
      const old = previous?.chapters.find((o) => o.id === c.id);
      const r = results[c.id];
      const dir = join(OUT, demo.name);
      return {
        id: c.id,
        label: c.label,
        duration: c.desktop ? (r?.desktop?.duration ?? (old?.duration || onDisk(join(dir, `${c.id}-1280.mp4`)))) : 0,
        mobileDuration: c.mobile ? (r?.mobile?.duration ?? (old?.mobileDuration || onDisk(join(dir, `${c.id}-m.mp4`)))) : null,
      };
    }),
    start: previous?.start ?? null,
    lqip: previous?.lqip ?? null,
    lqipMobile: previous?.lqipMobile ?? null,
    statusBg: previous?.statusBg ?? null,
    // false when the recorded screens already include a status bar, so the player doesn't draw one.
    statusBar: demo.statusBar !== false,
    phoneAspect: previous?.phoneAspect ?? '393 / 798',
    version: Date.now().toString(36),
  };
  const posterIndex = demo.chapters.findIndex((c) => c.id === demo.poster.chapter);
  const poster = results[demo.poster.chapter];
  const dir = join(OUT, demo.name);
  if (!demo.chapters.some((c) => c.desktop)) {
    entry.lqip = null;
    entry.start = { chapter: posterIndex, time: 0 };
  }
  if (poster?.desktop) {
    const time = Number((poster.desktop.duration * demo.poster.at).toFixed(2));
    still(poster.desktop.master, time, DEVICES.desktop.stillWidth, join(dir, 'still.webp'));
    entry.lqip = lqip(poster.desktop.master, time, poster.desktop.work);
    entry.start = { chapter: posterIndex, time };
  }
  if (poster?.mobile) {
    still(poster.mobile.master, 0, DEVICES.mobile.stillWidth, join(dir, 'still-m.webp'));
    entry.lqipMobile = lqip(poster.mobile.master, 0, poster.mobile.work);
    // The app's colour along its top edge, for the status bar the player draws above it.
    const rgb = execFileSync('ffmpeg', ['-v', 'error', '-i', poster.mobile.master, '-frames:v', '1', '-vf', 'crop=2:2:30:4,scale=1:1:flags=neighbor',
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
    entry.statusBg = `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
    const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
      '-of', 'csv=p=0', poster.mobile.master]).toString().trim().split(',');
    entry.phoneAspect = `${w} / ${h}`;
  }
  if (!demo.chapters.some((c) => c.mobile)) entry.lqipMobile = null;

  for (const r of Object.values(results)) for (const d of Object.values(r)) rmSync(d.work, { recursive: true, force: true });
  // Re-read just before writing, so demos recorded in parallel don't drop each other's entries.
  const latest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  latest[demo.name] = entry;
  writeFileSync(MANIFEST, JSON.stringify(latest, null, 2) + '\n');
  const total = entry.chapters.reduce((s, c) => s + (c.duration || c.mobileDuration || 0), 0);
  console.log(`${demo.name}: ${entry.chapters.length} chapters, ${total.toFixed(1)}s -> public/demos/${demo.name}/`);
}

// ---- Main --------------------------------------------------------------------------------------

const wanted = process.argv.slice(2).map((arg) => arg.split(':'));
const jobs = wanted.length ? wanted : Object.keys(DEMOS).map((n) => [n]);
for (const [name] of jobs) if (!DEMOS[name]) throw new Error(`Unknown demo "${name}". Known: ${Object.keys(DEMOS).join(', ')}`);

// The screencast sends frames at the window's CSS size whatever the context's deviceScaleFactor,
// so each pixel density gets its own browser launched at that scale.
const browsers = new Map();
const browserFor = async (scale) => {
  if (!browsers.has(scale)) {
    browsers.set(scale, await chromium.launch({ channel: 'chrome', args: [`--force-device-scale-factor=${scale}`] }));
  }
  return browsers.get(scale);
};
try {
  for (const [name, chapter] of jobs) await recordDemo({ name, ...DEMOS[name] }, chapter, browserFor);
} finally {
  for (const browser of browsers.values()) await browser.close();
}
if (failures.length) {
  console.error(`\n${failures.length} chapter(s) failed:\n  ${failures.join('\n  ')}`);
  process.exitCode = 1;
}

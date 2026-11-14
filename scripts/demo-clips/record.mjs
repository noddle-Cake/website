// Records a short looping clip of each live demo and writes it to public/demos/<name>.{mp4,webm,webp}.
//
//   npm run record-demos              # all of them
//   npm run record-demos -- vas       # just one (oncora, gridmerge, vas, grantit)
//
// A headless Chrome drives the real public site the way a visitor would, with a drawn cursor so the
// clicks read on video. Frames come from the DevTools screencast (sharper than Playwright's own video
// recorder); ffmpeg turns them into a constant-frame-rate clip whose end cross-fades into its start,
// so it loops without a visible jump.
//
// Needs Google Chrome and ffmpeg (with libx264 and libvpx-vp9) on the PATH.

import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'public/demos');
const VIEWPORT = { width: 1440, height: 900 }; // 16:10, the shape of the tiles' window frame
const OUTPUT_WIDTH = 1280;
const FPS = 30;
const LOOP_FADE = 0.6; // seconds of cross-fade from the end back into the start

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- The cursor --------------------------------------------------------------------------------
// Headless Chrome draws no pointer, so the page gets one: an arrow that follows mousemove and a ring
// that pulses on mousedown. It ignores pointer events, so it never gets in the way of a click.
const CURSOR_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__demo-cursor')) return;
    const c = document.createElement('div');
    c.id = '__demo-cursor';
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.6 L14.6 20.3 L11.6 13.6 L17.8 13.6 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none',
      transform: 'translate(-100px,-100px)', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / .35))' });
    const ring = document.createElement('div');
    Object.assign(ring.style, { position: 'fixed', left: '0', top: '0', width: '34px', height: '34px', margin: '-17px 0 0 -17px',
      borderRadius: '50%', background: 'rgb(0 113 227 / .28)', zIndex: 2147483646, pointerEvents: 'none', opacity: '0',
      transform: 'translate(-100px,-100px) scale(.4)' });
    document.documentElement.append(ring, c);
    let x = -100, y = -100;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; c.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 2) + 'px)'; }, true);
    addEventListener('mousedown', () => {
      ring.animate([
        { opacity: 1, transform: 'translate(' + x + 'px,' + y + 'px) scale(.4)' },
        { opacity: 0, transform: 'translate(' + x + 'px,' + y + 'px) scale(1.5)' },
      ], { duration: 450, easing: 'ease-out' });
    }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', install); else install();
})();
`;

/** Wraps a page with human-paced helpers the flows are written in. */
function director(page) {
  let pos = { x: VIEWPORT.width * 0.62, y: VIEWPORT.height * 0.55 };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  async function moveTo(x, y, ms = 650) {
    const from = { ...pos };
    const steps = Math.max(8, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) {
      const t = ease(i / steps);
      await page.mouse.move(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
      await sleep(ms / steps);
    }
    pos = { x, y };
  }

  async function center(locator) {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    return { x: box.x + Math.min(box.width / 2, 120), y: box.y + box.height / 2 };
  }

  return {
    page,
    hold: (ms) => sleep(ms),
    /** Puts the cursor on screen where the clip starts. */
    async park() {
      await page.mouse.move(pos.x, pos.y);
    },
    moveTo,
    async hover(locator, ms) {
      const c = await center(locator);
      await moveTo(c.x, c.y, ms);
    },
    async click(locator, ms) {
      const c = await center(locator);
      await moveTo(c.x, c.y, ms);
      await sleep(180);
      await page.mouse.down();
      await sleep(90);
      await page.mouse.up();
    },
    async type(text, delay = 85) {
      await page.keyboard.type(text, { delay });
    },
    /** Scrolls whatever is under the cursor by `dy` pixels, smoothly. */
    async scroll(dy, ms = 1200) {
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

// ---- The flows ---------------------------------------------------------------------------------
// Each one gets the page already loaded, then `start()` marks where the clip begins. Selectors lean
// on visible text and roles so they survive restyling; if a demo's UI changes, adjust here.

const flows = {
  oncora: {
    url: 'https://oncora.cjservin.com',
    poster: 0.62, // fraction of the clip used as the still image
    async run(d, start) {
      const p = d.page;
      await p.getByRole('button', { name: 'Predict' }).waitFor();
      await d.hold(1500);
      await start();
      await d.park();
      await d.hold(400);
      await d.hover(p.getByPlaceholder('Paste a molecule as SMILES'), 700);
      await d.hold(300);
      await d.click(p.getByRole('button', { name: 'Predict' }), 650);
      await p.getByText('Top predicted target').waitFor({ timeout: 60000 });
      await d.hold(500);
      await d.hover(p.getByText('Top predicted target'), 800);
      await d.hold(1400);
      await d.hover(p.getByText('Independent agreement'), 700);
      await d.hold(900);
      await d.moveTo(870, 600, 400);
      await d.scroll(820, 1400);
      await d.hold(1600);
    },
  },

  gridmerge: {
    url: 'https://gridmerge.cjservin.com',
    poster: 0.55,
    async run(d, start) {
      const p = d.page;
      const firstPair = p.locator('text=/kV|MW/').first();
      await p.getByText('Potential coordination opportunities').waitFor({ timeout: 60000 });
      await firstPair.waitFor();
      await d.hold(2500);
      await start();
      await d.park();
      await d.hold(1300);
      await d.click(firstPair, 900);
      await d.hold(3800); // the map flies in to the pair
      await d.hover(p.getByText('Rough coordination value', { exact: false }).first(), 800);
      await d.hold(1500);
      await d.click(p.getByRole('button', { name: /next/i }).or(p.getByText('›', { exact: true })).first(), 800);
      await d.hold(3600);
    },
  },

  vas: {
    url: 'https://demo.joseyandco.com/reconcile',
    poster: 0.4,
    async run(d, start) {
      const p = d.page;
      // The first purchase-order number in the not-reconciled list; the demo resets nightly, so
      // don't depend on a particular one.
      const firstPO = p.locator('a[href^="/po/"]').first();
      await firstPO.waitFor({ timeout: 60000 });
      await d.hold(2000);
      await start();
      await d.park();
      await d.hold(1200);
      await d.hover(p.getByText(/Open POs/).first(), 700);
      await d.hold(700);
      await d.click(firstPO, 900);
      await p.getByText('What was ordered').waitFor({ timeout: 30000 });
      await d.hold(1300);
      await d.hover(p.locator('th', { hasText: /^margin$/i }).first(), 900);
      await d.hold(1500);
      await d.click(p.getByPlaceholder(/Search items, bins, POs/), 900);
      await d.hold(300);
      await d.type('PVC elbow');
      await d.hold(2600);
    },
  },

  grantit: {
    url: 'https://grantit.joseyandco.com/',
    poster: 0.45,
    async run(d, start) {
      const p = d.page;
      const nav = (name) => p.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true });
      await p.getByText('Needs your attention').waitFor({ timeout: 60000 });
      await d.hold(1500);
      await start();
      await d.park();
      await d.hold(900);
      await d.click(nav('Applications'), 800);
      await p.getByText('Youth Mental Health Partnership').first().waitFor();
      await d.hold(900);
      await d.hover(p.getByText('Youth Mental Health Partnership').first(), 800);
      await d.hold(1300);
      await d.click(nav('Financials'), 900);
      await p.getByText('Spending by category').waitFor();
      await d.hold(1300);
      // The pie is drawn without labels; aim for the largest slice (Personnel), right of centre.
      const pie = await p.evaluate(() => {
        const svgs = [...document.querySelectorAll('main svg')].map((s) => s.getBoundingClientRect());
        const r = svgs.sort((a, b) => b.width * b.height - a.width * a.height)[0];
        return { x: r.x + r.width * 0.68, y: r.y + r.height * 0.55 };
      });
      await d.moveTo(pie.x, pie.y, 900);
      await d.hold(250);
      await p.mouse.down();
      await d.hold(90);
      await p.mouse.up();
      await d.hold(3200);
    },
  },
};

// ---- Recording ---------------------------------------------------------------------------------

async function record(name, flow, browser) {
  const work = mkdtempSync(join(tmpdir(), `demo-${name}-`));
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await context.addInitScript(CURSOR_SCRIPT);
  const page = await context.newPage();
  await page.goto(flow.url, { waitUntil: 'load', timeout: 60000 });

  const cdp = await context.newCDPSession(page);
  const frames = [];
  let recording = false;
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    if (!recording) return;
    const file = join(work, `f${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: VIEWPORT.width, maxHeight: VIEWPORT.height });

  const d = director(page);
  await flow.run(d, async () => {
    recording = true;
    // The screencast only sends a frame when something changes; nudge one out so the clip has a
    // first frame even if the page is perfectly still.
    await page.evaluate(() => new Promise(requestAnimationFrame));
  });
  const end = Date.now() / 1000;
  await sleep(300);
  recording = false;
  await cdp.send('Page.stopScreencast');
  await context.close();

  if (frames.length < 2) throw new Error(`${name}: only ${frames.length} frames captured`);
  // Each frame lasts until the next one arrives; the last one until the flow finished.
  const lines = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(end, f.t + 0.05);
    lines.push(`file '${f.file}'`, `duration ${(next - f.t).toFixed(4)}`);
  });
  lines.push(`file '${frames.at(-1).file}'`);
  const list = join(work, 'frames.txt');
  writeFileSync(list, lines.join('\n'));

  const master = join(work, 'master.mp4');
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', master]);
  const duration = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', master]).toString().trim(),
  );

  // Loop seam: the clip starts LOOP_FADE seconds in, and its last LOOP_FADE seconds cross-fade into
  // the opening LOOP_FADE seconds, so the last frame is the frame the clip starts on.
  const F = LOOP_FADE;
  const loop =
    `[0:v]split[a][b];` +
    `[a]trim=start=${F},setpts=PTS-STARTPTS,fps=${FPS}[body];` +
    `[b]trim=end=${F},setpts=PTS-STARTPTS,fps=${FPS}[head];` +
    `[body][head]xfade=transition=fade:duration=${F}:offset=${(duration - 2 * F).toFixed(3)},` +
    `scale=${OUTPUT_WIDTH}:-2:flags=lanczos,format=yuv420p[v]`;

  mkdirSync(OUT, { recursive: true });
  const mp4 = join(OUT, `${name}.mp4`);
  const webm = join(OUT, `${name}.webm`);
  ffmpeg(['-i', master, '-filter_complex', loop, '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25',
    '-profile:v', 'high', '-movflags', '+faststart', mp4]);
  ffmpeg(['-i', master, '-filter_complex', loop, '-map', '[v]', '-an', '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0',
    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', webm]);
  const posterAt = ((duration - F) * flow.poster).toFixed(2);
  ffmpeg(['-ss', posterAt, '-i', mp4, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '82', join(OUT, `${name}.webp`)]);

  rmSync(work, { recursive: true, force: true });
  console.log(`${name}: ${(duration - F).toFixed(1)}s, ${frames.length} source frames -> public/demos/${name}.{mp4,webm,webp}`);
}

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
}

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(flows);
for (const n of names) if (!flows[n]) throw new Error(`Unknown demo "${n}". Known: ${Object.keys(flows).join(', ')}`);

const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const n of names) await record(n, flows[n], browser);
} finally {
  await browser.close();
}

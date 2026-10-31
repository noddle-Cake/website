// Dynamic contrast: keeps text readable over the painted backdrop. For each piece of text that sits
// straight on the painting, it measures the painting behind it (mapped the way the backdrop is drawn:
// cover, anchored at the bottom) against the text's own colour. When the WCAG contrast ratio falls
// short it raises a soft halo in the opposite tone, as strong as the shortfall ([data-ink] in
// global.css). It follows scrolling, resizing, and the light/dark and palette switches.

const SELECTOR = [
  'header a',
  'main h1',
  'main h2',
  'main h3',
  'main p',
  'main li',
  'main dt',
  'main dd',
  'main .arrow-link',
  'main .meta-row',
  'main figcaption span',
  'footer p',
  'footer a',
].join(', ');
// Width of the downsampled copy of the painting that brightness is read from.
const GRID_W = 160;
const LIGHT_HALO = '252 247 236';
const DARK_HALO = '12 14 26';

type Painting = { lum: Float32Array; gw: number; gh: number; iw: number; ih: number };

let painting: Painting | null = null;
let paintingUrl = '';
let targets: HTMLElement[] = [];
const visible = new Set<HTMLElement>();
const inkCache = new Map<HTMLElement, number>();
let frame = 0;

const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
probe.canvas.width = probe.canvas.height = 1;

/** Any CSS colour, as the browser resolves it, to [r, g, b, a] in 0..255. */
function rgba(css: string): [number, number, number, number] {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000';
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2], d[3]];
}

const linear = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/** Text sitting on a button, card or bar has its own background; leave it alone. */
function onOwnSurface(el: HTMLElement) {
  for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.backgroundImage !== 'none' || rgba(cs.backgroundColor)[3] > 100) return true;
  }
  return false;
}

async function loadPainting() {
  const sky = document.querySelector<HTMLElement>('.dream-sky');
  const url = sky && getComputedStyle(sky).backgroundImage.match(/url\("?([^")]+)"?\)/)?.[1];
  if (!url) return (painting = null);
  if (url === paintingUrl && painting) return painting;
  const img = new Image();
  img.src = url;
  await img.decode();
  const gw = GRID_W;
  const gh = Math.round((GRID_W * img.naturalHeight) / img.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = gw;
  canvas.height = gh;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, gw, gh);
  const px = ctx.getImageData(0, 0, gw, gh).data;
  const lum = new Float32Array(gw * gh);
  for (let i = 0; i < lum.length; i++) lum[i] = luminance(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
  paintingUrl = url;
  return (painting = { lum, gw, gh, iw: img.naturalWidth, ih: img.naturalHeight });
}

/** Mean luminance of the painting behind a viewport rectangle. */
function behind(rect: DOMRect, p: Painting) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const s = Math.max(W / p.iw, H / p.ih);
  const x0 = (W - p.iw * s) / 2;
  const y0 = H - p.ih * s;
  const toGrid = (v: number, o: number, n: number, size: number) => Math.min(n - 1, Math.max(0, Math.floor((((v - o) / s) * n) / size)));
  const gx0 = toGrid(rect.left, x0, p.gw, p.iw);
  const gx1 = toGrid(rect.right, x0, p.gw, p.iw);
  const gy0 = toGrid(rect.top, y0, p.gh, p.ih);
  const gy1 = toGrid(rect.bottom, y0, p.gh, p.ih);
  let sum = 0;
  let count = 0;
  for (let y = gy0; y <= gy1; y++) for (let x = gx0; x <= gx1; x++, count++) sum += p.lum[y * p.gw + x];
  return count ? sum / count : 0.5;
}

function update() {
  frame = 0;
  if (!painting) return;
  for (const el of visible) {
    let ink = inkCache.get(el);
    if (ink === undefined) {
      const [r, g, b] = rgba(getComputedStyle(el).color);
      inkCache.set(el, (ink = luminance(r, g, b)));
    }
    const bg = behind(el.getBoundingClientRect(), painting);
    const ratio = (Math.max(ink, bg) + 0.05) / (Math.min(ink, bg) + 0.05);
    const size = parseFloat(getComputedStyle(el).fontSize);
    const target = size >= 24 ? 3 : 4.5;
    const halo = ratio >= target ? 0 : Math.min(1, Math.max(0.2, (target / ratio - 1) * 1.4));
    el.style.setProperty('--halo', halo.toFixed(2));
    el.style.setProperty('--halo-rgb', ink > 0.4 ? DARK_HALO : LIGHT_HALO);
  }
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(update);
};

const observer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target as HTMLElement);
      else visible.delete(e.target as HTMLElement);
    }
    schedule();
  },
  { rootMargin: '120px 0px' }
);

async function refresh() {
  inkCache.clear();
  await loadPainting();
  schedule();
}

async function initContrast() {
  observer.disconnect();
  visible.clear();
  inkCache.clear();
  targets = [...document.querySelectorAll<HTMLElement>(SELECTOR)].filter((el) => !onOwnSurface(el));
  for (const el of targets) {
    el.dataset.ink = '';
    observer.observe(el);
  }
  await loadPainting();
  schedule();
}

initContrast();
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule, { passive: true });
// Light/dark swaps the painting and the ink; a palette swaps the ink.
new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette'] });
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refresh);
document.addEventListener('astro:after-swap', initContrast);

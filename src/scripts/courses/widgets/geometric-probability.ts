import { setupCanvas, themeColor, onThemeChange } from '../canvas';

/**
 * Uniform darts on the square [-1, 1]^2. Probability becomes area / 4, and the
 * degenerate band region shows why a line has probability exactly zero.
 */

interface Region {
  id: string;
  test: (x: number, y: number, eps: number) => boolean;
  /** Exact probability, or null when it depends on the band width. */
  area: (eps: number) => number;
  formula: (eps: number) => string;
}

const REGIONS: Region[] = [
  {
    id: 'above-abs',
    test: (x, y) => y > Math.abs(x),
    area: () => 0.25,
    formula: () => 'one of the four triangles the diagonals cut the square into → 1/4',
  },
  {
    id: 'above-diag',
    test: (x, y) => y > x,
    area: () => 0.5,
    formula: () => 'the diagonal splits the square in half → 1/2',
  },
  {
    id: 'band',
    test: (x, y, eps) => Math.abs(y - 2 * x) <= eps,
    area: (eps) => bandArea(eps),
    formula: (eps) =>
      eps <= 1e-9
        ? 'the bare line y = 2x has zero area → probability exactly 0'
        : `strip of half-width ε = ${eps.toFixed(3)} around y = 2x`,
  },
  {
    id: 'disc',
    test: (x, y) => x * x + y * y < 1,
    area: () => Math.PI / 4,
    formula: () => 'π·1² / 4 = π/4 ≈ 0.7854',
  },
  {
    id: 'diamond',
    test: (x, y) => Math.abs(x) + Math.abs(y) < 1,
    area: () => 0.5,
    formula: () => 'a square of diagonal 2 has area 2, over the 4 available → 1/2',
  },
];

/** Fraction of [-1,1]^2 inside |y - 2x| <= eps, by 1-D quadrature over x. */
function bandArea(eps: number): number {
  if (eps <= 0) return 0;
  const steps = 20000;
  const dx = 2 / steps;
  let acc = 0;
  for (let i = 0; i < steps; i++) {
    const x = -1 + (i + 0.5) * dx;
    const lo = Math.max(-1, 2 * x - eps);
    const hi = Math.min(1, 2 * x + eps);
    if (hi > lo) acc += (hi - lo) * dx;
  }
  return acc / 4;
}

export function initGeometricProbability(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const select = root.querySelector<HTMLSelectElement>('[data-region]');
  const epsSlider = root.querySelector<HTMLInputElement>('[data-slider="eps"]');
  const epsReadout = root.querySelector<HTMLElement>('[data-eps-readout]');
  const exactEl = root.querySelector<HTMLElement>('[data-exact]');
  const formulaEl = root.querySelector<HTMLElement>('[data-formula]');
  const empiricalEl = root.querySelector<HTMLElement>('[data-empirical]');
  if (!canvas || !select || !epsSlider) return;

  const S = 300;
  const ctx = setupCanvas(canvas, S, S);
  const offscreen = document.createElement('canvas');
  offscreen.width = S;
  offscreen.height = S;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  let darts: Array<[number, number, boolean]> = [];

  const toCanvas = (x: number, y: number): [number, number] => [((x + 1) / 2) * S, ((1 - y) / 2) * S];

  function currentRegion(): Region {
    return REGIONS.find((r) => r.id === select!.value) ?? REGIONS[0];
  }

  function epsilon(): number {
    return Number(epsSlider!.value) / 1000;
  }

  function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '').trim();
    const n = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
    if (Number.isNaN(n)) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function draw() {
    const region = currentRegion();
    const eps = epsilon();

    const img = offCtx!.createImageData(S, S);
    const [r, g, b] = hexToRgb(themeColor('slate-600'));
    for (let py = 0; py < S; py++) {
      const y = 1 - ((py + 0.5) / S) * 2;
      for (let px = 0; px < S; px++) {
        const x = ((px + 0.5) / S) * 2 - 1;
        if (!region.test(x, y, eps)) continue;
        const idx = (py * S + px) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 200;
      }
    }
    offCtx!.putImageData(img, 0, 0);

    ctx.clearRect(0, 0, S, S);
    ctx.drawImage(offscreen, 0, 0, S, S);

    ctx.strokeStyle = themeColor('slate-700');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, S / 2);
    ctx.lineTo(S, S / 2);
    ctx.moveTo(S / 2, 0);
    ctx.lineTo(S / 2, S);
    ctx.stroke();

    for (const [x, y, hit] of darts) {
      const [cx, cy] = toCanvas(x, y);
      ctx.fillStyle = hit ? themeColor('slate-50') : themeColor('slate-500');
      ctx.beginPath();
      ctx.arc(cx, cy, hit ? 1.8 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = themeColor('slate-100');
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, S - 1.5, S - 1.5);

    const exact = region.area(eps);
    if (exactEl) exactEl.textContent = exact.toFixed(4);
    if (formulaEl) formulaEl.textContent = region.formula(eps);
    if (epsReadout) epsReadout.textContent = eps.toFixed(3);
    if (empiricalEl) {
      const hits = darts.reduce((n, d) => n + (d[2] ? 1 : 0), 0);
      empiricalEl.textContent = darts.length
        ? `${hits} / ${darts.length} = ${(hits / darts.length).toFixed(4)}`
        : 'no darts thrown yet';
    }
  }

  function throwDarts(n: number) {
    const region = currentRegion();
    const eps = epsilon();
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      darts.push([x, y, region.test(x, y, eps)]);
    }
    if (darts.length > 8000) darts = darts.slice(-8000);
    draw();
  }

  function reset() {
    darts = [];
    draw();
  }

  select.addEventListener('change', reset);
  epsSlider.addEventListener('input', reset);
  root.querySelector('[data-throw]')?.addEventListener('click', () => throwDarts(400));
  root.querySelector('[data-reset]')?.addEventListener('click', reset);

  onThemeChange(draw);
  draw();
}

document
  .querySelectorAll<HTMLElement>('[data-widget="geometric-probability"]')
  .forEach(initGeometricProbability);

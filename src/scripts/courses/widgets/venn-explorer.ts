import { setupCanvas, themeColor, onThemeChange } from '../canvas';

/**
 * Three-circle Venn diagram where every one of the 8 regions is clickable.
 * The selected regions are translated back into a set expression built only
 * from union, intersection, and complement.
 */

const NAMES = ['X', 'Y', 'Z'] as const;

/** Region codes are bitmasks: bit 0 = in X, bit 1 = in Y, bit 2 = in Z. */
function termFor(code: number): string {
  return NAMES.map((n, i) => (code & (1 << i) ? n : `${n}ᶜ`)).join(' ∩ ');
}

function expressionFor(codes: Set<number>): string {
  if (codes.size === 0) return '∅  (the empty set)';
  if (codes.size === 8) return 'S  (the whole sample space)';
  const terms = [...codes].sort((a, b) => a - b).map(termFor);
  return terms.map((t) => `(${t})`).join('  ∪  ');
}

interface Preset {
  key: string;
  simplified: string;
  codes: number[];
}

const PRESETS: Preset[] = [
  { key: 'a', simplified: 'X ∪ Y', codes: [1, 2, 3, 5, 6, 7] },
  { key: 'b', simplified: '(X ∩ Yᶜ) ∪ (Xᶜ ∩ Y)', codes: [1, 2, 5, 6] },
  { key: 'c', simplified: 'the "exactly one of X, Y, Z" event', codes: [1, 2, 4] },
  { key: 'd', simplified: '(X ∪ Y) ∩ Zᶜ', codes: [1, 2, 3] },
  { key: 'e', simplified: '(Xᶜ ∩ Yᶜ ∩ Zᶜ)ᶜ', codes: [1, 2, 3, 4, 5, 6, 7] },
];

export function initVennExplorer(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const expressionEl = root.querySelector<HTMLElement>('[data-expression]');
  const hintEl = root.querySelector<HTMLElement>('[data-hint]');
  if (!canvas) return;

  const W = 360;
  const H = 310;
  const ctx = setupCanvas(canvas, W, H);

  const offscreen = document.createElement('canvas');
  offscreen.width = W;
  offscreen.height = H;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  const R = 78;
  const CIRCLES = [
    { x: 135, y: 120 },
    { x: 225, y: 120 },
    { x: 180, y: 196 },
  ];
  const RECT = { x: 20, y: 25, w: 320, h: 275 };

  const selected = new Set<number>();

  function codeAt(px: number, py: number): number | null {
    if (px < RECT.x || px > RECT.x + RECT.w || py < RECT.y || py > RECT.y + RECT.h) return null;
    let code = 0;
    CIRCLES.forEach((c, i) => {
      const dx = px - c.x;
      const dy = py - c.y;
      if (dx * dx + dy * dy <= R * R) code |= 1 << i;
    });
    return code;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Per-pixel fill of the selected regions, then vector outlines on top.
    const img = offCtx!.createImageData(W, H);
    const fill = hexToRgb(themeColor('slate-600'));
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const code = codeAt(x + 0.5, y + 0.5);
        if (code === null || !selected.has(code)) continue;
        const idx = (y * W + x) * 4;
        img.data[idx] = fill[0];
        img.data[idx + 1] = fill[1];
        img.data[idx + 2] = fill[2];
        img.data[idx + 3] = code === 0 ? 110 : 190;
      }
    }
    offCtx!.putImageData(img, 0, 0);
    ctx.drawImage(offscreen, 0, 0, W, H);

    ctx.strokeStyle = themeColor('slate-700');
    ctx.lineWidth = 1;
    ctx.strokeRect(RECT.x, RECT.y, RECT.w, RECT.h);

    ctx.strokeStyle = themeColor('slate-100');
    ctx.lineWidth = 1.75;
    for (const c of CIRCLES) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = themeColor('slate-100');
    ctx.font = '600 15px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', 82, 52);
    ctx.fillText('Y', 278, 52);
    ctx.fillText('Z', 180, 290);
    ctx.fillStyle = themeColor('slate-500');
    ctx.font = '600 13px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('S', 32, 38);

    if (expressionEl) expressionEl.textContent = expressionFor(selected);
    if (hintEl) {
      const match = PRESETS.find(
        (p) => p.codes.length === selected.size && p.codes.every((c) => selected.has(c))
      );
      hintEl.textContent = match
        ? `That is exactly ${match.simplified} — ${selected.size} of the 8 regions.`
        : `${selected.size} of 8 regions shaded.`;
    }
  }

  function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '').trim();
    const full =
      clean.length === 3
        ? clean
            .split('')
            .map((c) => c + c)
            .join('')
        : clean;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const py = ((event.clientY - rect.top) / rect.height) * H;
    const code = codeAt(px, py);
    if (code === null) return;
    if (selected.has(code)) selected.delete(code);
    else selected.add(code);
    draw();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = PRESETS.find((p) => p.key === button.dataset.preset);
      selected.clear();
      if (preset) for (const c of preset.codes) selected.add(c);
      draw();
    });
  });

  root.querySelector<HTMLButtonElement>('[data-clear]')?.addEventListener('click', () => {
    selected.clear();
    draw();
  });

  onThemeChange(draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="venn-explorer"]').forEach(initVennExplorer);

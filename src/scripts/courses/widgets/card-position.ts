import { setupCanvas, themeColor, onThemeChange } from '../canvas';

/**
 * Where does the j-th "special" card land? Distribution over deal positions for
 * a deck of N cards containing S specials — the shape behind every
 * "the 4th card was the first spade" question.
 */

/** ln of the falling factorial x·(x-1)···(x-m+1). */
function lnFalling(x: number, m: number): number {
  let acc = 0;
  for (let i = 0; i < m; i++) {
    const term = x - i;
    if (term <= 0) return -Infinity;
    acc += Math.log(term);
  }
  return acc;
}

function lnChoose(n: number, r: number): number {
  if (r < 0 || r > n) return -Infinity;
  let acc = 0;
  const k = Math.min(r, n - r);
  for (let i = 1; i <= k; i++) acc += Math.log(n - k + i) - Math.log(i);
  return acc;
}

/** P(the j-th special card is dealt at position p). */
export function jthSpecialAt(N: number, S: number, j: number, p: number): number {
  if (j < 1 || p < j || p > N || S < j || N - S < p - j) return 0;
  const ln =
    lnChoose(p - 1, j - 1) + lnFalling(S, j) + lnFalling(N - S, p - j) - lnFalling(N, p);
  return Number.isFinite(ln) ? Math.exp(ln) : 0;
}

export function initCardPosition(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const sliders = {
    N: root.querySelector<HTMLInputElement>('[data-slider="N"]'),
    S: root.querySelector<HTMLInputElement>('[data-slider="S"]'),
    j: root.querySelector<HTMLInputElement>('[data-slider="j"]'),
    p: root.querySelector<HTMLInputElement>('[data-slider="p"]'),
  };
  if (!canvas || !sliders.N || !sliders.S || !sliders.j || !sliders.p) return;

  const W = 440;
  const H = 180;
  const ctx = setupCanvas(canvas, W, H);
  const out = (id: string) => root.querySelector<HTMLElement>(`[data-out="${id}"]`);

  function draw() {
    const N = Number(sliders.N!.value);
    const S = Math.min(Number(sliders.S!.value), N);
    sliders.S!.max = String(N);
    sliders.j!.max = String(Math.max(1, S));
    const j = Math.min(Number(sliders.j!.value), Math.max(1, S));
    sliders.p!.max = String(N);
    const p = Math.min(Number(sliders.p!.value), N);

    const probs: number[] = [];
    for (let pos = 1; pos <= N; pos++) probs.push(jthSpecialAt(N, S, j, pos));
    const selected = probs[p - 1] ?? 0;
    const cumulative = probs.slice(0, p).reduce((a, b) => a + b, 0);

    out('N')!.textContent = String(N);
    out('S')!.textContent = String(S);
    out('j')!.textContent = String(j);
    out('p')!.textContent = String(p);
    out('prob')!.textContent = selected.toExponential(4);
    out('probDec')!.textContent = selected.toFixed(6);
    out('cum')!.textContent = cumulative.toFixed(6);
    out('formula')!.textContent =
      `C(${p - 1}, ${j - 1}) · (${S})_${j} · (${N - S})_${p - j} / (${N})_${p}`;

    ctx.clearRect(0, 0, W, H);
    const padL = 30;
    const padB = 22;
    const padT = 8;
    const plotW = W - padL - 8;
    const plotH = H - padB - padT;
    const maxP = Math.max(...probs, 1e-12);
    const barW = plotW / N;

    probs.forEach((value, i) => {
      const h = (value / maxP) * plotH;
      ctx.fillStyle = i + 1 === p ? themeColor('slate-100') : themeColor('slate-700');
      ctx.fillRect(padL + i * barW + barW * 0.1, padT + plotH - h, Math.max(1, barW * 0.8), h);
    });

    ctx.strokeStyle = themeColor('slate-700');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH + 0.5);
    ctx.lineTo(padL + plotW, padT + plotH + 0.5);
    ctx.stroke();

    ctx.fillStyle = themeColor('slate-400');
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    const step = N > 30 ? 5 : N > 15 ? 2 : 1;
    for (let i = 1; i <= N; i++) {
      if (i !== 1 && i % step !== 0) continue;
      ctx.fillText(String(i), padL + (i - 1) * barW + barW / 2, padT + plotH + 5);
    }
  }

  Object.values(sliders).forEach((s) => s!.addEventListener('input', draw));
  onThemeChange(draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="card-position"]').forEach(initCardPosition);

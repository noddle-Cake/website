import { setupCanvas, themeColor, onThemeChange } from '../canvas';
import { formatProbability } from '../combinatorics';

/**
 * Cracking a d-digit code drawn from b symbols, two ways: a systematic guesser
 * who never repeats a guess against a fixed code, and a guesser facing a
 * rolling code, where every attempt is an independent 1/N shot.
 */
export function initGuessingOdds(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const baseSlider = root.querySelector<HTMLInputElement>('[data-slider="base"]');
  const digitSlider = root.querySelector<HTMLInputElement>('[data-slider="digits"]');
  const attemptSlider = root.querySelector<HTMLInputElement>('[data-slider="k"]');
  if (!canvas || !baseSlider || !digitSlider || !attemptSlider) return;

  const W = 440;
  const H = 200;
  const ctx = setupCanvas(canvas, W, H);
  const out = (id: string) => root.querySelector<HTMLElement>(`[data-out="${id}"]`);

  function draw() {
    const b = Number(baseSlider!.value);
    const d = Number(digitSlider!.value);
    const N = Math.pow(b, d);
    attemptSlider!.max = String(N);
    const k = Math.min(Number(attemptSlider!.value), N);

    const pFixedExact = k <= N ? 1 / N : 0;
    const pFixedCum = Math.min(1, k / N);
    const pRollExact = Math.pow(1 - 1 / N, k - 1) / N;
    const pRollCum = 1 - Math.pow(1 - 1 / N, k);

    out('N')!.textContent = `${b}^${d} = ${N.toLocaleString('en-US')}`;
    out('k')!.textContent = String(k);
    out('base')!.textContent = String(b);
    out('digits')!.textContent = String(d);
    out('fixedExact')!.textContent = formatProbability(pFixedExact);
    out('fixedCum')!.textContent = formatProbability(pFixedCum);
    out('rollExact')!.textContent = formatProbability(pRollExact);
    out('rollCum')!.textContent = formatProbability(pRollCum);

    ctx.clearRect(0, 0, W, H);
    const padL = 36;
    const padR = 10;
    const padT = 12;
    const padB = 26;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    ctx.strokeStyle = themeColor('slate-800');
    ctx.lineWidth = 1;
    for (let f = 0; f <= 1.0001; f += 0.25) {
      const y = padT + plotH * (1 - f);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillStyle = themeColor('slate-500');
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.toFixed(2), padL - 6, y);
    }

    const xOf = (attempt: number) => padL + ((attempt - 1) / Math.max(1, N - 1)) * plotW;
    const yOf = (prob: number) => padT + plotH * (1 - prob);
    const samples = Math.min(N, 400);

    const curve = (cum: (a: number) => number, color: string, dashed: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dashed ? [5, 4] : []);
      ctx.beginPath();
      for (let i = 0; i < samples; i++) {
        const attempt = 1 + Math.round((i / Math.max(1, samples - 1)) * (N - 1));
        const x = xOf(attempt);
        const y = yOf(cum(attempt));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    curve((a) => Math.min(1, a / N), themeColor('slate-100'), false);
    curve((a) => 1 - Math.pow(1 - 1 / N, a), themeColor('slate-400'), true);

    ctx.strokeStyle = themeColor('slate-600');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xOf(k), padT);
    ctx.lineTo(xOf(k), padT + plotH);
    ctx.stroke();

    ctx.fillStyle = themeColor('slate-400');
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('attempt 1', padL, padT + plotH + 6);
    ctx.textAlign = 'right';
    ctx.fillText(`attempt ${N.toLocaleString('en-US')}`, padL + plotW, padT + plotH + 6);
  }

  [baseSlider, digitSlider, attemptSlider].forEach((s) => s.addEventListener('input', draw));
  onThemeChange(draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="guessing-odds"]').forEach(initGuessingOdds);

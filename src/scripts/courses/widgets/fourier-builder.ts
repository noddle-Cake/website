import { setupCanvas, themeColor, onThemeChange } from '../canvas';

export function initFourierBuilder(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const slider = root.querySelector<HTMLInputElement>('input[type="range"]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  if (!canvas || !slider) return;

  const W = 560;
  const H = 200;
  const ctx = setupCanvas(canvas, W, H);
  const padX = 20;
  const midY = H / 2;
  const amp = 75;
  const plotW = W - 2 * padX;

  // Square-wave Fourier series: sum of odd harmonics, (4/π) Σ sin((2k-1)ωt) / (2k-1)
  function squareApprox(t: number, terms: number): number {
    let sum = 0;
    for (let k = 1; k <= terms; k++) {
      const n = 2 * k - 1;
      sum += Math.sin(2 * Math.PI * n * t) / n;
    }
    return (4 / Math.PI) * sum;
  }

  function draw() {
    const terms = Number(slider!.value);

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = themeColor('slate-800');
    ctx.beginPath();
    ctx.moveTo(padX, midY);
    ctx.lineTo(W - padX, midY);
    ctx.stroke();

    // target square wave, faint
    ctx.strokeStyle = themeColor('slate-700');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const t = px / plotW;
      const target = Math.sign(Math.sin(2 * Math.PI * t)) || 1;
      const y = midY - amp * target;
      if (px === 0) ctx.moveTo(padX + px, y);
      else ctx.lineTo(padX + px, y);
    }
    ctx.stroke();

    // partial sum approximation
    ctx.strokeStyle = themeColor('slate-100');
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const t = px / plotW;
      const y = midY - amp * squareApprox(t, terms);
      if (px === 0) ctx.moveTo(padX + px, y);
      else ctx.lineTo(padX + px, y);
    }
    ctx.stroke();

    if (readout) {
      readout.textContent = `${terms} harmonic${terms === 1 ? '' : 's'} — f(t) ≈ (4/π) Σ sin(2π(2k−1)t)/(2k−1), k = 1…${terms}`;
    }
  }

  slider.addEventListener('input', draw);
  onThemeChange(draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="fourier-builder"]').forEach(initFourierBuilder);

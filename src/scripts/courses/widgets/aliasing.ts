import { setupCanvas, themeColor, onThemeChange } from '../canvas';

const F0 = 9; // true signal frequency, in cycles across the canvas

function aliasFrequency(f0: number, fs: number): number {
  if (fs === 0) return f0;
  let folded = Math.abs(f0 - Math.round(f0 / fs) * fs);
  if (folded > fs / 2) folded = fs - folded;
  return folded;
}

function aliasSign(f0: number, fAlias: number, t: number): number {
  const a = Math.sin(2 * Math.PI * f0 * t);
  const b = Math.sin(2 * Math.PI * fAlias * t);
  if (Math.abs(b) < 1e-6) return 1;
  return Math.sign(a) === Math.sign(b) ? 1 : -1;
}

export function initAliasingDemo(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const slider = root.querySelector<HTMLInputElement>('input[type="range"]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  if (!canvas || !slider) return;

  const W = 560;
  const H = 200;
  const ctx = setupCanvas(canvas, W, H);
  const padX = 20;
  const midY = H / 2;
  const amp = 75;
  const plotW = W - 2 * padX;

  function draw() {
    const fs = Number(slider!.value);
    const nyquist = 2 * F0;
    const aliased = fs < nyquist;
    const fAlias = aliasFrequency(F0, fs);
    const t1 = 1 / fs;
    const sign = aliasSign(F0, fAlias, t1);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = themeColor('slate-800');
    ctx.beginPath();
    ctx.moveTo(padX, midY);
    ctx.lineTo(W - padX, midY);
    ctx.stroke();

    // true signal (always shown, muted)
    ctx.strokeStyle = themeColor('slate-700');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const t = px / plotW;
      const y = midY - amp * Math.sin(2 * Math.PI * F0 * t);
      if (px === 0) ctx.moveTo(padX + px, y);
      else ctx.lineTo(padX + px, y);
    }
    ctx.stroke();

    // apparent/reconstructed signal through the samples
    if (aliased) {
      ctx.strokeStyle = themeColor('slate-300');
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px <= plotW; px++) {
        const t = px / plotW;
        const y = midY - amp * sign * Math.sin(2 * Math.PI * fAlias * t);
        if (px === 0) ctx.moveTo(padX + px, y);
        else ctx.lineTo(padX + px, y);
      }
      ctx.stroke();
    }

    // sample stems
    ctx.fillStyle = themeColor('slate-100');
    ctx.strokeStyle = themeColor('slate-500');
    ctx.lineWidth = 1.5;
    for (let n = 0; n <= fs; n++) {
      const t = n / fs;
      if (t > 1) break;
      const x = padX + t * plotW;
      const y = midY - amp * Math.sin(2 * Math.PI * F0 * t);
      ctx.beginPath();
      ctx.moveTo(x, midY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (readout) {
      readout.textContent = `f₀ = ${F0}, fs = ${fs} → Nyquist rate = ${nyquist}`;
    }
    if (status) {
      status.textContent = aliased
        ? `Aliased — the samples also match a ${fAlias.toFixed(1)}-cycle wave (shown in light gray)`
        : 'Nyquist satisfied — the samples uniquely determine the original signal';
      status.classList.toggle('text-slate-100', aliased);
      status.classList.toggle('text-slate-500', !aliased);
    }
  }

  slider.addEventListener('input', draw);
  onThemeChange(draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="aliasing"]').forEach(initAliasingDemo);

import { setupCanvas, themeColor, onThemeChange } from '../canvas';

export function initSamplingDemo(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const slider = root.querySelector<HTMLInputElement>('input[type="range"]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  if (!canvas || !slider) return;

  const W = 560;
  const H = 200;
  const ctx = setupCanvas(canvas, W, H);
  const padX = 20;
  const midY = H / 2;
  const amp = 70;
  const cycles = 3;
  const freq = (cycles * 2 * Math.PI) / (W - 2 * padX);

  function signal(x: number): number {
    return Math.sin((x - padX) * freq);
  }

  function draw() {
    const samplesPerCycle = Number(slider!.value);
    const dx = (W - 2 * padX) / (cycles * samplesPerCycle);

    ctx.clearRect(0, 0, W, H);

    // continuous curve
    ctx.strokeStyle = themeColor('slate-600');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = padX; x <= W - padX; x += 1) {
      const y = midY - amp * signal(x);
      if (x === padX) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // axis
    ctx.strokeStyle = themeColor('slate-800');
    ctx.beginPath();
    ctx.moveTo(padX, midY);
    ctx.lineTo(W - padX, midY);
    ctx.stroke();

    // sample stems + impulses
    ctx.fillStyle = themeColor('slate-100');
    ctx.strokeStyle = themeColor('slate-400');
    ctx.lineWidth = 2;
    let n = 0;
    for (let x = padX; x <= W - padX + 0.001; x += dx) {
      const y = midY - amp * signal(x);
      ctx.beginPath();
      ctx.moveTo(x, midY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      n += 1;
    }

    if (readout) {
      readout.textContent = `${samplesPerCycle} samples/cycle → x_s(t) = Σ x(nT) δ(t − nT), ${n} impulses shown`;
    }
  }

  slider.addEventListener('input', draw);
  onThemeChange(draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="sampling"]').forEach(initSamplingDemo);

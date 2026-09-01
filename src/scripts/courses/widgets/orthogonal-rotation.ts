import { setupCanvas, themeColor, onThemeChange } from '../canvas';

export function initOrthogonalRotation(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const slider = root.querySelector<HTMLInputElement>('input[type="range"]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  if (!canvas || !slider) return;

  const W = 320;
  const H = 320;
  const ctx = setupCanvas(canvas, W, H);
  const cx = W / 2;
  const cy = H / 2;
  const r = 110;

  function drawArrow(x1: number, y1: number, x2: number, y2: number, color: string) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 9;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    const deg = Number(slider!.value);
    const theta = (deg * Math.PI) / 180;

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = themeColor('slate-800');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r - 10, cy);
    ctx.lineTo(cx + r + 10, cy);
    ctx.moveTo(cx, cy - r - 10);
    ctx.lineTo(cx, cy + r + 10);
    ctx.stroke();

    // v1 = (cos θ, sin θ), v2 = (-sin θ, cos θ) — canvas y flips downward
    const v1x = Math.cos(theta);
    const v1y = -Math.sin(theta);
    const v2x = -Math.sin(theta);
    const v2y = -Math.cos(theta);

    drawArrow(cx, cy, cx + r * v1x, cy + r * v1y, themeColor('slate-100'));
    drawArrow(cx, cy, cx + r * v2x, cy + r * v2y, themeColor('slate-400'));

    const dot = Math.cos(theta) * -Math.sin(theta) + -Math.sin(theta) * -Math.cos(theta);

    if (readout) {
      readout.textContent = `θ = ${deg}° → v₁·v₂ = ${dot.toFixed(3)}, |v₁| = |v₂| = 1 for every θ`;
    }
  }

  slider.addEventListener('input', draw);
  onThemeChange(draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="orthogonal-rotation"]').forEach(initOrthogonalRotation);

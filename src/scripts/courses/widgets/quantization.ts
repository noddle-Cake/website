import { setupPixelCanvas } from '../canvas';

export function initQuantizationDemo(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const slider = root.querySelector<HTMLInputElement>('input[type="range"]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  if (!canvas || !slider) return;

  const SIZE = 96;
  const ctx = setupPixelCanvas(canvas, SIZE, SIZE, 2.5);
  const imgData = ctx.createImageData(SIZE, SIZE);

  function shade(x: number, y: number): number {
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const dx = (x - cx) / (SIZE / 2);
    const dy = (y - cy) / (SIZE / 2);
    const r = Math.sqrt(dx * dx + dy * dy);
    return Math.pow(Math.max(0, 1 - r), 1.3);
  }

  function draw() {
    const bits = Number(slider!.value);
    const levels = 2 ** bits;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const v = shade(x, y);
        const quantized = levels > 1 ? Math.round(v * (levels - 1)) / (levels - 1) : Math.round(v);
        const gray = Math.round(quantized * 255);
        const idx = (y * SIZE + x) * 4;
        imgData.data[idx] = gray;
        imgData.data[idx + 1] = gray;
        imgData.data[idx + 2] = gray;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    if (readout) {
      readout.textContent = `${bits}-bit resolution → 2^${bits} = ${levels} gray level${levels === 1 ? '' : 's'} (0–${levels - 1})`;
    }
  }

  slider.addEventListener('input', draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="quantization"]').forEach(initQuantizationDemo);

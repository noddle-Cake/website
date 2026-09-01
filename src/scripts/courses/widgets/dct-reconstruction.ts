import { setupPixelCanvas } from '../canvas';
import { dctMatrix, forwardSeparable, inverseSeparable, normalizeTo255 } from '../transforms';

const N = 16;

function testImage(): Float64Array {
  const img = new Float64Array(N * N);
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      const cx = N / 2;
      const cy = N / 2;
      const ring = Math.sin(((x - cx) ** 2 + (y - cy) ** 2) * 0.06);
      const gradient = x / N;
      img[x * N + y] = ((ring + 1) / 2) * 0.6 + gradient * 0.4;
      img[x * N + y] *= 255;
    }
  }
  return img;
}

function paint(ctx: CanvasRenderingContext2D, values: Uint8ClampedArray) {
  const imgData = ctx.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    imgData.data[i * 4] = values[i];
    imgData.data[i * 4 + 1] = values[i];
    imgData.data[i * 4 + 2] = values[i];
    imgData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
}

export function initDctReconstruction(root: HTMLElement) {
  const origCanvas = root.querySelector<HTMLCanvasElement>('[data-canvas="original"]');
  const reconCanvas = root.querySelector<HTMLCanvasElement>('[data-canvas="reconstructed"]');
  const slider = root.querySelector<HTMLInputElement>('input[type="range"]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  if (!origCanvas || !reconCanvas || !slider) return;

  const origCtx = setupPixelCanvas(origCanvas, N, N, 10);
  const reconCtx = setupPixelCanvas(reconCanvas, N, N, 10);

  const img = testImage();
  const K = dctMatrix(N);
  const coeffs = forwardSeparable(img, K, N);

  const order = [...coeffs.keys()].sort((a, b) => Math.abs(coeffs[b]) - Math.abs(coeffs[a]));

  paint(origCtx, normalizeTo255(img));

  function render() {
    const keep = Number(slider!.value);
    const keepSet = new Set(order.slice(0, keep));
    const pruned = new Float64Array(N * N);
    for (let i = 0; i < N * N; i++) pruned[i] = keepSet.has(i) ? coeffs[i] : 0;
    const reconstructed = inverseSeparable(pruned, K, N);
    paint(reconCtx, normalizeTo255(reconstructed));

    if (readout) {
      const pct = Math.round((keep / (N * N)) * 100);
      readout.textContent = `Keeping ${keep} of ${N * N} DCT coefficients (${pct}%) — the rest are set to zero`;
    }
  }

  slider.addEventListener('input', render);
  render();
}

document.querySelectorAll<HTMLElement>('[data-widget="dct-reconstruction"]').forEach(initDctReconstruction);

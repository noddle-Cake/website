import { setupPixelCanvas } from '../canvas';
import { dctMatrix, hadamardMatrix, haarMatrix, normalizeTo255 } from '../transforms';

type KernelName = 'dct' | 'hadamard' | 'haar';

const KERNELS: Record<KernelName, (n: number) => Float64Array> = {
  dct: dctMatrix,
  hadamard: hadamardMatrix,
  haar: haarMatrix,
};

function basisImage(K: Float64Array, n: number, u: number, v: number): Float64Array {
  const img = new Float64Array(n * n);
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      img[x * n + y] = K[u * n + x] * K[v * n + y];
    }
  }
  return img;
}

export function initBasisGallery(root: HTMLElement) {
  const kernelName = (root.dataset.kernel ?? 'dct') as KernelName;
  const n = Number(root.dataset.size ?? 8);
  const grid = root.querySelector<HTMLElement>('[data-grid]');
  if (!grid) return;

  const K = KERNELS[kernelName](n);
  const cellPx = n >= 16 ? 5 : 9;

  grid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;

  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      const canvas = document.createElement('canvas');
      canvas.className = 'block';
      const ctx = setupPixelCanvas(canvas, n, n, cellPx);
      const img = basisImage(K, n, u, v);
      const display = normalizeTo255(img);
      const imgData = ctx.createImageData(n, n);
      for (let i = 0; i < n * n; i++) {
        imgData.data[i * 4] = display[i];
        imgData.data[i * 4 + 1] = display[i];
        imgData.data[i * 4 + 2] = display[i];
        imgData.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      grid.appendChild(canvas);
    }
  }
}

document.querySelectorAll<HTMLElement>('[data-widget="basis-gallery"]').forEach(initBasisGallery);

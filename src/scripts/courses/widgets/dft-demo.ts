import { setupPixelCanvas } from '../canvas';
import { dft2D, magnitude, logDisplayScale } from '../transforms';

const N = 16;

const PATTERNS: Record<string, (x: number, y: number) => number> = {
  'v-stripes': (x) => (Math.floor(x / 2) % 2 === 0 ? 1 : 0),
  'h-stripes': (_x, y) => (Math.floor(y / 2) % 2 === 0 ? 1 : 0),
  checkerboard: (x, y) => ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0 ? 1 : 0),
  dot: (x, y) => (Math.abs(x - N / 2) < 1.5 && Math.abs(y - N / 2) < 1.5 ? 1 : 0),
  diagonal: (x, y) => (Math.abs(x - y) < 1.5 || Math.abs(x + y - N) < 1.5 ? 1 : 0),
};

function paintGray(ctx: CanvasRenderingContext2D, values: Uint8ClampedArray, n: number) {
  const imgData = ctx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const g = values[i];
    imgData.data[i * 4] = g;
    imgData.data[i * 4 + 1] = g;
    imgData.data[i * 4 + 2] = g;
    imgData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
}

export function initDftDemo(root: HTMLElement) {
  const inputCanvas = root.querySelector<HTMLCanvasElement>('[data-canvas="input"]');
  const spectrumCanvas = root.querySelector<HTMLCanvasElement>('[data-canvas="spectrum"]');
  const patternButtons = root.querySelectorAll<HTMLButtonElement>('[data-pattern]');
  const centerToggle = root.querySelector<HTMLInputElement>('[data-center-toggle]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  if (!inputCanvas || !spectrumCanvas) return;

  const inCtx = setupPixelCanvas(inputCanvas, N, N, 10);
  const specCtx = setupPixelCanvas(spectrumCanvas, N, N, 10);

  let currentPattern = 'v-stripes';

  function render() {
    const fn = PATTERNS[currentPattern];
    const f = new Float64Array(N * N);
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) f[x * N + y] = fn(x, y) * 255;
    }
    paintGray(inCtx, Uint8ClampedArray.from(f), N);

    const centered = centerToggle?.checked ?? true;
    const spectrum = dft2D(f, N, centered);
    const mag = magnitude(spectrum);
    const display = logDisplayScale(mag);
    paintGray(specCtx, display, N);

    if (readout) {
      readout.textContent = centered
        ? 'DC component centered — multiplied f(x,y) by (−1)^(x+y) before transforming'
        : 'DC component in the corners — the raw DFT output order';
    }
  }

  patternButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentPattern = button.dataset.pattern ?? currentPattern;
      patternButtons.forEach((b) => b.classList.toggle('!border-slate-400', b === button));
      render();
    });
  });
  centerToggle?.addEventListener('change', render);

  patternButtons[0]?.classList.add('!border-slate-400');
  render();
}

document.querySelectorAll<HTMLElement>('[data-widget="dft-demo"]').forEach(initDftDemo);

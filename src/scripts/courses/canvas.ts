const redrawCallbacks = new Set<() => void>();
let observing = false;

function ensureObserver() {
  if (observing) return;
  observing = true;
  const observer = new MutationObserver(() => {
    for (const cb of redrawCallbacks) cb();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-signal'],
  });
}

/** Registers a redraw callback that reruns whenever the light/dark/signal theme changes. */
export function onThemeChange(cb: () => void) {
  ensureObserver();
  redrawCallbacks.add(cb);
}

export function themeColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
}

/** Sizes a canvas's backing store for the device pixel ratio and returns a scaled 2D context. */
export function setupCanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function clear(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number) {
  ctx.clearRect(0, 0, cssWidth, cssHeight);
}

/**
 * Sizes a canvas 1:1 in physical pixels for ImageData-based pixel work (putImageData
 * ignores the current transform, so DPR scaling via setupCanvas doesn't apply here).
 * CSS upscales the result; `pixelated` rendering keeps it crisp/blocky on purpose.
 */
export function setupPixelCanvas(canvas: HTMLCanvasElement, width: number, height: number, cssScale = 1): CanvasRenderingContext2D {
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width * cssScale}px`;
  canvas.style.height = `${height * cssScale}px`;
  canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return ctx;
}

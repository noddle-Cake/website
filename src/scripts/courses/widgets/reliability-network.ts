import { setupCanvas, themeColor, onThemeChange } from '../canvas';

/**
 * The homework reliability block diagram, live. Each block's success
 * probability is editable, and the reduction is shown one collapse at a time.
 */

interface Block {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const BLOCKS: Block[] = [
  { id: 'a1', x: 68, y: 30, w: 58, h: 26 },
  { id: 'a2', x: 68, y: 77, w: 58, h: 26 },
  { id: 'a3', x: 40, y: 124, w: 52, h: 26 },
  { id: 'a4', x: 100, y: 124, w: 52, h: 26 },
  { id: 'm', x: 196, y: 77, w: 52, h: 26 },
  { id: 'b1', x: 288, y: 40, w: 52, h: 26 },
  { id: 'b2', x: 350, y: 40, w: 52, h: 26 },
  { id: 'b3', x: 320, y: 112, w: 52, h: 26 },
];

const MAIN_Y = 90;
const LEFT_RAIL = 26;
const LEFT_JOIN = 170;
const RIGHT_SPLIT = 268;
const RIGHT_JOIN = 420;
const OUT = 444;

export function initReliabilityNetwork(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;

  const W = 460;
  const H = 180;
  const ctx = setupCanvas(canvas, W, H);

  const inputs = new Map<string, HTMLInputElement>();
  root.querySelectorAll<HTMLInputElement>('[data-block]').forEach((input) => {
    inputs.set(input.dataset.block ?? '', input);
  });

  const stepsEl = root.querySelector<HTMLElement>('[data-steps]');
  const totalEl = root.querySelector<HTMLElement>('[data-total]');

  const p = (id: string) => {
    const raw = Number(inputs.get(id)?.value ?? 0);
    return Math.min(1, Math.max(0, Number.isFinite(raw) ? raw : 0));
  };

  const series = (...ps: number[]) => ps.reduce((a, b) => a * b, 1);
  const parallel = (...ps: number[]) => 1 - ps.reduce((a, b) => a * (1 - b), 1);

  function wire(x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = themeColor('slate-600');
    ctx.lineWidth = 1.25;

    // Left parallel bank: rail in, three branches, rail out.
    wire(6, MAIN_Y, LEFT_RAIL, MAIN_Y);
    wire(LEFT_RAIL, 43, LEFT_RAIL, 137);
    wire(LEFT_JOIN, 43, LEFT_JOIN, 137);
    for (const [y, xa, xb] of [
      [43, 126, LEFT_JOIN],
      [90, 126, LEFT_JOIN],
      [137, 152, LEFT_JOIN],
    ] as Array<[number, number, number]>) {
      wire(xa, y, xb, y);
    }
    wire(LEFT_RAIL, 43, 68, 43);
    wire(LEFT_RAIL, 90, 68, 90);
    wire(LEFT_RAIL, 137, 40, 137);
    wire(92, 137, 100, 137);

    // Series block in the middle.
    wire(LEFT_JOIN, MAIN_Y, 196, MAIN_Y);
    wire(248, MAIN_Y, RIGHT_SPLIT, MAIN_Y);

    // Right parallel bank.
    wire(RIGHT_SPLIT, 53, RIGHT_SPLIT, 125);
    wire(RIGHT_JOIN, 53, RIGHT_JOIN, 125);
    wire(RIGHT_SPLIT, 53, 288, 53);
    wire(340, 53, 350, 53);
    wire(402, 53, RIGHT_JOIN, 53);
    wire(RIGHT_SPLIT, 125, 320, 125);
    wire(372, 125, RIGHT_JOIN, 125);
    wire(RIGHT_JOIN, MAIN_Y, OUT, MAIN_Y);

    ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const b of BLOCKS) {
      ctx.fillStyle = themeColor('slate-900');
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = themeColor('slate-100');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = themeColor('slate-100');
      ctx.fillText(p(b.id).toFixed(2), b.x + b.w / 2, b.y + b.h / 2 + 0.5);
    }

    const s1 = series(p('a3'), p('a4'));
    const left = parallel(p('a1'), p('a2'), s1);
    const s2 = series(p('b1'), p('b2'));
    const right = parallel(s2, p('b3'));
    const total = series(left, p('m'), right);

    if (stepsEl) {
      const lines = [
        `series bottom-left: ${p('a3').toFixed(2)} × ${p('a4').toFixed(2)} = ${s1.toFixed(4)}`,
        `parallel of the three left branches: 1 − (1−${p('a1').toFixed(2)})(1−${p('a2').toFixed(2)})(1−${s1.toFixed(4)}) = ${left.toFixed(4)}`,
        `series on the top-right branch: ${p('b1').toFixed(2)} × ${p('b2').toFixed(2)} = ${s2.toFixed(4)}`,
        `parallel on the right: 1 − (1−${s2.toFixed(4)})(1−${p('b3').toFixed(2)}) = ${right.toFixed(4)}`,
        `the three survivors are in series: ${left.toFixed(4)} × ${p('m').toFixed(2)} × ${right.toFixed(4)}`,
      ];
      stepsEl.textContent = '';
      for (const line of lines) {
        const li = document.createElement('li');
        li.textContent = line;
        stepsEl.appendChild(li);
      }
    }
    if (totalEl) totalEl.textContent = total.toFixed(4);
  }

  inputs.forEach((input) => input.addEventListener('input', draw));
  onThemeChange(draw);
  draw();
}

document
  .querySelectorAll<HTMLElement>('[data-widget="reliability-network"]')
  .forEach(initReliabilityNetwork);

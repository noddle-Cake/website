import { setupCanvas, themeColor, onThemeChange } from '../canvas';

/**
 * Two-stage tree: a coin call decides which die gets rolled, the die decides
 * the win. Walks the law of total probability branch by branch.
 */
export function initProbabilityTree(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const biasSlider = root.querySelector<HTMLInputElement>('[data-slider="bias"]');
  const diceA = root.querySelector<HTMLInputElement>('[data-slider="sidesA"]');
  const diceB = root.querySelector<HTMLInputElement>('[data-slider="sidesB"]');
  const strategy = root.querySelector<HTMLSelectElement>('[data-strategy]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  const verdict = root.querySelector<HTMLElement>('[data-verdict]');
  if (!canvas || !biasSlider || !diceA || !diceB || !strategy) return;

  const W = 460;
  const H = 250;
  const ctx = setupCanvas(canvas, W, H);

  const evenShare = (sides: number) => Math.floor(sides / 2) / sides;

  function callProbability(p: number): number {
    // p = P(heads). Calling the favoured face wins with max(p, 1-p).
    if (strategy!.value === 'favoured') return Math.max(p, 1 - p);
    if (strategy!.value === 'unfavoured') return Math.min(p, 1 - p);
    return 0.5; // always call heads on a coin you flip yourself
  }

  function label(x: number, y: number, text: string, color: string, align: CanvasTextAlign = 'center') {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  function draw() {
    const p = Number(biasSlider!.value) / 100;
    const sidesA = Number(diceA!.value);
    const sidesB = Number(diceB!.value);
    const q = callProbability(p);

    const eA = evenShare(sidesA);
    const eB = evenShare(sidesB);
    const total = q * eA + (1 - q) * eB;

    ctx.clearRect(0, 0, W, H);
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textBaseline = 'middle';

    const rootX = 30;
    const rootY = H / 2;
    const midX = 190;
    const leafX = 350;
    const ys = [55, 105, 155, 205];
    const midYs = [80, 180];

    const line = (x1: number, y1: number, x2: number, y2: number, weight: number) => {
      ctx.strokeStyle = themeColor('slate-600');
      ctx.lineWidth = 0.8 + weight * 3.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    line(rootX + 34, rootY, midX - 6, midYs[0], q);
    line(rootX + 34, rootY, midX - 6, midYs[1], 1 - q);
    line(midX + 44, midYs[0], leafX - 6, ys[0], q * eA);
    line(midX + 44, midYs[0], leafX - 6, ys[1], q * (1 - eA));
    line(midX + 44, midYs[1], leafX - 6, ys[2], (1 - q) * eB);
    line(midX + 44, midYs[1], leafX - 6, ys[3], (1 - q) * (1 - eB));

    const dim = themeColor('slate-400');
    const bright = themeColor('slate-100');

    label(rootX, rootY, 'flip', bright, 'left');
    label(midX + 20, midYs[0], `d${sidesA}`, bright);
    label(midX + 20, midYs[1], `d${sidesB}`, bright);

    label(105, midYs[0] - 16, `called it  ${q.toFixed(2)}`, dim);
    label(105, midYs[1] + 16, `missed  ${(1 - q).toFixed(2)}`, dim);

    label(268, ys[0] - 12, eA.toFixed(3), dim);
    label(268, ys[1] + 12, (1 - eA).toFixed(3), dim);
    label(268, ys[2] - 12, eB.toFixed(3), dim);
    label(268, ys[3] + 12, (1 - eB).toFixed(3), dim);

    const leaves: Array<[string, number, boolean]> = [
      ['even', q * eA, true],
      ['odd', q * (1 - eA), false],
      ['even', (1 - q) * eB, true],
      ['odd', (1 - q) * (1 - eB), false],
    ];
    leaves.forEach(([name, value, isWin], i) => {
      label(leafX, ys[i], name, isWin ? bright : dim, 'left');
      label(leafX + 42, ys[i], `= ${value.toFixed(4)}`, isWin ? bright : themeColor('slate-500'), 'left');
    });

    if (readout) {
      readout.textContent = `P(even) = ${q.toFixed(3)}·${eA.toFixed(3)} + ${(1 - q).toFixed(3)}·${eB.toFixed(3)} = ${total.toFixed(4)}`;
    }
    if (verdict) {
      const diff = eA - eB;
      if (Math.abs(diff) < 1e-9) {
        verdict.textContent =
          'Both dice give the same chance of an even roll, so the coin does not matter at all — P(even) is fixed no matter how the call goes.';
      } else if (diff > 0) {
        verdict.textContent =
          'The reward die is the better one here, so anything that raises your chance of calling the flip correctly raises P(even). A known bias is an advantage.';
      } else {
        verdict.textContent =
          'The reward die is the worse one here: calling correctly hurts you. A known bias only helps if you use it to call the flip WRONG on purpose.';
      }
    }
  }

  [biasSlider, diceA, diceB].forEach((s) => s.addEventListener('input', draw));
  strategy.addEventListener('change', draw);
  root.querySelectorAll<HTMLElement>('[data-shows]').forEach((el) => {
    const name = el.dataset.shows ?? '';
    const source = root.querySelector<HTMLInputElement>(`[data-slider="${name}"]`);
    if (!source) return;
    const render = () => {
      el.textContent = name === 'bias' ? (Number(source.value) / 100).toFixed(2) : source.value;
    };
    source.addEventListener('input', render);
    render();
  });

  onThemeChange(draw);
  draw();
}

document
  .querySelectorAll<HTMLElement>('[data-widget="probability-tree"]')
  .forEach(initProbabilityTree);

import { setupCanvas, themeColor, onThemeChange } from '../canvas';

/**
 * Two-attribute contingency table driven by the three numbers a word problem
 * usually hands you: P(A), P(B), and one conditional. Everything else in the
 * table — joints, the other conditionals, the independence check — follows.
 */
export function initContingencyTable(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const sliders = {
    a: root.querySelector<HTMLInputElement>('[data-slider="a"]'),
    b: root.querySelector<HTMLInputElement>('[data-slider="b"]'),
    cond: root.querySelector<HTMLInputElement>('[data-slider="cond"]'),
  };
  if (!canvas || !sliders.a || !sliders.b || !sliders.cond) return;

  const W = 260;
  const H = 220;
  const ctx = setupCanvas(canvas, W, H);

  const cell = (id: string) => root.querySelector<HTMLElement>(`[data-cell="${id}"]`);
  const warning = root.querySelector<HTMLElement>('[data-warning]');
  const verdict = root.querySelector<HTMLElement>('[data-verdict]');

  const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : '—');

  function draw() {
    const pA = Number(sliders.a!.value) / 100; // likes mangoes
    const pB = Number(sliders.b!.value) / 100; // likes coconuts
    const pNotB_given_notA = Number(sliders.cond!.value) / 100;

    const pNotA = 1 - pA;
    const pNotB = 1 - pB;

    const nn = pNotB_given_notA * pNotA; // P(A' ∩ B')
    const yn = pNotB - nn; // P(A ∩ B')
    const yy = pA - yn; // P(A ∩ B)
    const ny = pB - yy; // P(A' ∩ B)

    const valid = [nn, yn, yy, ny].every((v) => v >= -1e-9);

    cell('yy')!.textContent = fmt(yy);
    cell('yn')!.textContent = fmt(yn);
    cell('ny')!.textContent = fmt(ny);
    cell('nn')!.textContent = fmt(nn);
    cell('rowA')!.textContent = fmt(pA);
    cell('rowNotA')!.textContent = fmt(pNotA);
    cell('colB')!.textContent = fmt(pB);
    cell('colNotB')!.textContent = fmt(pNotB);
    cell('product')!.textContent = fmt(pA * pB);
    cell('joint')!.textContent = fmt(yy);
    cell('aGivenNotB')!.textContent = pNotB > 0 ? fmt(yn / pNotB) : '—';
    cell('bGivenA')!.textContent = pA > 0 ? fmt(yy / pA) : '—';

    if (warning) {
      warning.hidden = valid;
      warning.textContent = valid
        ? ''
        : 'These three numbers are inconsistent — one of the joint probabilities came out negative. No such population exists.';
    }

    if (verdict) {
      const gap = Math.abs(yy - pA * pB);
      if (!valid) {
        verdict.textContent = '';
      } else if (gap < 5e-4) {
        verdict.textContent = 'P(A ∩ B) = P(A)·P(B) → the two attributes are independent.';
      } else {
        verdict.textContent = `P(A ∩ B) ≠ P(A)·P(B) (off by ${gap.toFixed(4)}) → dependent. Knowing one shifts the odds of the other.`;
      }
    }

    // Mosaic: columns are split by P(A), rows within each column by the conditional.
    ctx.clearRect(0, 0, W, H);
    if (!valid) return;

    const pad = 28;
    const boxW = W - pad - 8;
    const boxH = H - pad - 8;
    const colA = boxW * pA;

    const shareBgivenA = pA > 0 ? yy / pA : 0;
    const shareBgivenNotA = pNotA > 0 ? ny / pNotA : 0;

    const strong = themeColor('slate-600');
    const weak = themeColor('slate-800');

    const cols: Array<[number, number, number]> = [
      [pad, colA, shareBgivenA],
      [pad + colA, boxW - colA, shareBgivenNotA],
    ];
    for (const [x, w, share] of cols) {
      ctx.fillStyle = strong;
      ctx.fillRect(x, pad, w, boxH * share);
      ctx.fillStyle = weak;
      ctx.fillRect(x, pad + boxH * share, w, boxH * (1 - share));
      ctx.strokeStyle = themeColor('slate-950');
      ctx.lineWidth = 2;
      ctx.strokeRect(x, pad, w, boxH);
    }

    // Dashed guide at the overall P(B) height — the columns line up with it
    // exactly when the attributes are independent.
    ctx.strokeStyle = themeColor('slate-100');
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(pad - 6, pad + boxH * pB);
    ctx.lineTo(pad + boxW + 6, pad + boxH * pB);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = themeColor('slate-400');
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A', pad + colA / 2, pad - 10);
    ctx.fillText('Aᶜ', pad + colA + (boxW - colA) / 2, pad - 10);
    ctx.save();
    ctx.translate(12, pad + boxH * 0.25);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('B', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(12, pad + boxH * 0.78);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Bᶜ', 0, 0);
    ctx.restore();
  }

  Object.values(sliders).forEach((s) => s!.addEventListener('input', draw));
  onThemeChange(draw);
  draw();
}

document
  .querySelectorAll<HTMLElement>('[data-widget="contingency-table"]')
  .forEach(initContingencyTable);

import { setupCanvas, themeColor, onThemeChange } from '../canvas';
import { combinations, formatCount, formatProbability } from '../combinatorics';

/**
 * Sequences of length n over an alphabet of size k, broken down by how many
 * positions hold the symbol "0". The "at most m" cumulative is the shaded part.
 */
export function initCountingLab(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const nSlider = root.querySelector<HTMLInputElement>('[data-slider="n"]');
  const kSlider = root.querySelector<HTMLInputElement>('[data-slider="k"]');
  const mSlider = root.querySelector<HTMLInputElement>('[data-slider="m"]');
  if (!canvas || !nSlider || !kSlider || !mSlider) return;

  const W = 440;
  const H = 205;
  const ctx = setupCanvas(canvas, W, H);

  const out = (id: string) => root.querySelector<HTMLElement>(`[data-out="${id}"]`);

  function draw() {
    const n = Number(nSlider!.value);
    const k = Number(kSlider!.value);
    mSlider!.max = String(n);
    const m = Math.min(Number(mSlider!.value), n);

    // counts[j] = sequences with exactly j zeros = C(n, j) · (k-1)^(n-j)
    const counts: number[] = [];
    for (let j = 0; j <= n; j++) {
      counts.push(combinations(n, j) * Math.pow(k - 1, n - j));
    }
    const total = Math.pow(k, n);
    const atMost = counts.slice(0, m + 1).reduce((a, b) => a + b, 0);

    out('total')!.textContent = `${k}^${n} = ${formatCount(total)}`;
    out('atmost')!.textContent = formatCount(atMost);
    out('prob')!.textContent = formatProbability(atMost / total);
    const terms = counts.slice(0, m + 1);
    const symbolic = terms
      .map((_, j) => (k === 2 ? `C(${n},${j})` : `C(${n},${j})·${k - 1}^${n - j}`))
      .join(' + ');
    const numeric = terms.map((c) => formatCount(c)).join(' + ');
    out('breakdown')!.textContent = `${symbolic}  =  ${numeric}  =  ${formatCount(atMost)}`;
    out('mvalue')!.textContent = String(m);
    out('nvalue')!.textContent = String(n);
    out('kvalue')!.textContent = String(k);

    ctx.clearRect(0, 0, W, H);
    const padL = 34;
    const padB = 38;
    const padT = 10;
    const plotW = W - padL - 10;
    const plotH = H - padB - padT;
    const maxCount = Math.max(...counts, 1);
    const barW = plotW / (n + 1);

    counts.forEach((c, j) => {
      const h = (c / maxCount) * plotH;
      const x = padL + j * barW;
      ctx.fillStyle = j <= m ? themeColor('slate-500') : themeColor('slate-800');
      ctx.fillRect(x + barW * 0.12, padT + plotH - h, barW * 0.76, h);
    });

    ctx.strokeStyle = themeColor('slate-700');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH + 0.5);
    ctx.lineTo(padL + plotW, padT + plotH + 0.5);
    ctx.stroke();

    ctx.fillStyle = themeColor('slate-400');
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const step = n > 16 ? 4 : n > 8 ? 2 : 1;
    counts.forEach((_, j) => {
      if (j % step !== 0) return;
      ctx.fillText(String(j), padL + j * barW + barW / 2, padT + plotH + 5);
    });
    ctx.textAlign = 'left';
    ctx.fillText('zeros in the sequence', padL, padT + plotH + 5 + 12);
    ctx.save();
    ctx.translate(11, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('# sequences', 0, 0);
    ctx.restore();
  }

  [nSlider, kSlider, mSlider].forEach((s) => s.addEventListener('input', draw));
  onThemeChange(draw);
  draw();
}

document.querySelectorAll<HTMLElement>('[data-widget="counting-lab"]').forEach(initCountingLab);

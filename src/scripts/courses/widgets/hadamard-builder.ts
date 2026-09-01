import { hadamardSignMatrix, sequencyOrder } from '../transforms';

export function initHadamardBuilder(root: HTMLElement) {
  const grid = root.querySelector<HTMLElement>('[data-grid]');
  const orderButtons = root.querySelectorAll<HTMLButtonElement>('[data-order]');
  const sequencyToggle = root.querySelector<HTMLInputElement>('[data-sequency-toggle]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  if (!grid) return;

  let n = 8;

  function render() {
    let H = hadamardSignMatrix(n);
    if (sequencyToggle?.checked) H = sequencyOrder(H, n);

    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    for (let i = 0; i < n * n; i++) {
      const cell = document.createElement('div');
      cell.className =
        H[i] > 0
          ? 'aspect-square bg-slate-100'
          : 'aspect-square bg-slate-900';
      grid.appendChild(cell);
    }

    if (readout) {
      readout.textContent = `H${n} — ${sequencyToggle?.checked ? 'sequency (zero-crossing) order' : 'natural order'}, entries are +1 (light) / −1 (dark)`;
    }
  }

  orderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      n = Number(button.dataset.order ?? 8);
      orderButtons.forEach((b) => b.classList.toggle('!border-slate-400', b === button));
      render();
    });
  });
  sequencyToggle?.addEventListener('change', render);

  orderButtons.forEach((b) => b.classList.toggle('!border-slate-400', Number(b.dataset.order) === n));
  render();
}

document.querySelectorAll<HTMLElement>('[data-widget="hadamard-builder"]').forEach(initHadamardBuilder);

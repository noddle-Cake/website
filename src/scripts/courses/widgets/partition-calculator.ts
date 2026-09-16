import { combinations, factorial, formatCount, formatProbability } from '../combinatorics';

/**
 * Splitting n people (u of them "marked") into g groups, and the odds that the
 * marked ones land one per group — first with equal-size groups, then with any
 * sizes as long as no group is empty.
 */

/** Number of ways to place n distinct items into g distinct non-empty groups. */
export function surjections(n: number, g: number): number {
  let acc = 0;
  for (let i = 0; i <= g; i++) {
    acc += (i % 2 === 0 ? 1 : -1) * combinations(g, i) * Math.pow(g - i, n);
  }
  return acc;
}

export function initPartitionCalculator(root: HTMLElement) {
  const inputs = {
    n: root.querySelector<HTMLInputElement>('[data-input="n"]'),
    u: root.querySelector<HTMLInputElement>('[data-input="u"]'),
    g: root.querySelector<HTMLInputElement>('[data-input="g"]'),
  };
  if (!inputs.n || !inputs.u || !inputs.g) return;

  const out = (id: string) => root.querySelector<HTMLElement>(`[data-out="${id}"]`);

  function update() {
    const n = Math.max(1, Math.min(30, Math.round(Number(inputs.n!.value) || 0)));
    const g = Math.max(1, Math.min(n, Math.round(Number(inputs.g!.value) || 1)));
    const u = Math.max(0, Math.min(n, Math.round(Number(inputs.u!.value) || 0)));

    const divisible = n % g === 0;
    const s = n / g;

    out('sizes')!.textContent = divisible
      ? `${g} groups of ${s}`
      : `${n} does not divide evenly into ${g} groups`;

    if (divisible) {
      // n! / (s!)^g labeled, ÷ g! if the groups are interchangeable.
      let labeled = factorial(n);
      for (let i = 0; i < g; i++) labeled /= factorial(s);
      out('labeled')!.textContent = formatCount(labeled);
      out('unlabeled')!.textContent = formatCount(labeled / factorial(g));
    } else {
      out('labeled')!.textContent = '—';
      out('unlabeled')!.textContent = '—';
    }

    // Equal groups: place the marked people one at a time and demand a fresh group each time.
    let pEqual = 0;
    if (divisible && u <= g) {
      pEqual = 1;
      for (let i = 0; i < u; i++) {
        pEqual *= (s * (g - i)) / (n - i);
      }
    }
    out('pEqual')!.textContent = divisible
      ? u <= g
        ? formatProbability(pEqual)
        : '0  (more marked people than groups)'
      : '—';
    out('pEqualChain')!.textContent =
      divisible && u <= g
        ? Array.from({ length: u }, (_, i) => `${s * (g - i)}/${n - i}`).join(' · ')
        : '';

    // Any non-empty sizes: one marked person per group is only possible when the
    // counts match, and then the unmarked ones are free to go anywhere.
    const surjTotal = surjections(n, g);
    out('surj')!.textContent = formatCount(surjTotal);
    if (u !== g) {
      out('pAny')!.textContent = '0  (one per group needs exactly as many marked people as groups)';
    } else if (surjTotal > 0) {
      out('pAny')!.textContent = formatProbability((factorial(g) * Math.pow(g, n - u)) / surjTotal);
    } else {
      out('pAny')!.textContent = '—';
    }
  }

  Object.values(inputs).forEach((input) => input!.addEventListener('input', update));
  update();
}

document
  .querySelectorAll<HTMLElement>('[data-widget="partition-calculator"]')
  .forEach(initPartitionCalculator);

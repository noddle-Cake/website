/** Shared counting helpers for the probability widgets. */

export function factorial(n: number): number {
  let acc = 1;
  for (let i = 2; i <= n; i++) acc *= i;
  return acc;
}

/** n! / (n - r)! — ordered selections. */
export function permutations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  let acc = 1;
  for (let i = 0; i < r; i++) acc *= n - i;
  return acc;
}

/** Binomial coefficient, built multiplicatively to stay exact as long as possible. */
export function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  const k = Math.min(r, n - r);
  let acc = 1;
  for (let i = 1; i <= k; i++) acc = (acc * (n - k + i)) / i;
  return Math.round(acc);
}

/** Formats a count with thousands separators, falling back to scientific notation. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  if (Math.abs(value) >= 1e15) return value.toExponential(4);
  return Math.round(value).toLocaleString('en-US');
}

export function formatProbability(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 1e-4) return value.toExponential(3);
  return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

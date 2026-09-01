// Shared linear-algebra + transform math for the Image Processing course widgets.
// All matrices are flat row-major Float64Array(N*N); all "images" are flat Float64Array(N*N).

export function zeros(n: number): Float64Array {
  return new Float64Array(n);
}

export function matMul(a: Float64Array, b: Float64Array, n: number): Float64Array {
  const out = zeros(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += a[i * n + k] * b[k * n + j];
      out[i * n + j] = sum;
    }
  }
  return out;
}

export function transpose(a: Float64Array, n: number): Float64Array {
  const out = zeros(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out[j * n + i] = a[i * n + j];
  return out;
}

/** T = K f K^T for a real separable orthogonal kernel K (the general form from the lecture notes). */
export function forwardSeparable(f: Float64Array, K: Float64Array, n: number): Float64Array {
  const Kt = transpose(K, n);
  return matMul(matMul(K, f, n), Kt, n);
}

/** f = K^T T K, i.e. the inverse of forwardSeparable for an orthonormal K. */
export function inverseSeparable(T: Float64Array, K: Float64Array, n: number): Float64Array {
  const Kt = transpose(K, n);
  return matMul(matMul(Kt, T, n), K, n);
}

/** Discrete Cosine Transform kernel matrix (the g(x,u) from the notes), size N. */
export function dctMatrix(n: number): Float64Array {
  const K = zeros(n * n);
  for (let u = 0; u < n; u++) {
    const tau = u === 0 ? Math.sqrt(1 / n) : Math.sqrt(2 / n);
    for (let x = 0; x < n; x++) {
      K[u * n + x] = tau * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * n));
    }
  }
  return K;
}

/** Recursive Hadamard matrix H_{2N} = 1/sqrt(2) * [[H_N, H_N], [H_N, -H_N]], normalized/orthonormal. */
export function hadamardMatrix(n: number): Float64Array {
  if (n === 1) return Float64Array.from([1]);
  if (n & (n - 1)) throw new Error('Hadamard order must be a power of 2');
  let H = Float64Array.from([1]);
  let size = 1;
  while (size < n) {
    const next = size * 2;
    const out = zeros(next * next);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const v = H[i * size + j] / Math.SQRT2;
        out[i * next + j] = v;
        out[i * next + (j + size)] = v;
        out[(i + size) * next + j] = v;
        out[(i + size) * next + (j + size)] = -v;
      }
    }
    H = out;
    size = next;
  }
  return H;
}

/** Un-normalized Hadamard sign matrix (entries are +1/-1) — useful for teaching sequency before normalizing. */
export function hadamardSignMatrix(n: number): Float64Array {
  const H = hadamardMatrix(n);
  const scale = Math.sqrt(n);
  const out = zeros(n * n);
  for (let i = 0; i < n * n; i++) out[i] = Math.round(H[i] * scale);
  return out;
}

/** Reorders a natural-order Hadamard matrix's rows into sequency (zero-crossing) order. */
export function sequencyOrder(H: Float64Array, n: number): Float64Array {
  const rows: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) row.push(H[i * n + j]);
    rows.push(row);
  }
  const crossings = rows.map((row) => {
    let c = 0;
    for (let k = 1; k < row.length; k++) if (Math.sign(row[k]) !== Math.sign(row[k - 1])) c++;
    return c;
  });
  const order = rows.map((_, i) => i).sort((a, b) => crossings[a] - crossings[b]);
  const out = zeros(n * n);
  order.forEach((origRow, newRow) => {
    for (let j = 0; j < n; j++) out[newRow * n + j] = H[origRow * n + j];
  });
  return out;
}

/** Recursive Haar transform matrix, size N = 2^k, orthonormal rows. */
export function haarMatrix(n: number): Float64Array {
  if (n === 1) return Float64Array.from([1]);
  if (n & (n - 1)) throw new Error('Haar order must be a power of 2');

  function build(size: number): number[][] {
    if (size === 1) return [[1]];
    const prev = build(size / 2);
    const rows: number[][] = [];
    for (const row of prev) {
      const upsampled: number[] = [];
      for (const v of row) upsampled.push(v / Math.SQRT2, v / Math.SQRT2);
      rows.push(upsampled);
    }
    const half = size / 2;
    for (let i = 0; i < half; i++) {
      const row = new Array(size).fill(0);
      row[2 * i] = 1 / Math.SQRT2;
      row[2 * i + 1] = -1 / Math.SQRT2;
      rows.push(row);
    }
    return rows;
  }

  const rows = build(n);
  const out = zeros(n * n);
  rows.forEach((row, i) => row.forEach((v, j) => (out[i * n + j] = v)));
  return out;
}

export interface Complex2D {
  re: Float64Array;
  im: Float64Array;
}

/** Naive O(N^4) 2-D DFT — fine for the small N (<=32) used in these teaching widgets. */
export function dft2D(f: Float64Array, n: number, centered: boolean): Complex2D {
  const re = zeros(n * n);
  const im = zeros(n * n);
  const src = zeros(n * n);
  for (let i = 0; i < n * n; i++) {
    const x = Math.floor(i / n);
    const y = i % n;
    src[i] = centered && (x + y) % 2 !== 0 ? -f[i] : f[i];
  }

  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      let sumRe = 0;
      let sumIm = 0;
      for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
          const angle = (-2 * Math.PI * (u * x + v * y)) / n;
          const val = src[x * n + y];
          sumRe += val * Math.cos(angle);
          sumIm += val * Math.sin(angle);
        }
      }
      re[u * n + v] = sumRe / n;
      im[u * n + v] = sumIm / n;
    }
  }
  return { re, im };
}

export function magnitude(c: Complex2D): Float64Array {
  const out = zeros(c.re.length);
  for (let i = 0; i < c.re.length; i++) out[i] = Math.hypot(c.re[i], c.im[i]);
  return out;
}

/** D(u,v) = log(1 + |F(u,v)|) display scaling from the lecture notes, normalized to [0, 255]. */
export function logDisplayScale(mag: Float64Array): Uint8ClampedArray {
  const logged = new Float64Array(mag.length);
  let max = 0;
  for (let i = 0; i < mag.length; i++) {
    logged[i] = Math.log(1 + mag[i]);
    if (logged[i] > max) max = logged[i];
  }
  const out = new Uint8ClampedArray(mag.length);
  for (let i = 0; i < mag.length; i++) out[i] = max > 0 ? Math.round((logged[i] / max) * 255) : 0;
  return out;
}

export function normalizeTo255(values: Float64Array): Uint8ClampedArray {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const out = new Uint8ClampedArray(values.length);
  for (let i = 0; i < values.length; i++) out[i] = Math.round(((values[i] - min) / range) * 255);
  return out;
}

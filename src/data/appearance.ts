// The site has one look — the surreal dreamscape — in one of several color palettes, picked at
// random on each visit (browser tab session) so pages within a visit stay consistent but each new
// visit gets new colors. Colors live in src/styles/palettes.css (one block per id).
export const palettes = [
  { id: 'magritte', name: 'Magritte' },
  { id: 'dali', name: 'Dalí' },
  { id: 'dechirico', name: 'de Chirico' },
  { id: 'carrington', name: 'Carrington' },
  { id: 'gruvbox', name: 'Gruvbox' },
] as const;

export type PaletteId = (typeof palettes)[number]['id'];

/** The palette shown when JS is off (otherwise it's random). */
export const DEFAULT_PALETTE: PaletteId = 'magritte';

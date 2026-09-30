// How the site can look. Two independent choices:
//
//   look     — the overall design, saved per visitor. "surreal" is the dreamscape; "minimal" is
//              a stark, monochrome, all-caps mono version (inspired by yeezy.com). Minimal styles
//              live in src/styles/look-minimal.css and ignore the palette.
//   palette  — the color scheme used by the surreal look, picked at random on each visit (the
//              picker can change it for the rest of that visit). Colors live in
//              src/styles/palettes.css (one block per id).
export const looks = [
  { id: 'surreal', name: 'Surreal' },
  { id: 'minimal', name: 'Minimal' },
] as const;

export const palettes = [
  { id: 'magritte', name: 'Magritte' },
  { id: 'dali', name: 'Dalí' },
  { id: 'dechirico', name: 'de Chirico' },
  { id: 'carrington', name: 'Carrington' },
  { id: 'gruvbox', name: 'Gruvbox' },
] as const;

export type LookId = (typeof looks)[number]['id'];
export type PaletteId = (typeof palettes)[number]['id'];

/** What a first-time visitor sees (and what's used when JS is off — otherwise the palette is random). */
export const DEFAULT_LOOK: LookId = 'surreal';
export const DEFAULT_PALETTE: PaletteId = 'magritte';

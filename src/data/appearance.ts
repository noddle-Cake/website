// How the site can look. Two independent choices, each picked at random on every visit (the
// footer controls change them for the rest of that visit):
//
//   look     — the overall design. "surreal" is the dreamscape; "minimal" is a stark,
//              monochrome, all-caps mono version (inspired by yeezy.com) whose styles live in
//              src/styles/look-minimal.css and ignore the palette; "lucid" is minimal's layout
//              inside the surreal world (src/styles/look-lucid.css).
//   palette  — the color scheme used by the surreal and lucid looks. Colors live in
//              src/styles/palettes.css (one block per id).
export const looks = [
  { id: 'surreal', name: 'Surreal' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'lucid', name: 'Lucid' },
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

/** What's shown when JS is off (otherwise both are picked at random). */
export const DEFAULT_LOOK: LookId = 'surreal';
export const DEFAULT_PALETTE: PaletteId = 'magritte';

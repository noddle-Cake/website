// How the site can look. Two independent choices:
//
//   look     — the overall design, saved per visitor (surreal until they pick another). "surreal" is the dreamscape; "minimal" is a stark,
//              monochrome, all-caps mono version (inspired by yeezy.com) whose styles live in
//              src/styles/look-minimal.css and ignore the palette; "lucid" is minimal's layout
//              inside the surreal world (src/styles/look-lucid.css).
//   palette  — the color scheme used by the surreal and lucid looks, picked at random on each
//              visit (the footer picker changes it for the rest of that visit). Colors live in
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

/** The look every visitor starts on, and the palette shown when JS is off (otherwise it's random). */
export const DEFAULT_LOOK: LookId = 'surreal';
export const DEFAULT_PALETTE: PaletteId = 'magritte';

// Screenshots for the projects that have one, keyed by content id. Projects without an entry fall
// back to their `highlight` figure wherever a picture would go.
import gridmerge from '../assets/gallery/gridmerge.webp';
import oncora from '../assets/gallery/oncora.webp';

export interface ProjectShot {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export const projectMedia: Record<string, ProjectShot> = {
  // Stills from the demo recordings (public/demos/<name>/).
  'fudi-eats': {
    src: '/demos/fudi/still-m.webp',
    width: 590,
    height: 1282,
    alt: 'Fudi Eats app on an iPhone: dishes from home cooks nearby',
  },
  grantit: {
    src: '/demos/grantit/still.webp',
    width: 1280,
    height: 800,
    alt: 'Grantit applications board and spending-by-category chart for a demo nonprofit',
  },
  'vas-inventory-platform': {
    src: '/vas-demo/new/unreconciled-dashboard.jpg',
    width: 1384,
    height: 868,
    alt: 'VAS dashboard of purchase orders received but not yet reconciled',
  },
  gridmerge: {
    src: gridmerge.src,
    width: gridmerge.width,
    height: gridmerge.height,
    alt: 'GridMerge map of planned U.S. grid projects, colored by utility',
  },
  oncora: {
    src: oncora.src,
    width: oncora.width,
    height: oncora.height,
    alt: 'Oncora compound input, with the steps from structure to targets, cell lines and evidence',
  },
};

/**
 * Short looping recordings of the live demos, keyed by content id: each value is the clip's name
 * under public/demos/ and in src/data/demoClips.json. They play in place of the screenshot.
 * Re-record with `npm run record-demos` (scripts/demo-clips/record.mjs).
 */
export const projectClips: Record<string, string> = {
  oncora: 'oncora',
  gridmerge: 'gridmerge',
  'vas-inventory-platform': 'vas',
  grantit: 'grantit',
  'fudi-eats': 'fudi',
};

/** "GridMerge — Grid Project Coordination Map" → ["GridMerge", "Grid Project Coordination Map"]. */
export function splitTitle(title: string): [name: string, descriptor: string] {
  const [name, ...rest] = title.split(' — ');
  return [name, rest.join(' — ')];
}

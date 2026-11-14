// Fudi Eats, a Flutter phone app with no web version. Its site (fudieats.app) plays a tour of the app
// in a phone: the buyer side on the home page, the seller side on /sell. Each chapter records one tour
// as it autoplays (clicking its tabs would stop the autoplay), cropped to the phone's screen. The
// screens slide sideways inside it, so the crop is the fixed viewport (.tour-device), not a screen.
// Phone only; the recorded screens include the app's own status bar. See ../record.mjs.

const device = (p) => p.locator('.tour-device').first();

/** A chapter that records `ms` of the tour on `path`. */
function tour(id, label, path, ms) {
  return {
    id,
    label,
    path,
    async ready(p) {
      await device(p).waitFor({ timeout: 60000 });
      await device(p).scrollIntoViewIfNeeded();
    },
    settle: 400,
    crop: (p) => device(p).boundingBox(),
    async mobile(d) {
      await d.hold(ms);
    },
  };
}

export default {
  url: 'https://fudieats.app',
  phone: 'crop',
  statusBar: false,
  poster: { chapter: 'buying', at: 0 },
  chapters: [tour('buying', 'Buying', '/', 25000), tour('selling', 'Selling', '/sell', 25000)],
};

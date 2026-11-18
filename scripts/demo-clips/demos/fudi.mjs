// Fudi Eats, a Flutter phone app with no web version. Its site (fudieats.app) plays a tour of the app
// in a phone: the buyer side on the home page, the seller side on /sell. Each chapter records one loop
// of a tour as it autoplays (clicking its tabs would stop the autoplay), from one restart to the next,
// cropped to the phone's screen. The screens slide sideways inside it, so the crop is the fixed
// viewport (.tour-device), not a screen. Phone only; the recorded screens include the app's own status
// bar. See ../record.mjs.

const device = (p) => p.locator('.tour-device').first();

/**
 * Resolves when the tour starts its next loop. At the end of each loop the site's script goes back to
 * the first screen, scrolls it to the top, then puts every other screen back at the top as well. Within
 * a loop those other screens only ever scroll down (the first one can scroll back up mid-loop, as on
 * /sell), so their scroll positions all returning to 0 marks the restart.
 */
const nextLoop = (p) =>
  device(p).evaluate(
    (el) =>
      new Promise((resolve, reject) => {
        const others = [...el.querySelectorAll('.tour-screen')].slice(1).map((s) => s.querySelector('.tour-scroll'));
        const timeout = setTimeout(() => reject(new Error('the tour did not restart within 60s')), 60000);
        let scrolled = false;
        const tick = () => {
          const total = others.reduce((sum, s) => sum + s.scrollTop, 0);
          if (total > 0) scrolled = true;
          else if (scrolled) return clearTimeout(timeout), resolve();
          requestAnimationFrame(tick);
        };
        tick();
      }),
  );

/** A chapter that records one loop of the tour on `path`. */
function tour(id, label, path) {
  return {
    id,
    label,
    path,
    async ready(p) {
      await device(p).waitFor({ timeout: 60000 });
      // The site's sticky header would sit over the phone's top once it is scrolled up to the top of
      // the frame (it has to be: the screencast doesn't capture the bottom of the viewport).
      await device(p).evaluate((el) => {
        for (const e of document.querySelectorAll('body *')) {
          if (!el.contains(e) && ['fixed', 'sticky'].includes(getComputedStyle(e).position)) e.style.visibility = 'hidden';
        }
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollBy(0, el.getBoundingClientRect().top - 16);
      });
      // Start on the tour's first screen, in the pause it opens each loop with (1.5s).
      await nextLoop(p);
    },
    settle: 100,
    crop: (p) => device(p).boundingBox(),
    async mobile(d) {
      await nextLoop(d.page);
    },
  };
}

export default {
  url: 'https://fudieats.app',
  phone: 'crop',
  statusBar: false,
  poster: { chapter: 'buying', at: 0 },
  chapters: [tour('buying', 'Buying', '/'), tour('selling', 'Selling', '/sell')],
};

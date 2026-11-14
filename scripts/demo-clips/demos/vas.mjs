// VAS inventory platform (demo.joseyandco.com). The demo resets nightly with new mock data, so
// chapters pick rows by shape (e.g. "a PO with several lines"), never by a specific number.
// See ../record.mjs for the helpers on `d`.

/** The first PO link in the reconciling list, preferring an order with a few lines. */
async function richPO(p) {
  const href = await p.evaluate(() => {
    const links = [...document.querySelectorAll('a[href^="/po/"]')];
    const rich = links.find((a) => /\b([3-9]|\d\d) lines\b/.test(a.parentElement?.parentElement?.textContent ?? ''));
    return (rich ?? links[0])?.getAttribute('href');
  });
  return p.locator(`a[href="${href}"]`).first();
}

/** A tab by the start of its label ("Sold below cost 10"); plain text matching would also hit prose. */
const tab = (p, name) => p.locator('[role=tab], button, a').filter({ hasText: new RegExp(`^\\s*${name}`) }).first();

export default {
  url: 'https://demo.joseyandco.com',
  poster: { chapter: 'reconcile', at: 0.45 },
  chapters: [
    {
      id: 'reconcile',
      label: 'Reconciling',
      path: '/reconcile',
      ready: (p) => p.locator('a[href^="/po/"]').first().waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(700);
        await d.hover(p.getByText(/Open POs/).first());
        await d.hold(500);
        await d.click(await richPO(p), 900);
        await p.getByText('What was ordered').waitFor({ timeout: 30000 });
        await d.hold(1300);
        await d.hover(p.locator('th', { hasText: /^margin$/i }).first(), 900);
        await d.hold(1800);
      },
      async mobile(d) {
        const p = d.page;
        await d.hold(900);
        await d.scroll(420, 900);
        await d.hold(500);
        await d.click(await richPO(p));
        await p.getByText('What was ordered').waitFor({ timeout: 30000 });
        await d.hold(1200);
        await d.scroll(520, 1100);
        await d.hold(1600);
      },
    },
    {
      id: 'pricing',
      label: 'Price review',
      path: '/price-review',
      ready: (p) => p.getByText('Gross profit').first().waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(700);
        await d.hover(p.getByText('Gross profit').first(), 800);
        await d.hold(900);
        await d.click(tab(p, 'Sold below cost'), 800);
        await d.hold(1800);
        await d.click(tab(p, 'Cost changes'), 700);
        await d.hold(2000);
      },
      async mobile(d) {
        const p = d.page;
        await d.hold(900);
        await d.scroll(360, 900);
        await d.hold(1000);
        await d.scroll(-360, 700);
        await d.click(tab(p, 'Sold below cost'));
        await d.hold(1300);
        await d.scroll(380, 900);
        await d.hold(1400);
      },
    },
    {
      id: 'map',
      label: 'Warehouse map',
      path: '/showroom-map',
      ready: (p) => p.getByPlaceholder(/Part number, barcode/).waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(600);
        await d.click(p.getByPlaceholder(/Part number, barcode/), 800);
        await d.type('peat moss', 90);
        await d.hold(1800);
        await d.click(p.getByRole('button', { name: 'Value', exact: true }), 800);
        await d.hold(1400);
        await d.hover(p.getByText(/matching shelves/).first(), 800);
        await d.hold(1500);
      },
      async mobile(d) {
        const p = d.page;
        await d.hold(700);
        await d.click(p.getByPlaceholder(/Part number, barcode/));
        await d.type('peat moss', 90);
        await d.hold(1200);
        await d.scroll(520, 1000);
        await d.hold(1100);
        await d.scroll(520, 1000);
        await d.hold(1400);
      },
    },
    {
      id: 'deliveries',
      label: 'Deliveries',
      path: '/deliveries',
      // The calendar's date cells; the "Click a day" hint is hidden on a phone.
      ready: (p) => p.locator('.delivery-cell__date').first().waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(900);
        await d.click(p.getByText(/^14$/).first(), 900);
        await d.hold(1300);
        await d.scroll(260, 900);
        await d.hold(2000);
      },
      async mobile(d) {
        const p = d.page;
        await d.hold(900);
        await d.click(p.getByText(/^14$/).first());
        await d.hold(1300);
        await d.scroll(360, 1000);
        await d.hold(1700);
      },
    },
    {
      id: 'buying',
      label: 'Buy list',
      path: '/ordering',
      ready: (p) => p.getByText('Buffer health').first().waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(700);
        await d.hover(p.getByText('Lines to order').first(), 800);
        await d.hold(900);
        await d.click(p.getByText('Below green', { exact: true }).first(), 800);
        await d.hold(1500);
        await d.moveTo(760, 640, 500);
        await d.scroll(320, 1000);
        await d.hold(1500);
      },
      async mobile(d) {
        const p = d.page;
        await d.hold(900);
        await d.scroll(480, 1000);
        await d.hold(1100);
        await d.scroll(480, 1000);
        await d.hold(1500);
      },
    },
    {
      id: 'kpis',
      label: 'KPIs',
      path: '/performance',
      ready: (p) => p.getByText(/TOTAL FULFILLED/i).first().waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(800);
        await d.click(p.getByRole('button', { name: 'YTD', exact: true }), 900);
        await d.hold(1500);
        await d.click(p.getByText(/TOTAL FULFILLED/i).first(), 800);
        await p.getByText('Trend').first().waitFor({ timeout: 30000 });
        await d.hold(2400);
      },
      async mobile(d) {
        const p = d.page;
        await d.hold(800);
        await d.click(p.getByRole('button', { name: 'YTD', exact: true }));
        await d.hold(1200);
        await d.scroll(420, 900);
        await d.hold(900);
        await d.scroll(-420, 700);
        await d.click(p.getByText(/TOTAL FULFILLED/i).first());
        await p.getByText('Trend').first().waitFor({ timeout: 30000 });
        await d.hold(1800);
      },
    },
    {
      id: 'search',
      label: 'Search',
      path: '/menu',
      ready: (p) => p.getByText('Shortcuts').first().waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(700);
        await d.click(p.getByPlaceholder(/Search items, bins, POs/), 900);
        await d.hold(250);
        await d.type('PVC elbow');
        await d.hold(2400);
      },
      async mobile(d) {
        const p = d.page;
        await d.hold(800);
        await d.click(p.getByRole('link', { name: 'Search', exact: true }).or(p.getByRole('button', { name: 'Search', exact: true })).last());
        await d.hold(700);
        await d.click(p.getByRole('searchbox').or(p.getByPlaceholder(/Search/)).first());
        await d.type('PVC elbow');
        await d.hold(2200);
      },
    },
  ],
};

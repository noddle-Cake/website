// GridMerge (gridmerge.cjservin.com). See ../record.mjs for the helpers on `d`.

async function ready(p) {
  await p.getByText('Potential coordination opportunities').waitFor({ timeout: 60000 });
  await p.locator('text=/kV|MW/').first().waitFor();
}

const firstPair = (p) => p.locator('text=/kV|MW/').first();

export default {
  url: 'https://gridmerge.cjservin.com',
  poster: { chapter: 'pairs', at: 0.45 },
  chapters: [
    {
      id: 'pairs',
      label: 'Coordination pairs',
      ready,
      settle: 2500,
      async desktop(d) {
        const p = d.page;
        await d.hold(1100);
        await d.click(firstPair(p), 900);
        await d.hold(3800);
        await d.hover(p.getByText('Rough coordination value', { exact: false }).first(), 800);
        await d.hold(1500);
        await d.click(p.getByRole('button', { name: /next/i }).or(p.getByText('›', { exact: true })).first(), 800);
        await d.hold(3200);
      },
      async mobile(d) {
        const p = d.page;
        // Swipe low on the screen: over the map, a swipe pans the map instead of the page.
        const below = { x: 196, y: 760 };
        await d.hold(900);
        await d.scroll(560, 1100, below);
        await d.hold(700);
        await d.click(firstPair(p));
        await d.hold(2400);
        await d.scroll(420, 1000, below);
        await d.hold(1600);
      },
    },
    {
      id: 'layers',
      label: 'Map layers',
      ready,
      settle: 2500,
      async desktop(d) {
        const p = d.page;
        const colorBy = (name) => p.locator('.color-by').getByRole('button', { name, exact: true });
        await d.hold(900);
        await d.click(colorBy('Type'), 900);
        await d.hold(1800);
        await d.click(colorBy('Start year'), 700);
        await d.hold(1800);
        await d.click(p.getByText('Power grid', { exact: true }).first(), 900);
        await d.hold(2600);
      },
    },
    {
      id: 'review',
      label: 'Review queue',
      ready,
      async desktop(d) {
        const p = d.page;
        await d.hold(800);
        await d.click(p.getByRole('button', { name: /Review/ }).first(), 900);
        await p.getByText(/Review extracted projects/).waitFor({ timeout: 30000 });
        await d.hold(1200);
        await d.hover(p.getByText(/low confidence/i).first(), 800);
        await d.hold(900);
        await d.hover(p.getByRole('link', { name: /Source/ }).first(), 1000);
        await d.hold(1200);
        await d.scroll(320, 1100);
        await d.hold(1500);
      },
    },
  ],
};

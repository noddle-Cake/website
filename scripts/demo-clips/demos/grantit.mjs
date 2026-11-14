// Grantit (grantit.joseyandco.com). Desktop only for now: on a phone the layout runs off the right
// edge. Demo data lives in the browser, so recording changes nothing for other visitors.
// See ../record.mjs for the helpers on `d`.

const nav = (p, name) => p.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true });

export default {
  url: 'https://grantit.joseyandco.com',
  poster: { chapter: 'financials', at: 0.55 },
  chapters: [
    {
      id: 'home',
      label: 'Home',
      ready: (p) => p.getByText('Needs your attention').waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(700);
        await d.hover(p.getByText('Find & apply').first(), 800);
        await d.hold(800);
        await d.hover(p.getByText('Expenses to review').first(), 900);
        await d.hold(800);
        await d.hover(p.getByText('Needs your attention').first(), 900);
        await d.hold(700);
        await d.hover(p.getByText('Upcoming').first(), 900);
        await d.hold(1500);
      },
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      path: '/apply',
      ready: (p) => p.getByText('Recommended for you').waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(700);
        await d.hover(p.getByText(/focus areas/).first(), 900);
        await d.hold(800);
        await d.click(p.getByText('Why this matches').first(), 800);
        await d.hold(2600);
      },
    },
    {
      id: 'applications',
      label: 'Applications',
      path: '/apply/applications',
      ready: (p) => p.getByText('Youth Mental Health Partnership').first().waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(800);
        await d.hover(p.getByText('Youth Mental Health Partnership').first(), 900);
        await d.hold(700);
        // The title wraps onto two lines; aim at the start of the first so the click lands on text.
        const title = await p.getByText('Youth Mental Health Partnership').first().boundingBox();
        await d.click({ x: title.x + 30, y: title.y + 10 }, 600);
        // The grant opens on its overview; the questions are on its Application tab ("Application 0/5").
        await p.getByText('Application details').first().waitFor({ timeout: 30000 });
        await d.hold(700);
        if (!(await p.getByText('To finish').first().isVisible())) {
          await d.click(p.getByRole('tab', { name: /^\s*Application\s*\d/ }).first(), 800);
        }
        await p.getByText('To finish').first().waitFor({ timeout: 30000 });
        await d.hold(1200);
        await d.hover(p.getByRole('button', { name: /Generate draft/ }).first(), 900);
        await d.hold(1600);
      },
    },
    {
      id: 'funds',
      label: 'Funded grants',
      path: '/funds',
      ready: (p) => p.getByText('Family Counseling Access').first().waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(700);
        await d.hover(p.getByText(/spent ·/).first(), 900);
        await d.hold(800);
        await d.hover(p.getByText('Urgent').first(), 800);
        await d.hold(700);
        await d.click(p.getByText('Anchor Mentors 2026').first(), 800);
        await d.hold(2400);
      },
    },
    {
      id: 'financials',
      label: 'Financials',
      path: '/funds/financials',
      ready: (p) => p.getByText('Spending by category').waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(800);
        await d.hover(p.getByText('Categories').first(), 900);
        await d.hold(700);
        // The pie is drawn without labels; aim for the largest slice (Personnel), right of centre.
        const pie = await p.evaluate(() => {
          const r = [...document.querySelectorAll('main svg')].map((s) => s.getBoundingClientRect())
            .sort((a, b) => b.width * b.height - a.width * a.height)[0];
          return { x: r.x + r.width * 0.68, y: r.y + r.height * 0.55 };
        });
        await d.click(pie, 900);
        await d.hold(3000);
      },
    },
    {
      id: 'spending',
      label: 'Spending',
      path: '/funds/spending',
      ready: (p) => p.getByText('Urgent spending').waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(700);
        await d.hover(p.getByText('Urgent spending').first(), 800);
        await d.hold(800);
        await d.hover(p.getByText(/Suggested/).first(), 1000);
        await d.hold(800);
        await d.hover(p.getByText(/Confirm \d+ suggestions/).first(), 900);
        await d.hold(1800);
      },
    },
  ],
};

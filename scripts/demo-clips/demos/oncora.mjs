// Oncora (oncora.cjservin.com). Desktop only: the Streamlit sidebar covers the page on a phone.
// Every chapter after the first runs a prediction before recording starts, then walks a section of
// the results through the "On this page" sidebar. See ../record.mjs for the helpers on `d`.

const predict = (p) => p.getByRole('button', { name: 'Predict' });

/** Ready once a prediction for the default example (gefitinib) is on screen. */
async function predicted(p) {
  await predict(p).waitFor({ timeout: 60000 });
  await predict(p).click();
  await p.getByText('Top predicted target').waitFor({ timeout: 90000 });
}

const section = (p, label) => p.getByText(label, { exact: true }).first();

export default {
  url: 'https://oncora.cjservin.com',
  poster: { chapter: 'predict', at: 0.7 },
  chapters: [
    {
      id: 'predict',
      label: 'Predict',
      ready: (p) => predict(p).waitFor({ timeout: 60000 }),
      async desktop(d) {
        const p = d.page;
        await d.hold(400);
        await d.hover(p.getByPlaceholder('Paste a molecule as SMILES'), 700);
        await d.hold(300);
        await d.click(predict(p), 650);
        await p.getByText('Top predicted target').waitFor({ timeout: 90000 });
        await d.hold(500);
        await d.hover(p.getByText('Top predicted target'), 800);
        await d.hold(1400);
        await d.hover(p.getByText('Independent agreement'), 700);
        await d.hold(1500);
      },
    },
    {
      id: 'targets',
      label: 'Protein targets',
      ready: predicted,
      async desktop(d) {
        const p = d.page;
        await d.hold(500);
        await d.click(section(p, '02 · Protein targets'), 800);
        await d.hold(1300);
        await d.moveTo(560, 330, 700);
        await d.hold(500);
        await d.moveTo(640, 520, 900);
        await d.hold(700);
        await d.hover(p.getByText('How to read it').first(), 800);
        await d.hold(1600);
      },
    },
    {
      id: 'cells',
      label: 'Cell lines',
      ready: predicted,
      async desktop(d) {
        const p = d.page;
        await d.hold(500);
        await d.click(section(p, '03 · Cell lines'), 800);
        await d.hold(1300);
        await d.moveTo(760, 300, 800);
        await d.hold(500);
        await d.moveTo(900, 560, 900);
        await d.hold(1800);
      },
    },
    {
      id: 'evidence',
      label: 'Evidence',
      ready: predicted,
      async desktop(d) {
        const p = d.page;
        await d.hold(500);
        await d.click(section(p, '04 · Measured response'), 800);
        await d.hold(2000);
        await d.click(section(p, '05 · Database records'), 800);
        await d.hold(2200);
      },
    },
  ],
};

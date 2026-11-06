// Tracks which `main [data-section]` is in view and marks the matching pill-nav link as current.

function initSections() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  const pillLinks = [...document.querySelectorAll<HTMLAnchorElement>('.pill-nav a')];

  const pathLink = pillLinks.find((link) =>
    (link.dataset.paths ?? '').split(' ').some((p) => p && (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)))
  );

  let current = -1;
  const update = () => {
    // The current section is the last one whose top has passed the upper third of the screen;
    // at the very bottom of the page it's the last one, however short.
    const line = window.innerHeight * 0.35;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let index = atBottom ? sections.length - 1 : 0;
    if (!atBottom) sections.forEach((s, i) => s.getBoundingClientRect().top <= line && (index = i));
    if (index === current) return;
    current = index;

    const spy = sections[index]?.id;
    const active = spy ? pillLinks.find((link) => link.dataset.spy === spy) : pathLink;
    pillLinks.forEach((link) => (link === active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current')));
  };

  let frame = 0;
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

initSections();

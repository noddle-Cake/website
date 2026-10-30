// Tracks which `main [data-section]` is in view. It marks the matching pill-nav link as current and
// builds the column of square markers down the right edge (one per section, the current one a tall
// accent bar; click one to jump there).

function initSections() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  const pillLinks = [...document.querySelectorAll<HTMLAnchorElement>('.pill-nav [data-spy]')];
  const markerHost = document.querySelector<HTMLElement>('[data-section-markers]');

  const markers = sections.map((section) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'section-marker';
    button.setAttribute('aria-label', section.dataset.section ?? section.id);
    button.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth' }));
    return button;
  });
  if (markerHost && sections.length > 1) markerHost.replaceChildren(...markers);

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

    markers.forEach((m, i) => m.toggleAttribute('aria-current', i === index));
    const spy = sections[index]?.id;
    const active = pillLinks.find((link) => link.dataset.spy === spy) ?? (spy ? undefined : pathLink);
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

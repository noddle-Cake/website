// Page-wide behaviour: marks the nav link for the `main [data-section]` in view, fades `.reveal`
// elements in as they are scrolled to, plays demo clips while they're on screen, and opens a project
// card reached through its #hash.

function initSections() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.site-nav a')];

  const pathLink = navLinks.find((link) =>
    (link.dataset.paths ?? '').split(' ').some((p) => p && location.pathname.startsWith(p))
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

    const active = sections.length ? navLinks.find((link) => link.dataset.spy === sections[index].id) : pathLink;
    navLinks.forEach((link) => (link === active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current')));
  };

  let frame = 0;
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  items.forEach((item) => observer.observe(item));
}

// Demo clips (components/ProjectShot.astro) load nothing but their poster until they're scrolled to,
// then play while at least a third of them is visible. With reduced motion they stay on the poster.
function initDemoClips() {
  const clips = document.querySelectorAll<HTMLVideoElement>('video[data-demo-clip]');
  if (!clips.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        const video = target as HTMLVideoElement;
        if (isIntersecting) video.play().catch(() => {});
        else video.pause();
      }
    },
    { threshold: 0.35 }
  );
  clips.forEach((clip) => observer.observe(clip));
}

function openHashTarget() {
  if (!location.hash) return;
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  target?.querySelector('details')?.setAttribute('open', '');
}

initSections();
initReveal();
initDemoClips();
openHashTarget();
window.addEventListener('hashchange', openHashTarget);

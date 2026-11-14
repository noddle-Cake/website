// Plays the demo players from components/ProjectShot.astro: one video per chapter on the desktop
// screen and, where there is one, the phone, crossfading from chapter to chapter and looping back to
// the first.
//
// - Nothing loads until a player is scrolled to. The first chapter then starts at the frame the still
//   shows (data-start-chapter / data-start-time), and each video fades in only once it's actually
//   playing, so the still never jumps.
// - Each chapter's video loads only when it's next: while one plays, the following one preloads.
// - Players pause while off screen. With reduced motion they don't start on their own, but the chapter
//   pills still play the chapter you pick.
// - The pills show the chapter playing and how far through it is (--progress, 0 to 1).

const FADE_MS = 500;

class DemoPlayer {
  /** The lead screen's video for each chapter (see the constructor). */
  private desktop: (HTMLVideoElement | undefined)[];
  private phone: (HTMLVideoElement | undefined)[];
  private phoneOnly: boolean;
  private count: number;
  private pills: HTMLButtonElement[];
  private current = -1;
  private started = false;
  private visible = false;
  private frame = 0;

  constructor(
    private root: HTMLElement,
    private autoplay: boolean,
  ) {
    const byChapter = (videos: HTMLVideoElement[]) => {
      const list: (HTMLVideoElement | undefined)[] = [];
      videos.forEach((v) => (list[Number(v.dataset.chapter)] = v));
      return list;
    };
    const desktop = byChapter([...root.querySelectorAll<HTMLVideoElement>('video[data-desktop]')]);
    const phone = byChapter([...root.querySelectorAll<HTMLVideoElement>('video[data-phone]')]);
    // The lead screen sets the pace: the desktop one, or the phone in a phone-only demo.
    this.phoneOnly = !desktop.some(Boolean);
    this.count = Math.max(desktop.length, phone.length);
    this.desktop = this.phoneOnly ? phone : desktop;
    this.phone = this.phoneOnly ? [] : phone;
    this.pills = [...root.querySelectorAll<HTMLButtonElement>('.demo-chapter')];

    this.desktop.forEach((video, i) =>
      video?.addEventListener('ended', () => {
        if (i === this.current) this.go((i + 1) % this.count);
      }),
    );
    this.pills.forEach((pill, i) =>
      pill.addEventListener('click', () => {
        this.started = true;
        this.go(i);
      }),
    );
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible) return this.pause();
    if (!this.started) {
      if (!this.autoplay) return;
      this.started = true;
      this.go(Number(this.root.dataset.startChapter) || 0, Number(this.root.dataset.startTime) || 0);
    } else {
      this.resume();
    }
  }

  /** Switches both screens to chapter `i`, starting `time` seconds in. */
  private go(i: number, time = 0) {
    const previous = this.current;
    this.current = i;
    this.show(this.desktop[i], this.desktop[previous], time);
    this.show(this.phone[i], this.phone[previous], 0);
    this.pills.forEach((pill, k) => {
      pill.setAttribute('aria-pressed', String(k === i));
      pill.style.setProperty('--progress', '0');
    });
    this.track();
  }

  private show(next: HTMLVideoElement | undefined, previous: HTMLVideoElement | undefined, time: number) {
    if (!next) return;
    this.load(next);
    next.currentTime = time;
    next.addEventListener(
      'playing',
      () => {
        next.classList.add('is-playing');
        if (previous && previous !== next) {
          previous.classList.remove('is-playing');
          setTimeout(() => previous.pause(), FADE_MS);
        }
      },
      { once: true },
    );
    // Get the chapter after this one ready once this one is halfway through, so a visitor who
    // scrolls straight past doesn't download it.
    const after = (Number(next.dataset.chapter) + 1) % this.count;
    const following = next.dataset.phone !== undefined && !this.phoneOnly ? this.phone[after] : this.desktop[after];
    const preload = () => {
      if (!next.duration || next.currentTime < next.duration / 2) return;
      next.removeEventListener('timeupdate', preload);
      if (following) this.load(following);
    };
    next.addEventListener('timeupdate', preload);
    if (this.visible) next.play().catch(() => {});
  }

  private load(video: HTMLVideoElement) {
    if (video.preload === 'auto') return;
    if (video.dataset.poster) video.poster = video.dataset.poster;
    video.preload = 'auto';
    video.load();
  }

  private pause() {
    cancelAnimationFrame(this.frame);
    this.desktop[this.current]?.pause();
    this.phone[this.current]?.pause();
  }

  private resume() {
    this.desktop[this.current]?.play().catch(() => {});
    this.phone[this.current]?.play().catch(() => {});
    this.track();
  }

  /** Fills the current chapter's pill as it plays. */
  private track() {
    cancelAnimationFrame(this.frame);
    const pill = this.pills[this.current];
    const video = this.desktop[this.current];
    if (!pill || !video) return;
    const tick = () => {
      if (video.duration) pill.style.setProperty('--progress', String(Math.min(1, video.currentTime / video.duration)));
      if (this.visible && !video.paused) this.frame = requestAnimationFrame(tick);
    };
    video.addEventListener('playing', () => (this.frame = requestAnimationFrame(tick)), { once: true });
    this.frame = requestAnimationFrame(tick);
  }
}

export function initDemoPlayers() {
  const roots = document.querySelectorAll<HTMLElement>('[data-demo]');
  if (!roots.length || !('IntersectionObserver' in window)) return;
  const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const players = new Map<Element, DemoPlayer>();
  roots.forEach((root) => players.set(root, new DemoPlayer(root, autoplay)));
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => players.get(e.target)?.setVisible(e.isIntersecting)),
    { threshold: 0.35 },
  );
  roots.forEach((root) => observer.observe(root));
}

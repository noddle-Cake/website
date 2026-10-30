// Runs before paint via a blocking inline <script> in <head> — sets data-theme
// early so there's no flash of the wrong palette on load.
(function () {
  try {
    const stored = localStorage.getItem('theme');
    const theme =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    // localStorage unavailable — fall back silently, CSS media query still applies
  }
})();

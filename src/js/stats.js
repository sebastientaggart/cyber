// Animated stats counter — IntersectionObserver triggers a one-shot
// requestAnimationFrame ramp from 0 to data-end-value over 2.75s with ease-out.
// Mirrors 405d's react-countup config (duration: 2.75s, scrollSpyDelay: 500ms,
// scrollSpyOnce: true). No-op on pages without `.stat-counter__value` elements.

const DURATION_MS = 2750;
const START_DELAY_MS = 500;

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function initStats() {
  const els = document.querySelectorAll('.stat-counter__value');
  if (els.length === 0) return;

  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Snap-to-final fallback for reduced-motion / no-IO support
  if (prefersReduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => {
      const end = parseInt(el.dataset.endValue, 10) || 0;
      el.textContent = end.toLocaleString('en-US');
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const end = parseInt(el.dataset.endValue, 10) || 0;
        io.unobserve(el);
        setTimeout(() => {
          const startTs = performance.now();
          function tick(now) {
            const elapsed = now - startTs;
            const t = Math.min(1, elapsed / DURATION_MS);
            const current = Math.floor(end * easeOut(t));
            el.textContent = current.toLocaleString('en-US');
            if (t < 1) requestAnimationFrame(tick);
            else el.textContent = end.toLocaleString('en-US');
          }
          requestAnimationFrame(tick);
        }, START_DELAY_MS);
      });
    },
    { threshold: 0.5 }
  );

  els.forEach((el) => io.observe(el));
}

if (document.readyState !== 'loading') {
  initStats();
} else {
  document.addEventListener('DOMContentLoaded', initStats);
}

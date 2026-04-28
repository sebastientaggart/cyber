// Two responsibilities, both bootstrapped on DOMContentLoaded:
//   1) Scroll-fade-in animations for elements marked [data-animate]
//   2) Toggle behavior for the USWDS-style gov banner
//
// Mirrors the 405d-old useIntersectionObserver hook + AnimatedBox component
// (rootMargin "50px 0px 0px 0px", one-shot latch — once visible, stays visible).

function initAnimations() {
  const els = document.querySelectorAll('[data-animate]');
  if (els.length === 0) return;

  // Reduced motion or no IO support: snap straight to visible.
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '50px 0px 0px 0px', threshold: 0 }
  );

  els.forEach((el) => io.observe(el));
}

function initGovBanner() {
  const buttons = document.querySelectorAll('.js-gov-banner-toggle');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      target.setAttribute('aria-hidden', String(isOpen));
    });
  });
}

// Wait for `load` (not DOMContentLoaded) so all stylesheets are applied
// before we query or observe the DOM — avoids "layout forced before page was
// fully loaded" warnings from cross-origin CSS still in flight.
if (document.readyState === 'complete') {
  initAnimations();
  initGovBanner();
} else {
  window.addEventListener('load', () => {
    initAnimations();
    initGovBanner();
  });
}

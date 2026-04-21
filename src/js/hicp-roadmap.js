// Initialize Bootstrap popovers on the inline-SVG cybersecurity roadmap hotspots
// (rendered by src/includes/cybersecurity-roadmap.pug). Adds keyboard support
// (Enter/Space → open, Escape → close) and click-outside dismissal.
//
// No-op if the page doesn't contain the roadmap.

function initHicpRoadmap() {
  const hotspots = document.querySelectorAll('.cybersecurity-roadmap__hotspot');
  if (hotspots.length === 0) return;
  if (!window.bootstrap || !window.bootstrap.Popover) return;

  hotspots.forEach((el) => {
    // Each circle becomes a Bootstrap popover, content sourced from data-bs-* attrs
    new window.bootstrap.Popover(el);

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      } else if (e.key === 'Escape') {
        const popover = window.bootstrap.Popover.getInstance(el);
        if (popover) popover.hide();
      }
    });
  });

  // Click outside any hotspot OR popover dismisses any open popovers
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cybersecurity-roadmap__hotspot, .popover')) {
      hotspots.forEach((el) => {
        const popover = window.bootstrap.Popover.getInstance(el);
        if (popover) popover.hide();
      });
    }
  });
}

// Bootstrap JS is loaded with `defer`, so DOMContentLoaded fires before it. Wait
// for the load event to ensure window.bootstrap is available.
if (document.readyState === 'complete') {
  initHicpRoadmap();
} else {
  window.addEventListener('load', initHicpRoadmap);
}

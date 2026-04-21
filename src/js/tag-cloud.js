// Vanilla tag-cloud helper. Each `.tag-cloud__tag` element carries `data-count`;
// this script normalizes the counts into a font-size between $minFont and $maxFont.
// No-op if no `.tag-cloud` elements exist.

export function initTagCloud() {
  const clouds = document.querySelectorAll('.tag-cloud');
  clouds.forEach((cloud) => {
    const tags = cloud.querySelectorAll('.tag-cloud__tag');
    if (tags.length === 0) return;
    const counts = [...tags].map((t) => parseInt(t.dataset.count, 10) || 1);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const minFont = 0.85;
    const maxFont = 1.6;
    tags.forEach((t) => {
      const c = parseInt(t.dataset.count, 10) || 1;
      const norm = max === min ? 0.5 : (c - min) / (max - min);
      const size = minFont + norm * (maxFont - minFont);
      t.style.fontSize = size.toFixed(2) + 'rem';
    });
  });
}

if (document.readyState !== 'loading') {
  initTagCloud();
} else {
  document.addEventListener('DOMContentLoaded', initTagCloud);
}

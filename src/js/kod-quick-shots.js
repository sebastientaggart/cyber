// KOD Quick Shots video modal handler.
// Reads `data-video-url` from clicked tile, sets <video src>, opens modal.
// Resets src on `hidden.bs.modal` (prevents audio bleed).
// Honors location.hash for deep-linking (e.g., quick-shots.html#typhoon).
//
// No-op if the page doesn't contain the Quick Shots grid.

import { isSafeAssetUrl } from './url-utils.js';

function initKodQuickShots() {
  const grid = document.querySelector('.kod-quick-shots__grid');
  const modalEl = document.getElementById('kod-video-modal');
  const videoEl = document.getElementById('kod-video-player');
  const titleEl = document.getElementById('kod-video-modal-title');
  if (!grid || !modalEl || !videoEl) return;
  if (!window.bootstrap || !window.bootstrap.Modal) return;

  const modal = new window.bootstrap.Modal(modalEl);

  function openVideo(tile) {
    const url = tile.getAttribute('data-video-url');
    const title = tile.getAttribute('data-video-title') || '';
    if (!url || !isSafeAssetUrl(url)) return;
    videoEl.src = url;
    if (titleEl) titleEl.textContent = title;
    modal.show();
    // Autoplay once metadata loads
    videoEl.addEventListener(
      'loadedmetadata',
      () => {
        videoEl.play().catch(() => {
          /* autoplay blocked — user can press play */
        });
      },
      { once: true }
    );
  }

  // Click handler — delegated on the grid
  grid.addEventListener('click', (e) => {
    const tile = e.target.closest('.kod-quick-shots__tile');
    if (!tile || tile.disabled) return;
    e.preventDefault();
    openVideo(tile);
  });

  // Reset src + pause when modal closes
  modalEl.addEventListener('hidden.bs.modal', () => {
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
    if (titleEl) titleEl.textContent = '';
  });

  // Hash deep-link on initial load
  if (window.location.hash) {
    const slug = window.location.hash.slice(1);
    const tile = grid.querySelector(`.kod-quick-shots__tile[data-video-slug="${slug}"]`);
    if (tile) openVideo(tile);
  }
}

if (document.readyState === 'complete') {
  initKodQuickShots();
} else {
  window.addEventListener('load', initKodQuickShots);
}

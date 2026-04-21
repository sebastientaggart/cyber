// Date-gated notices banner.
// Reads the embedded JSON blob `<script type="application/json" id="notices-data">`
// from the home page, filters by start_date <= now <= end_date, and renders
// matching notices into `#notices-banner` as alert cards.
//
// Uses textContent (not innerHTML) for safety. If a future notice needs HTML
// markup in the body, port Phase 3's sanitize-html pipeline.
//
// No-op when there are no notices, no active notices, or the page lacks the
// expected DOM elements.

function initNotices() {
  const blob = document.getElementById('notices-data');
  const banner = document.getElementById('notices-banner');
  if (!blob || !banner) return;

  let notices;
  try {
    notices = JSON.parse(blob.textContent);
  } catch (e) {
    return;
  }
  if (!Array.isArray(notices) || notices.length === 0) return;

  const now = new Date().toISOString();
  const active = notices.filter((n) => {
    const start = n.start_date || n.startDate;
    const end = n.end_date || n.endDate;
    return (!start || start <= now) && (!end || end >= now);
  });
  if (active.length === 0) return;

  active.forEach((notice) => {
    const card = document.createElement('article');
    card.className = 'notice-card notice-card--' + (notice.type || 'info');

    const header = document.createElement('header');
    header.className = 'notice-card__header';
    if (notice.type === 'resource') header.textContent = 'New Resource';
    else if (notice.type === 'event') header.textContent = 'Upcoming Event';
    else header.textContent = 'Notice';

    const title = document.createElement('h3');
    title.className = 'notice-card__title';
    title.textContent = notice.title || '';

    const body = document.createElement('p');
    body.className = 'notice-card__body';
    body.textContent = notice.description || '';

    card.append(header, title, body);

    if (notice.link_url) {
      const link = document.createElement('a');
      link.href = notice.link_url;
      link.className = 'notice-card__link';
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = notice.link_title || 'Learn more';
      card.append(link);
    }

    banner.append(card);
  });
}

if (document.readyState !== 'loading') {
  initNotices();
} else {
  document.addEventListener('DOMContentLoaded', initNotices);
}

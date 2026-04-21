// Post list page runtime: 3-category chip filter + pagination.
// All post cards are pre-rendered; this script only shows/hides them.
// The first 3 posts (primary + 2 secondary) are always visible regardless
// of pagination — only the `.post-list__remaining` list is paginated.
// No-op if there's no `.post-list` on the page.

const PAGE_SIZE = 10;

function initPost() {
  const root = document.querySelector('.post-list');
  if (!root) return;

  const allCards = [...root.querySelectorAll('.post-card')];
  const remainingList = root.querySelector('.post-list__remaining');
  const remainingCards = remainingList ? [...remainingList.querySelectorAll('.post-card')] : [];
  const featured = root.querySelector('.post-list__featured');
  const secondaries = root.querySelector('.post-list__secondaries');
  const chips = [...root.querySelectorAll('.post-list__chips .resources-chips__chip')];
  const pager = root.querySelector('.pagination-bar');

  const state = {
    categories: new Set(),
    page: 1,
  };

  function matchesFilter(card) {
    if (state.categories.size === 0) return true;
    return state.categories.has(card.dataset.category);
  }

  function applyFilters() {
    // Featured + secondary cards: show only if they match filter
    if (featured) {
      featured.querySelectorAll('.post-card').forEach((c) => {
        c.classList.toggle('is-hidden', !matchesFilter(c));
      });
    }
    if (secondaries) {
      secondaries.querySelectorAll('.post-card').forEach((c) => {
        c.classList.toggle('is-hidden', !matchesFilter(c));
      });
    }

    // Remaining list: filter + paginate
    const visibleRemaining = remainingCards.filter(matchesFilter);
    remainingCards.forEach((c) => c.classList.add('is-hidden'));
    const totalPages = Math.max(1, Math.ceil(visibleRemaining.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * PAGE_SIZE;
    visibleRemaining.slice(start, start + PAGE_SIZE).forEach((c) => c.classList.remove('is-hidden'));

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!pager) return;
    pager.innerHTML = '';
    if (totalPages <= 1) return;
    const mkBtn = (label, page, disabled = false, isCurrent = false) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pagination-bar__button' + (isCurrent ? ' is-current' : '');
      b.textContent = label;
      b.disabled = disabled;
      if (!disabled && !isCurrent) {
        b.addEventListener('click', () => {
          state.page = page;
          applyFilters();
          remainingList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return b;
    };
    pager.appendChild(mkBtn('« First', 1, state.page === 1));
    pager.appendChild(mkBtn('‹ Prev', Math.max(1, state.page - 1), state.page === 1));
    const info = document.createElement('span');
    info.className = 'pagination-bar__info';
    info.textContent = `Page ${state.page} of ${totalPages}`;
    pager.appendChild(info);
    pager.appendChild(mkBtn('Next ›', Math.min(totalPages, state.page + 1), state.page === totalPages));
    pager.appendChild(mkBtn('Last »', totalPages, state.page === totalPages));
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.category;
      if (state.categories.has(cat)) {
        state.categories.delete(cat);
        chip.setAttribute('aria-pressed', 'false');
      } else {
        state.categories.add(cat);
        chip.setAttribute('aria-pressed', 'true');
      }
      state.page = 1;
      applyFilters();
    });
  });

  applyFilters();
}

if (document.readyState !== 'loading') {
  initPost();
} else {
  document.addEventListener('DOMContentLoaded', initPost);
}

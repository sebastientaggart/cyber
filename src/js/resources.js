// Resources page runtime: orchestrates filtering (category chips + tag cloud),
// search (Lunr via search.js), sort, and pagination.
// All resource cards are pre-rendered into the HTML; this script only
// shows/hides them. No-op if there's no `.resource-grid` on the page.

import { searchResources } from './search.js';

const PAGE_SIZE = 10;

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (_) {
    return '';
  }
}

function initResources() {
  const root = document.querySelector('.resources-page');
  const grid = document.querySelector('.resource-grid');
  if (!root || !grid) return;

  const cards = [...grid.querySelectorAll('.resource-card')];
  const chips = [...document.querySelectorAll('.resources-chips__chip')];
  const tagButtons = [...document.querySelectorAll('.tag-cloud__tag')];
  const searchInput = document.querySelector('.resources-search__input');
  const searchButton = document.querySelector('.resources-search__button');
  const sortSelect = document.querySelector('.resources-controls__sort select');
  const resetButton = document.querySelector('.resources-controls__reset');
  const countLabel = document.querySelector('.resources-controls__count');
  const pagerTop = document.querySelector('.pagination-bar--top');
  const pagerBottom = document.querySelector('.pagination-bar--bottom');
  const emptyEl = document.querySelector('.resources-empty');
  const statusEl = document.querySelector('.resources-controls__status');

  const state = {
    categories: new Set(),
    tags: new Set(),
    searchIds: null, // Set<id> when search active, null when inactive
    sort: sortSelect ? sortSelect.value : 'DD',
    page: 1,
    lastSort: null,
    searchError: false,
  };

  // Honor preselected category from <section data-default-category="Toolkits">
  const defaultCat = root.dataset.defaultCategory;
  if (defaultCat) {
    state.categories.add(defaultCat);
    chips.forEach((c) => {
      if (c.dataset.category === defaultCat) c.setAttribute('aria-pressed', 'true');
    });
  }

  function applyFilters() {
    // 1. Filter pass — set is-hidden on cards that don't match
    let visibleCards = cards.filter((card) => {
      const cat = card.dataset.category;
      const tags = (card.dataset.tags || '').split(',').map((t) => t.trim());
      if (state.categories.size > 0 && !state.categories.has(cat)) return false;
      if (state.tags.size > 0) {
        let anyTagMatch = false;
        for (const t of state.tags) {
          if (tags.includes(t)) { anyTagMatch = true; break; }
        }
        if (!anyTagMatch) return false;
      }
      if (state.searchIds && !state.searchIds.has(card.dataset.id)) return false;
      return true;
    });

    // 2. Sort pass
    const cmp = {
      DD: (a, b) => (b.dataset.date || '').localeCompare(a.dataset.date || ''),
      DA: (a, b) => (a.dataset.date || '').localeCompare(b.dataset.date || ''),
      TA: (a, b) => (a.dataset.titleLower || '').localeCompare(b.dataset.titleLower || ''),
      TD: (a, b) => (b.dataset.titleLower || '').localeCompare(a.dataset.titleLower || ''),
    }[state.sort] || (() => 0);
    visibleCards.sort(cmp);

    // Re-attach only when sort mode changes, to avoid excess DOM writes.
    if (state.lastSort !== state.sort) {
      const fragment = document.createDocumentFragment();
      visibleCards.forEach((c) => fragment.appendChild(c));
      grid.appendChild(fragment);
      state.lastSort = state.sort;
    }

    // Hide all then reveal current page
    cards.forEach((c) => c.classList.add('is-hidden'));
    const totalPages = Math.max(1, Math.ceil(visibleCards.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * PAGE_SIZE;
    visibleCards.slice(start, start + PAGE_SIZE).forEach((c) => c.classList.remove('is-hidden'));

    // Count + empty state
    if (countLabel) {
      countLabel.textContent = `${visibleCards.length} resource${visibleCards.length === 1 ? '' : 's'}`;
    }
    if (emptyEl) {
      if (state.searchError) {
        emptyEl.textContent = 'Search is temporarily unavailable. Please try again.';
      } else {
        emptyEl.textContent = 'No resources match the current filters.';
      }
      emptyEl.classList.toggle('is-hidden', visibleCards.length > 0);
    }
    if (statusEl) {
      statusEl.textContent = `Showing ${visibleCards.length} resource${visibleCards.length === 1 ? '' : 's'}, page ${state.page} of ${totalPages}.`;
    }

    // Pagination
    renderPagination(pagerTop, totalPages);
    renderPagination(pagerBottom, totalPages);

    // Reset button enabled when any filter is active
    if (resetButton) {
      const hasFilters = state.categories.size > 0 || state.tags.size > 0 || state.searchIds;
      resetButton.disabled = !hasFilters;
    }
  }

  function renderPagination(bar, totalPages) {
    if (!bar) return;
    bar.innerHTML = '';
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
          // Scroll the results into view if pager is at the bottom
          if (bar === pagerBottom) {
            grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
      return b;
    };
    bar.appendChild(mkBtn('« First', 1, state.page === 1));
    bar.appendChild(mkBtn('‹ Prev', Math.max(1, state.page - 1), state.page === 1));
    const info = document.createElement('span');
    info.className = 'pagination-bar__info';
    info.textContent = `Page ${state.page} of ${totalPages}`;
    bar.appendChild(info);
    bar.appendChild(mkBtn('Next ›', Math.min(totalPages, state.page + 1), state.page === totalPages));
    bar.appendChild(mkBtn('Last »', totalPages, state.page === totalPages));
  }

  // Wire chips
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

  // Wire tag cloud
  tagButtons.forEach((tag) => {
    tag.addEventListener('click', (e) => {
      e.preventDefault();
      const t = tag.dataset.tag;
      if (state.tags.has(t)) {
        state.tags.delete(t);
        tag.classList.remove('is-active');
        tag.setAttribute('aria-pressed', 'false');
      } else {
        state.tags.add(t);
        tag.classList.add('is-active');
        tag.setAttribute('aria-pressed', 'true');
      }
      state.page = 1;
      applyFilters();
    });
  });

  // Wire search
  async function runSearch() {
    if (!searchInput) return;
    const term = searchInput.value.trim();
    if (!term) {
      state.searchIds = null;
      state.searchError = false;
    } else {
      try {
        state.searchIds = await searchResources(term);
        state.searchError = false;
      } catch (err) {
        console.error('search failed:', err);
        state.searchIds = new Set();
        state.searchError = true;
      }
    }
    state.page = 1;
    applyFilters();
  }
  if (searchButton) searchButton.addEventListener('click', runSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runSearch();
      }
    });
  }

  // Wire sort
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      applyFilters();
    });
  }

  // Wire reset
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      state.categories.clear();
      state.tags.clear();
      state.searchIds = null;
      state.searchError = false;
      state.page = 1;
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      tagButtons.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
      if (searchInput) searchInput.value = '';
      applyFilters();
    });
  }

  // Initial render
  applyFilters();
}

if (document.readyState === 'complete') {
  initResources();
} else {
  window.addEventListener('load', initResources);
}

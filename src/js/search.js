// Lazy Lunr search runtime.
// The serialized index lives at src/data/search-index.json (built by
// scripts/build-search-index.mjs as a `prebuild` step).
//
// We use a dynamic `import()` so Parcel splits the search index into a
// separate chunk that is only fetched when the user first triggers a search.
// Pages without a search box never download it.
//
// Lunr itself is loaded from CDN by head.pug (window.lunr). We don't bundle
// lunr here to keep the main JS small.

let indexPromise = null;

function loadIndex() {
  if (indexPromise) return indexPromise;
  indexPromise = import('../data/search-index.json').then((mod) => {
    const serialized = mod.default || mod;
    if (!window.lunr) {
      throw new Error('lunr global not found — did head.pug load the CDN script?');
    }
    return window.lunr.Index.load(serialized);
  });
  return indexPromise;
}

export async function searchResources(term) {
  if (!term || !term.trim()) return null;
  const idx = await loadIndex();
  const results = idx.search(term.trim());
  return new Set(results.map((r) => r.ref));
}

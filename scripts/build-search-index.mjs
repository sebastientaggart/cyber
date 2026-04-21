#!/usr/bin/env node
//
// Build a Lunr search index over the resources snapshot.
// Wired as `prebuild` in package.json so it runs automatically before
// every `pnpm build`. Reads only the committed snapshot — does NOT hit
// the live API. Use `pnpm run fetch-content` to refresh the snapshot
// before re-indexing.
//
// Output: src/data/search-index.json (serialized lunr index)

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import lunr from 'lunr';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');

const resources = JSON.parse(readFileSync(join(dataDir, 'resources.json'), 'utf8'))
  .filter((r) => r.published && r.category !== '*Post');

const idx = lunr(function () {
  this.ref('id');
  this.field('title', { boost: 5 });
  this.field('descr', { boost: 2 });
  this.field('tags', { boost: 3 });
  this.field('category');
  resources.forEach((r) => this.add(r));
});

writeFileSync(join(dataDir, 'search-index.json'), JSON.stringify(idx));
console.log(`built search index over ${resources.length} resources`);

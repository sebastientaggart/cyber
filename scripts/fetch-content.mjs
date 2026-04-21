#!/usr/bin/env node
//
// Manually refresh the live-content snapshots under src/data/.
// Run via `pnpm run fetch-content`. Build never calls this — by design,
// the build reads only committed JSON snapshots so failures are loud and
// obvious if a snapshot is missing.
//
// All three GET endpoints are public (no x-api-key required for reads).
// Writes are atomic: temp file then rename, so a failed run never corrupts
// an existing snapshot.

import { writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const API = 'https://0yrwwjalm8.execute-api.us-east-1.amazonaws.com/Pre-Prod';

mkdirSync(dataDir, { recursive: true });

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} from ${url}`);
  }
  return res.json();
}

function writeAtomic(name, data) {
  const finalPath = join(dataDir, name);
  const tmpPath = join(dataDir, '.tmp-' + name);
  writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  renameSync(tmpPath, finalPath);
  const count = Array.isArray(data) ? data.length : 1;
  console.log(`  wrote ${name} (${count} item${count === 1 ? '' : 's'})`);
}

console.log('Fetching resources...');
const resources = await fetchJSON(`${API}/resource`);
writeAtomic('resources.json', resources);

console.log('Fetching post list...');
const postList = await fetchJSON(`${API}/post2`);
console.log(`  ${postList.length} posts; fetching bodies in parallel...`);

// Two-pass fetch: list endpoint returns metadata only. For posts that have
// content (have_content === true), fetch the detail endpoint to merge in
// the `content[]` markdown body. Failures on a single post log a warning
// and fall back to the metadata-only entry.
const posts = await Promise.all(
  postList.map((p) =>
    p.have_content
      ? fetchJSON(`${API}/post2/${p.id}`).catch((e) => {
          console.warn(`  WARN ${p.id}: ${e.message}`);
          return p;
        })
      : Promise.resolve(p)
  )
);
writeAtomic('posts.json', posts);

console.log('Fetching current notices...');
const notices = await fetchJSON(`${API}/current-notices`);
writeAtomic('notices.json', notices);

console.log('Done.');

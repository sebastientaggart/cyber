#!/usr/bin/env node
/**
 * Copy committed static binaries into Parcel output (stable paths, not hashed).
 * Usage: node scripts/copy-public-assets.mjs [dist|dev-dist]
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, process.argv[2] || 'dist');

const trees = ['Documents', 'threats', 'video'];

mkdirSync(outDir, { recursive: true });

for (const name of trees) {
  const src = join(root, 'src', name);
  if (!existsSync(src)) continue;
  const dest = join(outDir, name);
  cpSync(src, dest, { recursive: true });
  console.log(`Copied ${name}/ → ${outDir}/${name}/`);
}

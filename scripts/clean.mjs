#!/usr/bin/env node
/**
 * Cross-platform clean of build outputs.
 * Usage: node scripts/clean.mjs [...paths]
 * Defaults to ['dist', '.parcel-cache'] when no args provided.
 */
import { rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const targets = process.argv.slice(2);
const paths = targets.length ? targets : ['dist', '.parcel-cache'];

for (const p of paths) {
  rmSync(join(root, p), { recursive: true, force: true });
  console.log(`Removed ${p}`);
}

#!/usr/bin/env node
/**
 * Fail if any *.pdf under src/Documents lacks a PDF header (%PDF- in first 1 KiB).
 * Run via `pnpm run verify-document-pdfs`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const docsDir = join(root, 'src', 'Documents');

function collectPdfs(dirAbs) {
  const out = [];
  function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.pdf')) out.push(p);
    }
  }
  walk(dirAbs);
  out.sort();
  return out;
}

function looksLikePdf(inputPath) {
  const buf = readFileSync(inputPath);
  const head = buf.subarray(0, Math.min(1024, buf.length)).toString('latin1');
  return head.includes('%PDF-');
}

const pdfs = collectPdfs(docsDir);
const bad = [];
for (const abs of pdfs) {
  if (!looksLikePdf(abs)) bad.push(relative(root, abs));
}

if (bad.length > 0) {
  console.error(`Non-PDF files with .pdf extension (${bad.length}):`);
  for (const p of bad) console.error(`  ${p}`);
  process.exit(1);
}

console.log(`OK: ${pdfs.length} PDF(s) under ${relative(root, docsDir) || 'src/Documents'} have %PDF- header.`);

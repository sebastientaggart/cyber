#!/usr/bin/env node
/**
 * Shrink PDFs for web: qpdf --optimize-images --linearize, then Ghostscript /ebook
 * (unless --qpdf-only — use for tagged/508-sensitive sources).
 *
 * Usage:
 *   node scripts/optimize-web-pdf.mjs [--qpdf-only] <file.pdf> [file.pdf ...]
 *   node scripts/optimize-web-pdf.mjs [--qpdf-only] --dir <directory> [--quiet]
 *
 * `--dir` walks the directory recursively for *.pdf (stable sort by path).
 * `--quiet` adds qpdf `--no-warn` and hides child stdout/stderr (progress line + summary).
 *
 * qpdf always uses `--warning-exit-0`. Files without `%PDF-` in the first 1 KiB are skipped
 * (HTML / LFS placeholders named `.pdf`).
 *
 * Writes via temp files; replaces original only if output is smaller and tools succeeded.
 * Requires: qpdf, gs (Ghostscript) on PATH (gs not used with --qpdf-only).
 */
import { spawnSync } from 'node:child_process';
import { unlinkSync, renameSync, statSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function parseArgs(argv) {
  const qpdfOnly = argv.includes('--qpdf-only');
  const quiet = argv.includes('--quiet');
  const filtered = argv.filter((a) => a !== '--qpdf-only' && a !== '--quiet');
  let scanDir = null;
  const files = [];
  for (let i = 0; i < filtered.length; i += 1) {
    if (filtered[i] === '--dir') {
      scanDir = filtered[i + 1];
      i += 1;
      continue;
    }
    if (filtered[i].startsWith('--dir=')) {
      scanDir = filtered[i].slice('--dir='.length);
      continue;
    }
    files.push(filtered[i]);
  }
  return { qpdfOnly, quiet, scanDir, files };
}

function run(cmd, argv, quiet) {
  if (quiet) {
    const r = spawnSync(cmd, argv, { encoding: 'utf8' });
    if (r.status !== 0) {
      const err = (r.stderr && String(r.stderr).trim()) || `exit ${r.status}`;
      console.error(`\n${cmd}: ${err.slice(0, 500)}`);
      return false;
    }
    return true;
  }
  const r = spawnSync(cmd, argv, { stdio: 'inherit' });
  return r.status === 0;
}

function collectPdfs(dirAbs) {
  const out = [];
  function walk(d) {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.pdf')) out.push(p);
    }
  }
  walk(dirAbs);
  out.sort();
  return out;
}

function looksLikePdfFile(inputPath) {
  try {
    const buf = readFileSync(inputPath);
    const head = buf.subarray(0, Math.min(1024, buf.length)).toString('latin1');
    return head.includes('%PDF-');
  } catch {
    return false;
  }
}

function optimizeOne(inputPath, qpdfOnly, quiet) {
  const stage1 = `${inputPath}.qpdf.tmp.pdf`;
  const stage2 = `${inputPath}.gs.tmp.pdf`;
  const backup = `${inputPath}.pre-opt.bak.pdf`;
  const before = statSync(inputPath).size;

  if (!looksLikePdfFile(inputPath)) {
    if (!quiet) console.log(`${basename(inputPath)}: skip (not a PDF — missing %PDF- header, likely a placeholder)`);
    return 'skip';
  }

  const qpdfArgs = ['--optimize-images', '--linearize', '--warning-exit-0'];
  if (quiet) qpdfArgs.push('--no-warn');
  qpdfArgs.push(inputPath, stage1);

  if (!run('qpdf', qpdfArgs, quiet)) {
    console.error(`qpdf failed: ${relative(root, inputPath)}`);
    try {
      unlinkSync(stage1);
    } catch {
      /* ignore */
    }
    return 'fail';
  }
  let candidate = stage1;
  if (!qpdfOnly) {
    if (!run('gs', ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4', '-dPDFSETTINGS=/ebook', '-dNOPAUSE', '-dBATCH', '-dQUIET', `-sOutputFile=${stage2}`, stage1], quiet)) {
      console.error(`ghostscript failed: ${relative(root, inputPath)}`);
      try {
        unlinkSync(stage1);
      } catch {
        /* ignore */
      }
      try {
        unlinkSync(stage2);
      } catch {
        /* ignore */
      }
      return 'fail';
    }
    try {
      unlinkSync(stage1);
    } catch {
      /* ignore */
    }
    candidate = stage2;
  }

  const after = statSync(candidate).size;
  if (after >= before) {
    if (!quiet) console.log(`${basename(inputPath)}: no win (${before} → ${after}), keeping original`);
    try {
      unlinkSync(candidate);
    } catch {
      /* ignore */
    }
    return 'noop';
  }
  copyFileSync(inputPath, backup);
  renameSync(candidate, inputPath);
  try {
    unlinkSync(backup);
  } catch {
    /* ignore */
  }
  if (!quiet) {
    console.log(
      `${basename(inputPath)}: ${before} → ${after} bytes (${((100 * after) / before).toFixed(1)}%)`,
    );
  }
  return 'ok';
}

function main() {
  const argv = process.argv.slice(2);
  const { qpdfOnly, quiet, scanDir, files: explicitFiles } = parseArgs(argv);

  let files = explicitFiles;
  if (scanDir) {
    const dirAbs = scanDir.startsWith('/') ? scanDir : join(root, scanDir);
    files = collectPdfs(dirAbs);
    if (files.length === 0) {
      console.error(`no PDFs under ${dirAbs}`);
      process.exit(1);
    }
    if (!quiet) console.log(`Found ${files.length} PDF(s) under ${relative(root, dirAbs) || scanDir}`);
  }

  if (files.length === 0) {
    console.error(
      'usage: node scripts/optimize-web-pdf.mjs [--qpdf-only] [--quiet] <file.pdf> [...]\n' +
        '       node scripts/optimize-web-pdf.mjs [--qpdf-only] --dir <directory> [--quiet]',
    );
    process.exit(1);
  }

  const q = spawnSync('qpdf', ['--version'], { encoding: 'utf8' });
  if (q.error || q.status !== 0) {
    console.error('qpdf not found on PATH');
    process.exit(1);
  }
  if (!qpdfOnly) {
    const g = spawnSync('gs', ['--version'], { encoding: 'utf8' });
    if (g.error || g.status !== 0) {
      console.error('gs (Ghostscript) not found on PATH');
      process.exit(1);
    }
  }

  let ok = 0;
  let noop = 0;
  let skip = 0;
  const failed = [];
  let i = 0;
  for (const f of files) {
    i += 1;
    if (quiet) {
      process.stdout.write(`\r[${i}/${files.length}] ${relative(root, f).slice(0, 70).padEnd(70)}`);
    } else {
      console.log(`\n== ${f} ==`);
    }
    const r = optimizeOne(f, qpdfOnly, quiet);
    if (r === 'ok') ok += 1;
    else if (r === 'noop') noop += 1;
    else if (r === 'skip') skip += 1;
    else failed.push(relative(root, f));
  }
  if (quiet) process.stdout.write('\n');
  console.log(
    `\nSummary: ${ok} optimized, ${noop} unchanged (no size win), ${skip} skipped (non-PDF), ${failed.length} failed`,
  );
  if (failed.length) {
    console.error('Failed paths:');
    for (const p of failed) console.error(`  ${p}`);
  }
  process.exit(failed.length > 0 ? 1 : 0);
}

main();

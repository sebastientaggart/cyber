#!/usr/bin/env node
/**
 * Re-encode MP4s for web delivery: fit inside 1280×720, H.264 (yuv420p), CRF 27,
 * preset slow, AAC 96k, +faststart.
 *
 * Usage:
 *   node scripts/transcode-web-mp4.mjs [dir ...]
 *   node scripts/transcode-web-mp4.mjs --dry-run [dir ...]
 *
 * Defaults to: src/threats src/video
 *
 * Writes to a temp file next to the source, then replaces the original on success.
 * Requires: ffmpeg on PATH.
 *
 * QA: spot-check longest outputs in Chrome/Safari; re-check captions if tracks are added later.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, renameSync, unlinkSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CRF = '27';
const PRESET = 'slow';
const AUDIO_BITRATE = '96k';

const VF = [
  'scale=1280:720:force_original_aspect_ratio=decrease',
  'pad=ceil(iw/2)*2:ceil(ih/2)*2:(ow-iw)/2:(oh-ih)/2',
  'format=yuv420p',
].join(',');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dirs = args.filter((a) => a !== '--dry-run');

const targets =
  dirs.length > 0 ? dirs.map((d) => (d.startsWith('/') ? d : join(root, d))) : [join(root, 'src/threats'), join(root, 'src/video')];

function transcodeFile(inputPath) {
  const tmpPath = `${inputPath}.transcode.tmp.mp4`;
  const ffArgs = [
    '-y',
    '-i',
    inputPath,
    '-vf',
    VF,
    '-c:v',
    'libx264',
    '-preset',
    PRESET,
    '-crf',
    CRF,
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-c:a',
    'aac',
    '-b:a',
    AUDIO_BITRATE,
    '-ac',
    '2',
    tmpPath,
  ];
  if (dryRun) {
    console.log(`[dry-run] ffmpeg ${ffArgs.join(' ')}`);
    return true;
  }
  const r = spawnSync('ffmpeg', ffArgs, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`ffmpeg failed for ${inputPath}`);
    try {
      unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
    return false;
  }
  renameSync(tmpPath, inputPath);
  return true;
}

function main() {
  const which = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (which.error || which.status !== 0) {
    console.error('ffmpeg not found on PATH');
    process.exit(1);
  }

  let ok = 0;
  let fail = 0;
  for (const dir of targets) {
    let names;
    try {
      names = readdirSync(dir);
    } catch (e) {
      console.warn(`skip missing dir: ${dir}`, e.message);
      continue;
    }
    const mp4s = names.filter((n) => n.toLowerCase().endsWith('.mp4'));
    for (const name of mp4s) {
      const inputPath = join(dir, name);
      const before = statSync(inputPath).size;
      console.log(`\n--- ${inputPath} (${(before / 1e6).toFixed(1)} MB) ---`);
      if (transcodeFile(inputPath)) {
        const after = statSync(inputPath).size;
        console.log(`done: ${(after / 1e6).toFixed(1)} MB (${((100 * after) / before).toFixed(1)}% of original)`);
        ok += 1;
      } else {
        fail += 1;
      }
    }
  }
  console.log(`\nFinished: ${ok} ok, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main();

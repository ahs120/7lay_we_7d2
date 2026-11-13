// scripts/make-icon.mjs
// Converts src/renderer/assets/logo.png → build/icon.ico using png2icons.
// Called by: npm run icon   (also by predist automatically)
//
// Requirements for logo.png:
//   - Square (width === height)
//   - At least 256 × 256 pixels (512 × 512 recommended)
//   - 24-bit PNG with optional alpha channel (RGBA preferred)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const LOGO_PATH = resolve(root, 'src', 'renderer', 'assets', 'logo.png');
const ICO_PATH  = resolve(root, 'build', 'icon.ico');

// ── Read PNG IHDR to get dimensions ─────────────────────────────────────────

function parsePngDimensions(buf) {
  // PNG signature: 8 bytes, then IHDR chunk
  // IHDR: 4-byte length, 4-byte "IHDR", 4-byte width, 4-byte height
  const PNG_SIG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  for (let i = 0; i < PNG_SIG.length; i++) {
    if (buf[i] !== PNG_SIG[i]) throw new Error('Not a valid PNG file');
  }
  const width  = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Read logo
  let logoBuffer;
  try {
    logoBuffer = await readFile(LOGO_PATH);
  } catch {
    console.error(`\n[make-icon] ERROR: Logo file not found at:\n  ${LOGO_PATH}\n`);
    console.error('Please place your logo (PNG, ≥256×256, square) at that path and re-run.\n');
    process.exit(1);
  }

  // 2. Check dimensions
  let dims;
  try {
    dims = parsePngDimensions(logoBuffer);
  } catch (err) {
    console.error(`[make-icon] ERROR: Failed to parse PNG: ${err.message}`);
    process.exit(1);
  }

  const { width, height } = dims;
  console.log(`[make-icon] Logo size: ${width}×${height}`);

  if (width !== height) {
    console.warn(`[make-icon] WARNING: Logo is not square (${width}×${height}). ICO quality may be poor.`);
  }
  if (width < 256) {
    console.warn(`[make-icon] WARNING: Logo is smaller than 256×256. ICO quality may be poor.`);
  }

  // 3. Generate ICO
  const png2icons = require('png2icons');

  // createICO(input, scalingAlgorithm, numOfColors, usePNG, forWinExe)
  //   scalingAlgorithm: 2 = RESIZE_BICUBIC (good quality, reasonable speed)
  //   numOfColors: 0 = lossless
  //   usePNG: false (use BMP for small sizes → best compatibility)
  //   forWinExe: true → mix of BMP (small) + PNG (large), ideal for Electron exe embedding
  const icoBuffer = png2icons.createICO(logoBuffer, 2, 0, false, true);

  if (!icoBuffer) {
    console.error('[make-icon] ERROR: png2icons returned null — invalid PNG or internal error.');
    process.exit(1);
  }

  // 4. Write output
  await mkdir(resolve(root, 'build'), { recursive: true });
  await writeFile(ICO_PATH, icoBuffer);

  console.log(`[make-icon] icon.ico written to: ${ICO_PATH}`);
  console.log(`[make-icon] ICO size: ${icoBuffer.length} bytes`);
}

main().catch(err => {
  console.error('[make-icon] Unexpected error:', err);
  process.exit(1);
});

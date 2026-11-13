// scripts/make-placeholder-logo.cjs
// Creates a minimal 512x512 orange PNG as a placeholder logo.
// Delete this and replace src/renderer/assets/logo.png with your real logo.
'use strict';
const { writeFileSync, mkdirSync } = require('fs');
const zlib = require('zlib');
const path = require('path');

const W = 512, H = 512;
const rawRow = Buffer.alloc(1 + W * 4);
rawRow[0] = 0;
for (let x = 0; x < W; x++) {
  const off = 1 + x * 4;
  rawRow[off] = 0xE8; rawRow[off+1] = 0x74; rawRow[off+2] = 0x2C; rawRow[off+3] = 0xFF;
}
const rows = Buffer.concat(Array.from({length: H}, () => rawRow));
const compressed = zlib.deflateSync(rows);

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) { c ^= b; for (let k=0;k<8;k++) c=(c>>>1)^(c&1?0xEDB88320:0); }
  return (c^0xffffffff)>>>0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t,data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

const sig = Buffer.from([137,80,78,71,13,10,26,10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W,0); ihdr.writeUInt32BE(H,4);
ihdr[8]=8; ihdr[9]=6; // 8-bit RGBA

const png = Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',compressed), chunk('IEND',Buffer.alloc(0))]);
const outPath = path.resolve(__dirname, '..', 'src', 'renderer', 'assets', 'logo.png');
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, png);
console.log('Created placeholder logo.png at', outPath, '('+png.length+' bytes)');


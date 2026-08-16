/* Generate PWA / favicon icons from the Akademee app icon (iconapp.png).
 * Pure Node — decodes the RGBA PNG (8-bit, any filter type), resizes with
 * bilinear interpolation (premultiplied alpha to avoid dark fringes), and
 * re-encodes minimal PNGs. No external dependencies.
 *
 * Outputs:
 *   public/pwa-512x512.png  (512x512)
 *   public/pwa-192x192.png  (192x192)
 *   public/favicon.png      (64x64)
 */
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const SRC = path.join(__dirname, "..", "src", "assets", "iconapp.png");
const OUT = [
  { file: path.join(__dirname, "..", "public", "pwa-512x512.png"), size: 512 },
  { file: path.join(__dirname, "..", "public", "pwa-192x192.png"), size: 192 },
  { file: path.join(__dirname, "..", "public", "favicon.png"), size: 64 },
];

// ── Decode ──
const buf = fs.readFileSync(SRC);
const w = buf.readUInt32BE(16);
const h = buf.readUInt32BE(20);
const bitDepth = buf[24];
const colorType = buf[25];
if (bitDepth !== 8 || colorType !== 6) {
  console.error(`Unsupported format: bitDepth=${bitDepth} colorType=${colorType} (need 8-bit RGBA)`);
  process.exit(1);
}

let idat = Buffer.alloc(0);
let pos = 8;
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString("ascii", pos + 4, pos + 8);
  if (type === "IDAT") {
    idat = Buffer.concat([idat, buf.slice(pos + 8, pos + 8 + len)]);
  }
  pos += 12 + len;
  if (type === "IEND") break;
}

const raw = zlib.inflateSync(idat);
const stride = w * 4 + 1; // 1 filter byte per row

const srcPx = Buffer.alloc(w * h * 4);
const prev = Buffer.alloc(w * 4);
for (let y = 0; y < h; y++) {
  const row = raw.subarray(y * stride + 1, (y + 1) * stride);
  const filter = raw[y * stride];
  for (let x = 0; x < w * 4; x++) {
    const up = prev[x];
    let v = row[x];
    if (filter === 1) v = (v + (x >= 4 ? srcPx[y * w * 4 + x - 4] : 0)) & 0xff; // Sub
    else if (filter === 2) v = (v + up) & 0xff; // Up
    else if (filter === 3) v = (v + ((x >= 4 ? srcPx[y * w * 4 + x - 4] : 0) + up) >> 1) & 0xff; // Average
    else if (filter === 4) {
      const a = x >= 4 ? srcPx[y * w * 4 + x - 4] : 0;
      const b = up;
      const c = x >= 4 ? prev[x - 4] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      v = (v + pred) & 0xff; // Paeth
    }
    srcPx[y * w * 4 + x] = v;
    prev[x] = v;
  }
}

// ── Bilinear resize (premultiplied alpha) ──
function resize(size) {
  const out = Buffer.alloc(size * size * 4);
  const scale = w / size;
  for (let y = 0; y < size; y++) {
    const sy = (y + 0.5) * scale - 0.5;
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(h - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < size; x++) {
      const sx = (x + 0.5) * scale - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(w - 1, x0 + 1);
      const fx = sx - x0;
      const o = (y * size + x) * 4;
      let a = 0, r = 0, g = 0, b = 0;
      for (let dy = 0; dy < 2; dy++) {
        const rowY = dy === 0 ? y0 : y1;
        const wy = dy === 0 ? 1 - fy : fy;
        for (let dx = 0; dx < 2; dx++) {
          const colX = dx === 0 ? x0 : x1;
          const wx = dx === 0 ? 1 - fx : fx;
          const i = (rowY * w + colX) * 4;
          const wa = wx * wy;
          const alpha = srcPx[i + 3];
          a += alpha * wa;
          r += srcPx[i] * alpha * wa;
          g += srcPx[i + 1] * alpha * wa;
          b += srcPx[i + 2] * alpha * wa;
        }
      }
      out[o + 3] = Math.round(a);
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      } else {
        out[o] = out[o + 1] = out[o + 2] = 0;
      }
    }
  }
  return out;
}

// ── Encode minimal PNG (all rows filter 0) ──
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowStride = size * 4 + 1;
  const scanlines = Buffer.alloc(size * rowStride);
  for (let y = 0; y < size; y++) {
    scanlines[y * rowStride] = 0; // filter None
    pixels.copy(scanlines, y * rowStride + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const { file, size } of OUT) {
  const png = encodePNG(size, resize(size));
  fs.writeFileSync(file, png);
  console.log(`Wrote ${file} (${size}x${size}, ${png.length} bytes)`);
}

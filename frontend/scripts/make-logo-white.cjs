/* Generate a white version of the Akademee logo (LogoWhite.png).
 * Pure Node — decodes the RGBA PNG (filter type 2 / Up), replaces every
 * visible pixel with pure white while keeping its alpha channel, and
 * re-encodes a minimal PNG. No external dependencies. */
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const SRC = path.join(__dirname, "..", "src", "assets", "Logo.png");
const DST = path.join(__dirname, "..", "src", "assets", "LogoWhite.png");

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

// Unfilter (type 2 = Up for all rows, per inspection; handle generic too)
const pixels = Buffer.alloc(w * h * 4);
const prev = Buffer.alloc(w * 4);
for (let y = 0; y < h; y++) {
  const row = raw.subarray(y * stride + 1, (y + 1) * stride);
  const filter = raw[y * stride];
  for (let x = 0; x < w * 4; x++) {
    const up = prev[x];
    let v = row[x];
    if (filter === 1) v = (v + (x >= 4 ? pixels[y * w * 4 + x - 4] : 0)) & 0xff; // Sub
    else if (filter === 2) v = (v + up) & 0xff; // Up
    else if (filter === 3) v = (v + ((x >= 4 ? pixels[y * w * 4 + x - 4] : 0) + up) >> 1) & 0xff; // Average
    else if (filter === 4) {
      const a = x >= 4 ? pixels[y * w * 4 + x - 4] : 0;
      const b = up;
      const c = x >= 4 ? prev[x - 4] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      v = (v + pred) & 0xff; // Paeth
    }
    pixels[y * w * 4 + x] = v;
    prev[x] = v;
  }
}

// ── Recolor: every visible pixel → pure white (keep alpha) ──
for (let i = 0; i < pixels.length; i += 4) {
  const a = pixels[i + 3];
  if (a > 0) {
    pixels[i] = 255;
    pixels[i + 1] = 255;
    pixels[i + 2] = 255;
  }
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

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(w, 0);
ihdr.writeUInt32BE(h, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const scanlines = Buffer.alloc(h * stride);
for (let y = 0; y < h; y++) {
  scanlines[y * stride] = 0; // filter None
  pixels.copy(scanlines, y * stride + 1, y * w * 4, (y + 1) * w * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

fs.writeFileSync(DST, png);
console.log(`Wrote ${DST} (${w}x${h}, ${png.length} bytes)`);

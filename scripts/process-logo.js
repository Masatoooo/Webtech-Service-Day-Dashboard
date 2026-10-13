const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  let pos = 8;
  const idatChunks = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const idat = Buffer.concat(idatChunks);
  const raw = zlib.inflateSync(idat);
  const pixels = Buffer.alloc(width * height * 4);
  const bpp = 4;
  const stride = width * bpp;
  let rawOffset = 0;
  const prevRow = Buffer.alloc(stride);
  const currRow = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++];
    for (let x = 0; x < stride; x++) currRow[x] = raw[rawOffset++];
    if (filter === 1) {
      for (let x = bpp; x < stride; x++) currRow[x] = (currRow[x] + currRow[x - bpp]) & 0xff;
    } else if (filter === 2) {
      for (let x = 0; x < stride; x++) currRow[x] = (currRow[x] + prevRow[x]) & 0xff;
    } else if (filter === 3) {
      for (let x = 0; x < stride; x++) {
        const left = x >= bpp ? currRow[x - bpp] : 0;
        currRow[x] = (currRow[x] + Math.floor((left + prevRow[x]) / 2)) & 0xff;
      }
    } else if (filter === 4) {
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? currRow[x - bpp] : 0;
        const b = prevRow[x];
        const c = x >= bpp ? prevRow[x - bpp] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        currRow[x] = (currRow[x] + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c))) & 0xff;
      }
    }
    currRow.copy(pixels, y * stride);
    currRow.copy(prevRow);
  }
  return { width, height, pixels };
}

function encodePNG(width, height, rgbaBuffer) {
  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));
  let fOffset = 0;
  for (let y = 0; y < height; y++) {
    filtered[fOffset++] = 0;
    rgbaBuffer.copy(filtered, fOffset, y * stride, (y + 1) * stride);
    fOffset += stride;
  }
  const idatData = zlib.deflateSync(filtered);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const crc32 = (type, data) => {
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    let crc = -1;
    const buf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ -1) >>> 0;
  };

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(type, data), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const srcFile = 'C:\\Users\\Komang Masato Kaneko\\.gemini\\antigravity-ide\\brain\\01199394-5fe6-4602-ab12-ffe24cf5ccc4\\.user_uploaded\\media_1791893348243.png';
const { width, height, pixels } = decodePNG(srcFile);

// Sample background color from 4 corners
const bgR = 244, bgG = 242, bgB = 242;

// The swirl icon is exactly from x=39 to x=101 (columns 102 to 114 are completely empty gap)
const iconEnd = 101;
const textStart = 115;
console.log('Icon end:', iconEnd, 'Text start:', textStart);

// Bounding box for icon:
let iconMinY = height, iconMaxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 39; x <= iconEnd; x++) {
    const idx = (y * width + x) * 4;
    const diff = Math.abs(pixels[idx] - bgR) + Math.abs(pixels[idx+1] - bgG) + Math.abs(pixels[idx+2] - bgB);
    if (diff > 45) {
      if (y < iconMinY) iconMinY = y;
      if (y > iconMaxY) iconMaxY = y;
    }
  }
}
const iconW = iconEnd - 39 + 1;
const iconH = iconMaxY - iconMinY + 1;
console.log('Icon dimensions:', iconW, 'x', iconH, 'iconMinY:', iconMinY, 'iconMaxY:', iconMaxY);

// 1. Process full logo with transparent background and comfortable padding (12px padding)
const pad = 8;
const cropMinX = Math.max(0, 39 - pad);
const cropMaxX = Math.min(width - 1, 553 + pad);
const cropMinY = Math.max(0, 65 - pad);
const cropMaxY = Math.min(height - 1, 137 + pad);
const fullW = cropMaxX - cropMinX + 1;
const fullH = cropMaxY - cropMinY + 1;

const fullBuffer = Buffer.alloc(fullW * fullH * 4);

for (let y = 0; y < fullH; y++) {
  for (let x = 0; x < fullW; x++) {
    const srcX = cropMinX + x;
    const srcY = cropMinY + y;
    const srcIdx = (srcY * width + srcX) * 4;
    const dstIdx = (y * fullW + x) * 4;

    const r = pixels[srcIdx];
    const g = pixels[srcIdx + 1];
    const b = pixels[srcIdx + 2];

    const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
    
    if (diff < 20) {
      // Background transparent
      fullBuffer[dstIdx] = 0;
      fullBuffer[dstIdx + 1] = 0;
      fullBuffer[dstIdx + 2] = 0;
      fullBuffer[dstIdx + 3] = 0;
    } else if (diff < 55) {
      // Soft edge anti-aliasing
      const alpha = Math.min(255, Math.floor(((diff - 20) / 35) * 255));
      fullBuffer[dstIdx] = r;
      fullBuffer[dstIdx + 1] = g;
      fullBuffer[dstIdx + 2] = b;
      fullBuffer[dstIdx + 3] = alpha;
    } else {
      fullBuffer[dstIdx] = r;
      fullBuffer[dstIdx + 1] = g;
      fullBuffer[dstIdx + 2] = b;
      fullBuffer[dstIdx + 3] = 255;
    }
  }
}

fs.writeFileSync('src/assets/images/service-day-logo.png', encodePNG(fullW, fullH, fullBuffer));
console.log('Saved transparent full logo:', fullW, 'x', fullH);

// 2. Process circular swirl icon (square 1:1, perfectly centered)
const iconPad = 4;
const iMinX = 39 - iconPad;
const iMaxX = iconEnd + iconPad;
const iMinY = iconMinY - iconPad;
const iMaxY = iconMaxY + iconPad;
const iW = iMaxX - iMinX + 1;
const iH = iMaxY - iMinY + 1;
const size = Math.max(iW, iH);
const iconBuffer = Buffer.alloc(size * size * 4); // all zeros (transparent)

const offX = Math.floor((size - iW) / 2);
const offY = Math.floor((size - iH) / 2);

for (let y = 0; y < iH; y++) {
  for (let x = 0; x < iW; x++) {
    const srcX = iMinX + x;
    const srcY = iMinY + y;
    if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = ((y + offY) * size + (x + offX)) * 4;

      const r = pixels[srcIdx];
      const g = pixels[srcIdx + 1];
      const b = pixels[srcIdx + 2];
      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

      if (diff < 20) {
        iconBuffer[dstIdx + 3] = 0;
      } else if (diff < 55) {
        const alpha = Math.min(255, Math.floor(((diff - 20) / 35) * 255));
        iconBuffer[dstIdx] = r;
        iconBuffer[dstIdx + 1] = g;
        iconBuffer[dstIdx + 2] = b;
        iconBuffer[dstIdx + 3] = alpha;
      } else {
        iconBuffer[dstIdx] = r;
        iconBuffer[dstIdx + 1] = g;
        iconBuffer[dstIdx + 2] = b;
        iconBuffer[dstIdx + 3] = 255;
      }
    }
  }
}

fs.writeFileSync('src/assets/images/service-day-icon.png', encodePNG(size, size, iconBuffer));
console.log('Saved transparent icon mark:', size, 'x', size);

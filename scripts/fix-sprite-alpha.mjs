/**
 * Aseprite indexed PNGs: background is palette #34 (magenta) but tRNS only
 * marks index 0 transparent — causes visible magenta "silhouettes".
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const spritesDir = path.join(__dirname, "..", "public", "sprites");

const MAGENTA_INDEX = 34;
const FILES = ["kuromi.png", "simba.png", "duckboat.png"];

function patchPngTrns(filePath) {
  const buf = fs.readFileSync(filePath);
  const out = [];
  let off = 8;
  out.push(buf.subarray(0, 8));

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    let data = Buffer.from(buf.subarray(off + 8, off + 8 + len));

    if (type === "tRNS" && data.length > MAGENTA_INDEX) {
      data[MAGENTA_INDEX] = 0;
      console.log(`  tRNS: index ${MAGENTA_INDEX} → transparent`);
    }

    const chunk = Buffer.alloc(12 + data.length);
    chunk.writeUInt32BE(data.length, 0);
    chunk.write(type, 4, 4);
    data.copy(chunk, 8);
    const crc = crc32(chunk.subarray(4, 8 + data.length));
    chunk.writeUInt32BE(crc, 8 + data.length);
    out.push(chunk);
    off += 12 + len;
  }

  fs.writeFileSync(filePath, Buffer.concat(out));
}

// PNG CRC32
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

for (const file of FILES) {
  const filePath = path.join(spritesDir, file);
  console.log(file);
  patchPngTrns(filePath);
}

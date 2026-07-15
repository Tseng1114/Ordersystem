import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";

const outputDirectory = new URL("../public/icons/", import.meta.url);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  typeBuffer.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), data.length + 8);
  return result;
}

function createPng(size, maskable = false) {
  const scale = 4;
  const dimension = size * scale;
  const pixels = Buffer.alloc(dimension * dimension * 4);
  const background = [39, 55, 77, 255];

  function setPixel(x, y, color) {
    const offset = (y * dimension + x) * 4;
    pixels.set(color, offset);
  }

  function insideRoundedRect(x, y, left, top, right, bottom, radius) {
    const closestX = Math.max(left + radius, Math.min(x, right - radius));
    const closestY = Math.max(top + radius, Math.min(y, bottom - radius));
    const deltaX = x - closestX;
    const deltaY = y - closestY;
    return deltaX * deltaX + deltaY * deltaY <= radius * radius;
  }

  function insidePolygon(x, y, points) {
    let inside = false;
    for (let current = 0, previous = points.length - 1; current < points.length; previous = current, current += 1) {
      const [currentX, currentY] = points[current];
      const [previousX, previousY] = points[previous];
      if (
        (currentY > y) !== (previousY > y) &&
        x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX
      ) inside = !inside;
    }
    return inside;
  }

  const inset = maskable ? 0.2 : 0.12;
  const cup = [
    [0.29, 0.36],
    [0.35, 0.76],
    [0.65, 0.76],
    [0.71, 0.36],
  ];

  for (let y = 0; y < dimension; y += 1) {
    for (let x = 0; x < dimension; x += 1) {
      const unitX = (x + 0.5) / dimension;
      const unitY = (y + 0.5) / dimension;
      let color = background;

      if (insidePolygon(unitX, unitY, cup)) color = [245, 158, 11, 255];
      if (insideRoundedRect(unitX, unitY, 0.26, 0.31, 0.74, 0.39, 0.04)) color = [251, 191, 36, 255];
      if (insideRoundedRect(unitX, unitY, 0.47, inset, 0.53, 0.49, 0.03)) color = [255, 255, 255, 255];
      if (insideRoundedRect(unitX, unitY, 0.47, inset, 0.66, inset + 0.065, 0.03)) color = [255, 255, 255, 255];
      setPixel(x, y, color);
    }
  }

  const reduced = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let offsetY = 0; offsetY < scale; offsetY += 1) {
        for (let offsetX = 0; offsetX < scale; offsetX += 1) {
          const source = (((y * scale + offsetY) * dimension) + x * scale + offsetX) * 4;
          for (let channel = 0; channel < 4; channel += 1) totals[channel] += pixels[source + channel];
        }
      }
      const target = (y * size + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) reduced[target + channel] = Math.round(totals[channel] / 16);
    }
  }

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    scanlines[row] = 0;
    reduced.copy(scanlines, row + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(new URL("apple-touch-icon.png", outputDirectory), createPng(180)),
  writeFile(new URL("app-icon-192.png", outputDirectory), createPng(192)),
  writeFile(new URL("app-icon-512.png", outputDirectory), createPng(512)),
  writeFile(new URL("app-icon-maskable-512.png", outputDirectory), createPng(512, true)),
]);

console.log("Generated PWA icons.");

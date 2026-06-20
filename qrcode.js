function getQrUrl(token) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("qr", token);
  return url.toString();
}

function makeQrSvg(text, options = {}) {
  const qr = makeQrMatrix(text);
  const scale = options.scale || 5;
  const quiet = options.quiet || 4;
  const size = qr.length + quiet * 2;
  let path = "";

  for (let y = 0; y < qr.length; y += 1) {
    for (let x = 0; x < qr.length; x += 1) {
      if (qr[y][x]) path += `M${x + quiet},${y + quiet}h1v1h-1z`;
    }
  }

  return `
    <svg class="qr-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * scale}" height="${size * scale}" role="img" aria-label="QR-Code">
      <rect width="${size}" height="${size}" fill="#ffffff"/>
      <path d="${path}" fill="#17324d"/>
    </svg>
  `;
}

function makeQrMatrix(text) {
  const version = 5;
  const size = 17 + version * 4;
  const dataCodewords = 108;
  const ecCodewords = 26;
  const bytes = Array.from(new TextEncoder().encode(text));

  if (bytes.length > 106) {
    throw new Error("QR-URL ist zu lang.");
  }

  const data = makeQrDataCodewords(bytes, dataCodewords);
  const ecc = reedSolomonRemainder(data, ecCodewords);
  const codewords = [...data, ...ecc];
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  drawFunctionPatterns(modules, reserved, version);
  placeDataBits(modules, reserved, codewords);
  applyMask0(modules, reserved);
  drawFormatBits(modules, reserved);
  return modules;
}

function makeQrDataCodewords(bytes, capacity) {
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));
  const maxBits = capacity * 8;
  appendBits(bits, 0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    let value = 0;
    for (let bit = 0; bit < 8; bit += 1) value = (value << 1) | bits[index + bit];
    codewords.push(value);
  }

  const pads = [0xec, 0x11];
  let padIndex = 0;
  while (codewords.length < capacity) {
    codewords.push(pads[padIndex % 2]);
    padIndex += 1;
  }
  return codewords;
}

function appendBits(bits, value, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
}

function drawFunctionPatterns(modules, reserved, version) {
  const size = modules.length;
  drawFinder(modules, reserved, 0, 0);
  drawFinder(modules, reserved, size - 7, 0);
  drawFinder(modules, reserved, 0, size - 7);

  for (let i = 8; i < size - 8; i += 1) {
    setFunctionModule(modules, reserved, i, 6, i % 2 === 0);
    setFunctionModule(modules, reserved, 6, i, i % 2 === 0);
  }

  drawAlignment(modules, reserved, size - 7, size - 7);
  setFunctionModule(modules, reserved, 8, 4 * version + 9, true);

  for (let i = 0; i < 9; i += 1) {
    reserve(modules, reserved, 8, i);
    reserve(modules, reserved, i, 8);
  }
  for (let i = 0; i < 8; i += 1) {
    reserve(modules, reserved, size - 1 - i, 8);
    reserve(modules, reserved, 8, size - 1 - i);
  }
}

function drawFinder(modules, reserved, left, top) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const xx = left + x;
      const yy = top + y;
      if (xx < 0 || yy < 0 || xx >= modules.length || yy >= modules.length) continue;
      const dark = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
      setFunctionModule(modules, reserved, xx, yy, dark);
    }
  }
}

function drawAlignment(modules, reserved, centerX, centerY) {
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      const dark = Math.max(Math.abs(x), Math.abs(y)) !== 1;
      setFunctionModule(modules, reserved, centerX + x, centerY + y, dark);
    }
  }
}

function reserve(modules, reserved, x, y) {
  if (x < 0 || y < 0 || x >= modules.length || y >= modules.length) return;
  reserved[y][x] = true;
}

function setFunctionModule(modules, reserved, x, y, dark) {
  if (x < 0 || y < 0 || x >= modules.length || y >= modules.length) return;
  modules[y][x] = Boolean(dark);
  reserved[y][x] = true;
}

function placeDataBits(modules, reserved, codewords) {
  const bits = [];
  codewords.forEach((codeword) => appendBits(bits, codeword, 8));
  const size = modules.length;
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let dx = 0; dx < 2; dx += 1) {
        const x = right - dx;
        if (reserved[y][x]) continue;
        modules[y][x] = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
}

function applyMask0(modules, reserved) {
  for (let y = 0; y < modules.length; y += 1) {
    for (let x = 0; x < modules.length; x += 1) {
      if (!reserved[y][x] && (x + y) % 2 === 0) modules[y][x] = !modules[y][x];
    }
  }
}

function drawFormatBits(modules, reserved) {
  const size = modules.length;
  const format = makeFormatBits(1, 0);
  const getBit = (i) => ((format >> i) & 1) === 1;

  for (let i = 0; i <= 5; i += 1) setFunctionModule(modules, reserved, 8, i, getBit(i));
  setFunctionModule(modules, reserved, 8, 7, getBit(6));
  setFunctionModule(modules, reserved, 8, 8, getBit(7));
  setFunctionModule(modules, reserved, 7, 8, getBit(8));
  for (let i = 9; i < 15; i += 1) setFunctionModule(modules, reserved, 14 - i, 8, getBit(i));

  for (let i = 0; i < 8; i += 1) setFunctionModule(modules, reserved, size - 1 - i, 8, getBit(i));
  for (let i = 8; i < 15; i += 1) setFunctionModule(modules, reserved, 8, size - 15 + i, getBit(i));
}

function makeFormatBits(eclBits, mask) {
  let data = (eclBits << 3) | mask;
  let value = data << 10;
  const generator = 0x537;
  for (let bit = 14; bit >= 10; bit -= 1) {
    if (((value >> bit) & 1) !== 0) value ^= generator << (bit - 10);
  }
  return (((data << 10) | value) ^ 0x5412) & 0x7fff;
}

function reedSolomonRemainder(data, degree) {
  const generator = reedSolomonGenerator(degree);
  const result = Array(degree).fill(0);

  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);
    for (let i = 0; i < degree; i += 1) {
      result[i] ^= gfMultiply(generator[i], factor);
    }
  });
  return result;
}

function reedSolomonGenerator(degree) {
  let result = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = Array(result.length + 1).fill(0);
    for (let j = 0; j < result.length; j += 1) {
      next[j] ^= gfMultiply(result[j], 1);
      next[j + 1] ^= gfMultiply(result[j], gfPow(2, i));
    }
    result = next;
  }
  return result.slice(1);
}

function gfPow(value, power) {
  let result = 1;
  for (let i = 0; i < power; i += 1) result = gfMultiply(result, value);
  return result;
}

function gfMultiply(a, b) {
  let result = 0;
  for (let i = 0; i < 8; i += 1) {
    if ((b & 1) !== 0) result ^= a;
    const carry = (a & 0x80) !== 0;
    a = (a << 1) & 0xff;
    if (carry) a ^= 0x1d;
    b >>>= 1;
  }
  return result;
}

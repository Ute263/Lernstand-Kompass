/* Lokale QR-Code-Erzeugung für Tier-Zugänge. Keine externen Dienste.
 * Paket 3e: QR-Version 4 statt Version 5.
 * Der Kinderlink passt vollständig in Version 4-L und erhält dadurch größere,
 * auf Handy/iPad deutlich zuverlässiger lesbare Module.
 */
(function () {
  const VERSION = 4;
  const SIZE = 17 + VERSION * 4;
  const DATA_CODEWORDS = 80;
  const ECC_CODEWORDS = 20;

  function makeQrSvg(text, options = {}) {
    const scale = Number(options.scale || 5);
    const quiet = Number(options.quiet || 4);
    const matrix = makeQrMatrix(String(text || ""));
    const size = matrix.length + quiet * 2;
    let path = "";
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (matrix[y][x]) path += `M${x + quiet},${y + quiet}h1v1h-1z`;
      }
    }
    return `
      <svg class="qr-svg" xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 ${size} ${size}"
           width="${size * scale}" height="${size * scale}"
           shape-rendering="crispEdges"
           role="img" aria-label="Tier-QR-Code">
        <rect width="100%" height="100%" fill="#fff"/>
        <path d="${path}" fill="#000"/>
      </svg>
    `;
  }

  function makeQrMatrix(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    if (bytes.length > 78) throw new Error("Tier-Code ist zu lang.");
    const data = makeDataCodewords(bytes);
    const ecc = reedSolomonRemainder(data, reedSolomonGenerator(ECC_CODEWORDS));
    const codewords = [...data, ...ecc];

    const modules = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    const isFunction = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

    drawFunctionPatterns(modules, isFunction);
    drawCodewords(modules, isFunction, codewords);
    applyMask(modules, isFunction);
    drawFormatBits(modules, isFunction);
    return modules;
  }

  function makeDataCodewords(bytes) {
    const bits = [];
    appendBits(bits, 0x4, 4); // Byte mode
    appendBits(bits, bytes.length, 8);
    bytes.forEach((byte) => appendBits(bits, byte, 8));

    appendBits(bits, 0, Math.min(4, DATA_CODEWORDS * 8 - bits.length));
    while (bits.length % 8) bits.push(0);

    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
    }

    for (let pad = 0xec; data.length < DATA_CODEWORDS; pad = pad === 0xec ? 0x11 : 0xec) {
      data.push(pad);
    }
    return data;
  }

  function appendBits(bits, value, length) {
    for (let i = length - 1; i >= 0; i -= 1) {
      bits.push((value >>> i) & 1);
    }
  }

  function drawFunctionPatterns(modules, isFunction) {
    drawFinder(modules, isFunction, 3, 3);
    drawFinder(modules, isFunction, SIZE - 4, 3);
    drawFinder(modules, isFunction, 3, SIZE - 4);

    // Version 4: Alignment-Zentrum bei 26/26.
    drawAlignment(modules, isFunction, 26, 26);

    // Timing-Muster zwischen den Finder-Mustern.
    for (let i = 8; i < SIZE - 8; i += 1) {
      setFunction(modules, isFunction, 6, i, i % 2 === 0);
      setFunction(modules, isFunction, i, 6, i % 2 === 0);
    }

    // Formatbits reservieren.
    for (let i = 0; i < 6; i += 1) {
      setReserved(isFunction, 8, i);
      setReserved(isFunction, i, 8);
    }
    setReserved(isFunction, 8, 7);
    setReserved(isFunction, 8, 8);
    setReserved(isFunction, 7, 8);

    for (let i = 0; i < 8; i += 1) {
      setReserved(isFunction, SIZE - 1 - i, 8);
    }
    for (let i = 8; i < 15; i += 1) {
      setReserved(isFunction, 8, SIZE - 15 + i);
    }

    // Festes dunkles Modul.
    setFunction(modules, isFunction, 8, SIZE - 8, true);
  }

  function drawFinder(modules, isFunction, cx, cy) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(modules, isFunction, x, y, dist !== 2 && dist !== 4);
      }
    }
  }

  function drawAlignment(modules, isFunction, cx, cy) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        setFunction(
          modules,
          isFunction,
          cx + dx,
          cy + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1
        );
      }
    }
  }

  function setFunction(modules, isFunction, x, y, dark) {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  }

  function setReserved(isFunction, x, y) {
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) {
      isFunction[y][x] = true;
    }
  }

  function drawCodewords(modules, isFunction, codewords) {
    const bits = [];
    codewords.forEach((word) => appendBits(bits, word, 8));

    let bitIndex = 0;
    let upward = true;

    for (let right = SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1;

      for (let vert = 0; vert < SIZE; vert += 1) {
        const y = upward ? SIZE - 1 - vert : vert;

        for (let j = 0; j < 2; j += 1) {
          const x = right - j;
          if (!isFunction[y][x] && bitIndex < bits.length) {
            modules[y][x] = bits[bitIndex] === 1;
            bitIndex += 1;
          }
        }
      }
      upward = !upward;
    }
  }

  function applyMask(modules, isFunction) {
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        if (!isFunction[y][x] && (x + y) % 2 === 0) {
          modules[y][x] = !modules[y][x];
        }
      }
    }
  }

  function drawFormatBits(modules, isFunction) {
    // Fehlerkorrektur L (01), Maske 0.
    const data = (1 << 3) | 0;
    let rem = data << 10;
    const generator = 0x537;

    for (let i = 14; i >= 10; i -= 1) {
      if (((rem >>> i) & 1) !== 0) {
        rem ^= generator << (i - 10);
      }
    }

    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i += 1) {
      setFunction(modules, isFunction, 8, i, getBit(bits, i));
    }
    setFunction(modules, isFunction, 8, 7, getBit(bits, 6));
    setFunction(modules, isFunction, 8, 8, getBit(bits, 7));
    setFunction(modules, isFunction, 7, 8, getBit(bits, 8));

    for (let i = 9; i < 15; i += 1) {
      setFunction(modules, isFunction, 14 - i, 8, getBit(bits, i));
    }

    for (let i = 0; i < 8; i += 1) {
      setFunction(modules, isFunction, SIZE - 1 - i, 8, getBit(bits, i));
    }

    for (let i = 8; i < 15; i += 1) {
      setFunction(modules, isFunction, 8, SIZE - 15 + i, getBit(bits, i));
    }

    setFunction(modules, isFunction, 8, SIZE - 8, true);
  }

  function getBit(value, index) {
    return ((value >>> index) & 1) !== 0;
  }

  const exp = [];
  const log = Array(256).fill(0);
  let x = 1;

  for (let i = 0; i < 255; i += 1) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) {
    exp[i] = exp[i - 255];
  }

  function gfMultiply(a, b) {
    return a && b ? exp[log[a] + log[b]] : 0;
  }

  function reedSolomonGenerator(degree) {
    let result = [1];

    for (let i = 0; i < degree; i += 1) {
      const next = Array(result.length + 1).fill(0);

      result.forEach((coef, index) => {
        next[index] ^= coef;
        next[index + 1] ^= gfMultiply(coef, exp[i]);
      });

      result = next;
    }
    return result;
  }

  function reedSolomonRemainder(data, generator) {
    const result = Array(generator.length - 1).fill(0);

    data.forEach((byte) => {
      const factor = byte ^ result.shift();
      result.push(0);

      generator.slice(1).forEach((coef, index) => {
        result[index] ^= gfMultiply(coef, factor);
      });
    });

    return result;
  }

  window.makeQrSvg = makeQrSvg;
})();

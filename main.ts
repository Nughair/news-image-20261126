// THE WORLD IN ONE DAY — Thursday 26 November 2026.
// A pixel newspaper drawn from scratch: software rasteriser, hand-made
// 5x7 bitmap font, hand-drawn world map, minimal PNG encoder.
// Standard library only. No clock, no randomness, no network.
// Writes /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png).
import * as fs from "node:fs";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;
const PAPER: RGB = [247, 243, 232];
const INK: RGB = [18, 18, 18];
const RED: RGB = [178, 34, 28];
const BLUE: RGB = [28, 68, 128];
const GREEN: RGB = [24, 120, 60];
const GREY: RGB = [110, 108, 100];
const LIGHT: RGB = [232, 226, 210];
const SKY: RGB = [52, 74, 110];
const GOLD: RGB = [196, 148, 44];

type RGB = [number, number, number];

const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = PAPER[0]; px[i * 3 + 1] = PAPER[1]; px[i * 3 + 2] = PAPER[2];
}

function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setPx(i, j, c);
}
function hline(x0: number, x1: number, y: number, c: RGB): void {
  for (let x = x0; x <= x1; x++) setPx(x, y, c);
}
function vline(x: number, y0: number, y1: number, c: RGB): void {
  for (let y = y0; y <= y1; y++) setPx(x, y, c);
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) {
    setPx(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) setPx(x, y, c);
}
function ring(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 2) {
    const t = (a * Math.PI) / 180;
    setPx(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}
function ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let y = cy - ry; y <= cy + ry; y++)
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPx(x, y, c);
    }
}

// ---- 5x7 bitmap font (uppercase + digits + punctuation). Each glyph is
// 7 rows; bit 4 is the leftmost pixel. Only the characters used below.
const F: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0b01100, 0b01100],
  ",": [0, 0, 0, 0, 0b01100, 0b00100, 0b01000],
  ":": [0, 0b01100, 0b01100, 0, 0b01100, 0b01100, 0],
  ";": [0, 0b01100, 0b01100, 0, 0b01100, 0b00100, 0b01000],
  "'": [0b00100, 0b00100, 0b01000, 0, 0, 0, 0],
  "-": [0, 0, 0, 0b01110, 0, 0, 0],
  "+": [0, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0],
  "%": [0b11001, 0b11010, 0b00010, 0b00100, 0b01000, 0b01011, 0b10011],
  "(": [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ")": [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  "/": [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  "&": [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0, 0b00100],
  "?": [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0, 0b00100],
  "=": [0, 0, 0b11111, 0, 0b11111, 0, 0],
  "*": [0, 0b10101, 0b01110, 0b11111, 0b01110, 0b10101, 0],
  '"': [0b01010, 0b01010, 0, 0, 0, 0, 0],
  $: [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
  ">": [0b10000, 0b01000, 0b00100, 0b00010, 0b00100, 0b01000, 0b10000],
  "<": [0b00001, 0b00010, 0b00100, 0b01000, 0b00100, 0b00010, 0b00001],
  _: [0, 0, 0, 0, 0, 0, 0b11111],
  "#": [0b01010, 0b01010, 0b11111, 0b01010, 0b11111, 0b01010, 0b01010],
};

function charW(s: number): number { return 6 * s; }
function textW(t: string, s: number): number { return t.length * 6 * s - s; }

function drawChar(x: number, y: number, ch: string, s: number, c: RGB): void {
  const g = F[ch] || F["?"];
  for (let r = 0; r < 7; r++)
    for (let col = 0; col < 5; col++)
      if ((g[r] >> (4 - col)) & 1)
        rect(x + col * s, y + r * s, s, s, c);
}
function text(x: number, y: number, t: string, s: number, c: RGB): void {
  for (let i = 0; i < t.length; i++) drawChar(x + i * 6 * s, y, t[i], s, c);
}
function textC(cx: number, y: number, t: string, s: number, c: RGB): void {
  text(cx - Math.floor(textW(t, s) / 2), y, t, s, c);
}
function wrap(t: string, maxW: number, s: number): string[] {
  const words = t.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textW(trial, s) <= maxW || !cur) cur = trial;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function block(x: number, y: number, maxW: number, t: string, s: number, c: RGB, lh: number): number {
  const lines = wrap(t, maxW, s);
  for (let i = 0; i < lines.length; i++) text(x, y + i * lh, lines[i], s, c);
  return y + lines.length * lh;
}

// ---- minimal PNG encoder (zlib deflate, CRC32) ----
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- world map: coarse land spans, 26 rows x 96 cols (equirectangular) ----
// Each row: [startCol, endCol] spans of land. Col 0 = lon -180, col 95 = +180.
const LAND: number[][][] = [
  [[8, 28], [32, 35], [60, 95]],
  [[4, 30], [32, 35], [48, 52], [58, 95]],
  [[3, 31], [45, 46], [48, 56], [58, 95]],
  [[3, 30], [46, 57], [59, 95]],
  [[4, 29], [47, 58], [60, 95]],
  [[5, 28], [47, 59], [61, 94]],
  [[6, 27], [48, 59], [62, 93]],
  [[8, 26], [46, 60], [63, 92]],
  [[10, 25], [45, 60], [65, 90]],
  [[12, 24], [45, 60], [68, 88]],
  [[14, 23], [46, 60], [70, 86]],
  [[16, 22], [47, 60], [74, 84]],
  [[20, 22], [27, 37], [48, 59], [76, 82]],
  [[27, 38], [49, 58], [78, 84]],
  [[28, 38], [50, 57]],
  [[29, 38], [51, 56]],
  [[30, 37], [52, 55]],
  [[30, 36], [79, 88]],
  [[31, 36], [79, 89]],
  [[31, 35], [80, 89]],
  [[32, 34], [81, 87]],
  [[32, 33], [82, 85]],
  [[32, 33], [93, 94]],
  [[33, 33], [93, 95]],
  [[33, 33]],
  [[34, 34]],
];
// [label, lon, lat] — pins from STORIES.md
const PINS: [string, number, number][] = [
  ["1", -74.01, 40.71], ["2", 139.69, 35.68], ["3", 126.97, 37.56],
  ["4", 114.17, 22.32], ["5", 121.47, 31.23], ["6", 151.21, -33.87],
  ["7", -83.05, 42.33], ["8", -97.11, 32.74], ["9", -78.79, 42.77],
  ["10", 6.14, 46.20], ["11", 11.34, 44.49], ["12", 77.21, 28.61],
  ["13", 80.95, 26.85], ["14", 125.75, 39.03], ["15", 34.45, 31.50],
  ["16", 36.82, -1.29], ["17", 13.40, 52.52], ["18", 149.13, -35.28],
  ["19", 121.56, 25.03], ["20", 72.88, 19.08], ["21", 102.03, 27.90],
  ["23", 178.44, -18.14], ["24", -0.19, 5.60], ["25", 13.16, 11.83],
  ["26", 28.32, -15.39], ["27", 32.58, 0.35], ["28", 39.27, -6.79],
];

function drawMap(mx: number, my: number, mw: number, mh: number): void {
  rect(mx, my, mw, mh, [214, 228, 238]); // ocean
  const cw = mw / 96, ch = mh / 26;
  for (let r = 0; r < 26; r++)
    for (const [a, b] of LAND[r])
      rect(Math.round(mx + a * cw), Math.round(my + r * ch),
        Math.round((b - a + 1) * cw), Math.max(1, Math.round(ch)), [168, 158, 128]);
  // graticule
  for (let i = 1; i < 6; i++) vline(Math.round(mx + (mw * i) / 6), my, my + mh - 1, [190, 205, 218]);
  for (const [lab, lon, lat] of PINS) {
    const x = Math.round(mx + ((lon + 180) / 360) * mw);
    const y = Math.round(my + ((75 - lat) / 135) * mh);
    disc(x, y, 4, RED);
    ring(x, y, 4, [255, 255, 255]);
    if (x > mx + mw - 26) text(x - 16, y - 7, lab, 1, INK);
    else text(x + 5, y - 7, lab, 1, INK);
  }
}

// ---- lead scenes (clipped by hand: all drawing stays inside the panel) ----
function sceneStorm(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  // rain streaks
  for (let i = 0; i < 46; i++) {
    const rx = x + ((i * 67) % w), ry = y + ((i * 41) % (h - 14));
    line(rx, ry, rx - 5, ry + 11, [180, 196, 220]);
  }
  // skyline
  const base = y + h - 26;
  const blds: [number, number, number][] = [[0, 46, 40], [52, 34, 32], [92, 52, 38], [150, 30, 34], [186, 44, 40], [236, 36, 30], [278, 40, 36]];
  for (const [bx, bw, bh] of blds) {
    rect(x + bx, base - bh, bw, bh + 26, [22, 26, 34]);
    for (let wy = base - bh + 6; wy < base - 4; wy += 9)
      for (let wx = x + bx + 5; wx < x + bx + bw - 4; wx += 9)
        rect(wx, wy, 3, 4, GOLD);
  }
  rect(x, base, w, 26, [40, 44, 40]); // street
  // deflated balloon lying on the street
  ellipse(x + 150, base + 13, 46, 9, [150, 40, 36]);
  ellipse(x + 150, base + 9, 30, 6, [190, 70, 60]);
  line(x + 104, base + 10, x + 96, base + 2, [220, 220, 220]);
  line(x + 196, base + 10, x + 204, base + 2, [220, 220, 220]);
  text(x + 8, y + 6, "NO PARADE TODAY", 1, [255, 255, 255]);
  text(x + 8, y + 16, "100 BALLOONS GROUNDED", 1, [255, 220, 120]);
}

function sceneMarket(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [255, 255, 255]);
  const base = y + h - 22;
  // rising bars
  const bars = [18, 26, 22, 38, 52, 46, 66, 84];
  const bw = Math.floor((w - 24) / bars.length);
  for (let i = 0; i < bars.length; i++) {
    const bh = bars[i];
    rect(x + 12 + i * bw + 2, base - bh, bw - 5, bh, i < 2 ? RED : GREEN);
  }
  line(x + 8, base, x + w - 8, base, INK);
  // green arrow over the bars
  line(x + 16, base - 16, x + w - 30, y + 14, GREEN);
  line(x + w - 30, y + 14, x + w - 48, y + 14, GREEN);
  line(x + w - 30, y + 14, x + w - 30, y + 30, GREEN);
  text(x + 10, y + 6, "ASIA BOUGHT THE DIP", 1, GREEN);
  text(x + 10, y + h - 16, "NIKKEI +0.86%  KOSPI +0.29%", 1, INK);
}

function sceneNFL(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [26, 110, 52]); // field
  for (let i = 1; i < 8; i++) vline(x + Math.floor((w * i) / 8), y, y + h - 1, [200, 220, 200]);
  hline(x, x + w - 1, y + Math.floor(h / 2), [220, 235, 220]);
  // football
  ellipse(x + Math.floor(w / 2), y + Math.floor(h / 2) - 8, 26, 15, [120, 72, 32]);
  line(x + Math.floor(w / 2) - 14, y + Math.floor(h / 2) - 8, x + Math.floor(w / 2) + 14, y + Math.floor(h / 2) - 8, [255, 255, 255]);
  // scoreboard
  const bx = x + 14, by = y + h - 38, bw = w - 28, bh = 32;
  rect(bx, by, bw, bh, [16, 16, 16]);
  textC(x + Math.floor(w / 2), by + 3, "BEARS 39 - LIONS 35", 2, [255, 255, 255]);
  textC(x + Math.floor(w / 2), by + 21, "FINAL - DETROIT", 1, GOLD);
}

// ---- layout ----
const M = 12; // margin
function panel(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [255, 255, 255]);
  rect(x, y, w, 2, INK); rect(x, y + h - 2, w, 2, INK);
  rect(x, y, 2, h, INK); rect(x + w - 2, y, 2, h, INK);
}
function kicker(x: number, y: number, t: string): void {
  text(x, y, t, 1, RED);
}

function build(): void {
  // Masthead
  textC(512, 8, "THE WORLD IN ONE DAY", 5, INK);
  hline(M, W - M - 1, 58, INK);
  rect(M, 62, W - 2 * M, 26, INK);
  textC(512, 67, "THURSDAY 26 NOVEMBER 2026", 2, [255, 255, 255]);
  textC(512, 92, "36 STORIES - 6 REGIONS - ONE DAY OF WORLD NEWS", 1, GREY);

  // ---- 3 leads ----
  const LW = 328, LY = 106, LH = 296;
  const LX = [M, M + LW + 8, M + 2 * (LW + 8)];
  // Lead 1
  panel(LX[0], LY, LW, LH);
  kicker(LX[0] + 10, LY + 8, "LEAD 1 - NEW YORK - THANKSGIVING");
  text(LX[0] + 10, LY + 20, "STORM STOPS", 2, INK);
  text(LX[0] + 10, LY + 36, "THE PARADE", 2, INK);
  sceneStorm(LX[0] + 10, LY + 56, LW - 20, 96);
  block(LX[0] + 10, LY + 160, LW - 20,
    "NOR'EASTER HITS NEW YORK ON THANKSGIVING DAY: WINDS 30-40 MPH, GUSTS 60-65 MPH, 1.5-2 IN OF RAIN. THE 100TH MACY'S PARADE MOVES TO SAT 28 NOV 08:30 ET - FIRST WEATHER POSTPONEMENT IN 100 YEARS. DECISION ANNOUNCED WED NIGHT. BALLOONS DEFLATED AND MOVED TO NEW JERSEY. NEW JERSEY IN A STATE OF EMERGENCY.",
    1, INK, 9);
  // Lead 2
  panel(LX[1], LY, LW, LH);
  kicker(LX[1] + 10, LY + 8, "LEAD 2 - TOKYO - SEOUL - HONG KONG");
  text(LX[1] + 10, LY + 20, "ASIA REBOUNDS", 2, INK);
  text(LX[1] + 10, LY + 36, "AS STOCKS RALLY", 2, INK);
  sceneMarket(LX[1] + 10, LY + 56, LW - 20, 96);
  block(LX[1] + 10, LY + 160, LW - 20,
    "WITH WALL STREET SHUT FOR THANKSGIVING, ASIA BOUGHT THE DIP: NIKKEI 57,499.16 +0.86%, KOSPI 4,711.21 +0.29%, HANG SENG 22,226.88 +1.19% ENDING A 7-DAY LOSING RUN. EUROPE FOLLOWED: STOXX +1.8%, DAX +2.1%, CAC +1.6%, FTSE +1.75%.",
    1, INK, 9);
  // Lead 3
  panel(LX[2], LY, LW, LH);
  kicker(LX[2] + 10, LY + 8, "LEAD 3 - DETROIT - THANKSGIVING NFL");
  text(LX[2] + 10, LY + 20, "BEARS STEAL IT", 2, INK);
  text(LX[2] + 10, LY + 36, "39-35 IN DETROIT", 2, INK);
  sceneNFL(LX[2] + 10, LY + 56, LW - 20, 96);
  block(LX[2] + 10, LY + 160, LW - 20,
    "BEARS 39, LIONS 35 - FINAL. CHICAGO RALLY LATE TO TAKE THE NFC NORTH LEAD AND A SIXTH STRAIGHT WIN. STILL TO COME: EAGLES AT COWBOYS 21:30 UTC AND CHIEFS AT BILLS FRI 01:20 UTC - BOTH SCHEDULED, NO SCORE YET.",
    1, INK, 9);

  // ---- 3 cards ----
  const CY = LY + LH + 8, CH = 158, CW = 328;
  panel(LX[0], CY, CW, CH);
  kicker(LX[0] + 10, CY + 8, "CARD 4 - SEOUL - RATES");
  text(LX[0] + 10, CY + 20, "KOREA HIKES", 2, INK);
  text(LX[0] + 10, CY + 36, "TO 3.25%", 2, RED);
  block(LX[0] + 10, CY + 56, CW - 20,
    "BANK OF KOREA RAISES ITS BASE RATE 25BP TO 3.25% ON A 5-2 VOTE - THIRD HIKE OF 2026, HIGHEST SINCE NOV 2024. GROWTH FORECASTS UP: 3.9% FOR 2026, 4.1% FOR 2027.",
    1, INK, 9);
  panel(LX[1], CY, CW, CH);
  kicker(LX[1] + 10, CY + 8, "CARD 5 - GENEVA - CHESS");
  text(LX[1] + 10, CY + 20, "GAME 3 DRAWN", 2, INK);
  text(LX[1] + 10, CY + 36, "1.5-1.5", 2, INK);
  // mini chessboard
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      rect(LX[1] + CW - 62 + c * 13, CY + 56 + r * 13, 13, 13, (r + c) % 2 ? INK : [255, 255, 255]);
  disc(LX[1] + CW - 42, CY + 76, 5, RED);
  block(LX[1] + 10, CY + 56, CW - 76,
    "GUKESH-SINDAROV TITLE MATCH: GAME 3 ENDS IN A 60-MOVE DRAW - THIRD IN A ROW. MATCH LEVEL 1.5-1.5. REST DAY FRIDAY, GAME 4 SATURDAY.",
    1, INK, 9);
  panel(LX[2], CY, CW, CH);
  kicker(LX[2] + 10, CY + 8, "CARD 6 - BOLOGNA - DAVIS CUP");
  text(LX[2] + 10, CY + 20, "BRITAIN AND", 2, INK);
  text(LX[2] + 10, CY + 36, "SPAIN ADVANCE", 2, INK);
  block(LX[2] + 10, CY + 56, CW - 20,
    "BRITAIN BEAT GERMANY 2-1 AND SPAIN BEAT AUSTRIA 2-0 IN BOLOGNA. SEMI-FINAL SATURDAY: GREAT BRITAIN VS SPAIN. ITALY BEAT KOREA WED NIGHT - CONTEXT ONLY.",
    1, INK, 9);

  // ---- map + timeline ----
  const MY = CY + CH + 8, MH = 176;
  panel(M, MY, 620, MH);
  kicker(M + 10, MY + 8, "THE WORLD TODAY - 28 PLACES PINNED");
  drawMap(M + 10, MY + 22, 600, 146);
  const TX = M + 620 + 8, TW = W - M - TX;
  panel(TX, MY, TW, MH);
  kicker(TX + 10, MY + 8, "THURSDAY IN UTC");
  const TL = [
    "00:00 TOKYO OPENS", "01:00 BANK OF KOREA HIKES TO 3.25%",
    "05:12 ASX +0.82% 8,763.8", "06:00 NIKKEI +0.86% 57,499.16",
    "06:30 KOSPI +0.29% 4,711.21", "08:00 HANG SENG +1.19% 22,226.88",
    "09:38 LONG MARCH 2D LIFTS OFF - SUCCESS",
    "10:00 SENSEX +0.46% 84,328.59", "10:30 BANK OF ENGLAND REPORT",
    "12:30 ECB ACCOUNT - HAWKISH", "13:30 MACY'S PARADE DOES NOT STEP OFF",
    "14:00 CHESS GAME 3 BEGINS - DRAW 60 MOVES",
    "16:00 DAVIS CUP: SPAIN BEAT AUSTRIA 2-0",
    "16:30 EUROPE CLOSES: STOXX +1.8% DAX +2.1%",
    "18:00 NFL: BEARS BEAT LIONS 39-35", "21:30 EAGLES AT COWBOYS KICK OFF",
    "23:30 TOKYO CORE CPI (FORECAST +2.9%)",
  ];
  for (let i = 0; i < TL.length; i++) text(TX + 10, MY + 22 + i * 9, TL[i], 1, INK);

  // ---- briefs index ----
  const BY = MY + MH + 8, BH = 200;
  panel(M, BY, W - 2 * M, BH);
  kicker(M + 10, BY + 8, "ALL 36 STORIES - BRIEFS INDEX");
  text(M + 10, BY + 20, "ASIA-PACIFIC 15 - EUROPE 7 - AMERICAS 4 - MIDDLE EAST 2 - AFRICA 8 - WORLD 0", 1, GREY);
  const BRIEFS = [
    "7 INDIA: CONSTITUTION DAY MARCHES - LUCKNOW MARCH DENIED, MOVED INDOORS",
    "8 KIM JONG UN INSPECTS NUCLEAR SITES (REPORTED THU - VISIT WED)",
    "9 ISRAEL KILLS HAMAS FIGURE KHALED ABU NADA IN GAZA STRIKE",
    "10 KENYA COURT: GOVT BROKE LAW BUILDING US-BACKED EBOLA SITE",
    "11 GERMAN CONSUMER MOOD -30.2, STUCK AT A LOW LEVEL",
    "12 AUSTRALIA CAPEX JUMPS 12.2% IN Q3, AI-DRIVEN",
    "13 TAIWAN TAIEX +2.6% AS CHIP REBOUND SPREADS",
    "14 SENSEX 84,328.59 +0.46% - NIFTY 25,884.50 +0.25%",
    "15 SAMSUNG SDI TO CANCEL 3.33M TREASURY SHARES",
    "16 EUROPE CLOSES UP: STOXX +1.8% DAX +2.1% CAC +1.6% FTSE +1.75%",
    "17 ECB ACCOUNT: MANY COULD HAVE BACKED OCT HIKE - 17 DEC HIKE 93% PRICED",
    "18 LONG MARCH 2D LAUNCHES YAOGAN-49 01 - SUCCESS 09:38 UTC",
    "19 KATZ THREATENS NEW GAZA EVACUATION OF 1M IF HAMAS WON'T DISARM",
    "20 FIJI: 'POLL PLANS ON TRACK' - ELECTION PREP GOES AHEAD",
    "21 GHANA: BAN ON RAW RUBBER EXPORTS LEADS THE DAILY GRAPHIC",
    "22 TINUBU PLEDGES TO FREE 78 ABDUCTED BORNO SCHOOLCHILDREN",
    "23 STEINMEIER IN KENYA: KSH 3.3BN IRRIGATION PLEDGE",
    "24 INDIA TOP COURT GIVES RAHUL GANDHI RELIEF IN ASSETS CASE",
    "25 SAMAJWADI PARTY RELEASES MANIFESTO IN LUCKNOW",
    "26 KOREA HOUSEHOLD INCOME -2.1% YOY, FIRST DROP IN 10 QUARTERS",
    "27 KORAIL WORKERS BEGIN WORK-TO-RULE PROTEST",
    "28 US FUTURES FIRM IN THIN TRADE - CASH MARKETS SHUT",
    "29 ZAMBIA: 'HORROR AT CHILENJE MORTUARY' LEADS DAILY NATION",
    "30 UGANDA: ALCOHOL COSTS 17,065 LIVES A YEAR",
    "31 KENYA: 'LIVESTREAM STORM ROCKS POLL PLANS'",
    "32 TANZANIA: DAR HOUSING DIVIDE LEADS THE CITIZEN",
    "33 BANK OF ENGLAND: BANK CAPITAL CUT, AI RISK WARNING",
    "34 EURO M3 +3.6% YOY IN OCT, ABOVE FORECAST",
    "35 THANKSGIVING TRAVEL: THOUSANDS OF FLIGHTS DELAYED",
    "36 TOKYO CORE CPI DUE 23:30 UTC - FORECAST +2.9% YOY",
  ];
  const half = 15;
  for (let i = 0; i < half; i++) text(M + 10, BY + 34 + i * 11, BRIEFS[i], 1, INK);
  for (let i = half; i < BRIEFS.length; i++) text(M + 512, BY + 34 + (i - half) * 11, BRIEFS[i], 1, INK);

  // ---- DATE CHECK + sources ----
  const DY = BY + BH + 4;
  rect(M, DY, W - 2 * M, 34, [24, 24, 24]);
  text(M + 10, DY + 5, "DATE CHECK - NOT THURSDAY, LEFT OUT:", 1, GOLD);
  text(M + 10, DY + 15, "KYIV STRIKE 25 NOV - RSF DAMAZIN 24 NOV - RAMAPHOSA 25 NOV - NIGERIA METH 25 NOV -", 1, [255, 255, 255]);
  text(M + 10, DY + 25, "SPECTRUM FLIGHT 3 MOVED TO 31 DEC - PACKERS-RAMS WED NIGHT - FED BEIGE BOOK WED", 1, [255, 255, 255]);
  textC(512, DY + 40, "SOURCES: REUTERS - AP - WSJ - FIDE - BANK OF KOREA - ECB - BANK OF ENGLAND - XINHUA - DAVIS CUP - SHARECAST", 1, GREY);
  textC(512, DY + 49, "ALL EVENTS THU 26 NOV 2026 UNLESS MARKED - MACY'S DECISION AND KIM VISIT WERE WED, REPORTED THU", 1, GREY);
}

function main(): void {
  build();
  const out = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  fs.mkdirSync(out, { recursive: true });
  const buf = encodePNG();
  fs.writeFileSync(out + "/entry.png", buf);
  console.log("wrote " + out + "/entry.png " + buf.length + " bytes");
}

main();

// Dark mode for the worker app.
//
// Screens keep their light-mode colours. When dark mode is on, colours are converted as they're
// used: light backgrounds become dark surfaces, dark text becomes light, and brand colours are
// lifted so they stay readable. In light mode every helper returns its input unchanged.
//
//   themed(StyleSheet.create({...}))  styles that follow the theme
//   tc("#111827")                     a text/icon colour
//   tc("#F4F6F8", "bg")               a background colour
//   ts({ backgroundColor: x })        an inline style object
//   tcs(["#fff", "#eee"], "bg")       a list of colours (gradients)
//
// The app re-mounts its screens when the theme changes (see ThemeProvider), so everything
// re-reads these at render time.

let dark = false;
export const isDark = () => dark;
export function setDarkMode(on) { dark = !!on; }

// ── Colour maths ──────────────────────────────────────────────────────────────
const cache = new Map();

function parse(input) {
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  if (s === "white") return { r: 255, g: 255, b: 255, a: 1 };
  if (s === "black") return { r: 0, g: 0, b: 0, a: 1 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    if (p.length < 3 || p.some((x) => Number.isNaN(x))) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  return null;
}

function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function fromHsl({ h, s, l }, a) {
  const k = (n) => (n + h / 30) % 12;
  const f = (n) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(Math.max(0, Math.min(1, x)) * 255);
  const [r, g, b] = [to(f(0)), to(f(8)), to(f(4))];
  if (a < 1) return `rgba(${r},${g},${b},${Math.round(a * 1000) / 1000})`;
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const NEUTRAL_HUE = 155; // dark surfaces get a faint green tint to match the brand

function convert(value, kind) {
  const c = parse(value);
  if (!c || c.a === 0) return value;
  const hsl = toHsl(c);
  // Greys (e.g. #111827, #F4F6F8) carry a little hue; treat anything with low chroma as grey.
  const chroma = (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) / 255;
  const neutral = chroma < (kind === "text" ? 0.14 : 0.1);

  if (kind === "bg") {
    if (hsl.l < 0.5) return value; // brand greens, dark overlays: already dark
    if (hsl.l < 0.8) return fromHsl({ h: hsl.h, s: Math.min(hsl.s, 0.35), l: clamp(1 - hsl.l, 0.22, 0.4) }, c.a);
    if (neutral) return fromHsl({ h: NEUTRAL_HUE, s: 0.1, l: 0.075 + (1 - hsl.l) * 1.1 }, c.a);
    return fromHsl({ h: hsl.h, s: Math.min(hsl.s, 0.45), l: 0.13 + (1 - hsl.l) * 0.6 }, c.a); // pale tints
  }
  if (kind === "border") {
    if (hsl.l < 0.6) return value;
    if (neutral) return fromHsl({ h: NEUTRAL_HUE, s: 0.08, l: 0.15 + (1 - hsl.l) * 0.6 }, c.a);
    return fromHsl({ h: hsl.h, s: Math.min(hsl.s, 0.4), l: 0.2 + (1 - hsl.l) * 0.5 }, c.a);
  }
  // text / icons
  if (hsl.l > 0.6) return value; // already light (white text on buttons stays white)
  if (neutral) return fromHsl({ h: hsl.h, s: hsl.s, l: clamp(0.95 - hsl.l * 0.6, 0.6, 0.93) }, c.a);
  return fromHsl({ h: hsl.h, s: Math.min(hsl.s, 0.55), l: clamp(Math.max(hsl.l, 0.6), 0.6, 0.78) }, c.a);
}

// A colour for the current theme. kind: "text" (default), "bg" or "border".
export function tc(value, kind = "text") {
  if (!dark || typeof value !== "string") return value;
  const key = `${kind}|${value}`;
  if (!cache.has(key)) cache.set(key, convert(value, kind));
  return cache.get(key);
}

export const tcs = (list, kind = "bg") => (dark && Array.isArray(list) ? list.map((v) => tc(v, kind)) : list);

const KIND_FOR = (prop) => {
  if (prop === "backgroundColor") return "bg";
  if (/^border.*Color$/.test(prop)) return "border";
  if (prop === "shadowColor") return null;
  if (prop === "color" || /(tint|textDecoration|textShadow|overlay)Color$/.test(prop)) return "text";
  return null;
};

function mapStyle(style) {
  if (!style || typeof style !== "object") return style;
  if (Array.isArray(style)) return style.map(mapStyle);
  let out = null;
  for (const k of Object.keys(style)) {
    const kind = KIND_FOR(k);
    if (!kind) continue;
    const v = tc(style[k], kind);
    if (v !== style[k]) { out = out || { ...style }; out[k] = v; }
  }
  return out || style;
}

// An inline style object (or array) for the current theme.
export const ts = (style) => (dark ? mapStyle(style) : style);

// Wrap a StyleSheet so each style follows the theme when read.
export function themed(sheet) {
  const darkCache = {};
  const out = {};
  for (const key of Object.keys(sheet)) {
    Object.defineProperty(out, key, {
      enumerable: true,
      get() {
        if (!dark) return sheet[key];
        if (!(key in darkCache)) darkCache[key] = mapStyle(sheet[key]);
        return darkCache[key];
      },
    });
  }
  return out;
}

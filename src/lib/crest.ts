// Auto-generated club crests for clubs that haven't uploaded a logo yet.
// Each club gets its own colours (picked from its slug) and its short tag.

const PALETTES: [string, string][] = [
  ["#E8B95A", "#8A6420"],
  ["#34D399", "#065F46"],
  ["#60A5FA", "#1E3A8A"],
  ["#F87171", "#7F1D1D"],
  ["#A78BFA", "#4C1D95"],
  ["#FB923C", "#9A3412"],
  ["#22D3EE", "#155E75"],
  ["#F472B6", "#831843"],
  ["#A3E635", "#3F6212"],
  ["#94A3B8", "#1E293B"],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function initials(name: string) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "FC";
  return (words.length === 1 ? words[0].slice(0, 3) : words.slice(0, 3).map((w) => w[0]).join("")).toUpperCase();
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function isPlaceholderLogo(logo?: string | null) {
  return !logo || logo.startsWith("/images/placeholders");
}

export function crestUrl(tag: string, seed: string) {
  return `/api/crest/${encodeURIComponent(tag || "FC")}/${encodeURIComponent(seed || tag || "club")}`;
}

/** The club's uploaded logo, or its generated crest. */
export function clubLogo(c: { logo?: string | null; shortName?: string; name?: string; slug?: string }) {
  if (!isPlaceholderLogo(c.logo)) return c.logo as string;
  const tag = (c.shortName || initials(c.name || "")).replace(/[^A-Za-z0-9]/g, "").slice(0, 6) || "FC";
  return crestUrl(tag, c.slug || c.name || tag);
}

export function crestSvg(rawTag: string, seed: string) {
  const tag = esc(rawTag.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "FC");
  const [light, dark] = PALETTES[hash(seed) % PALETTES.length];
  const len = tag.length;
  const size = len <= 2 ? 64 : len === 3 ? 54 : len === 4 ? 44 : len === 5 ? 36 : 31;
  const shield = "M100 22 L160 44 V98 C160 138 134 163 100 178 C66 163 40 138 40 98 V44 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1A1B20"/><stop offset="1" stop-color="#0B0C0F"/></linearGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stop-color="${light}" stop-opacity="0.35"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="200" height="200" fill="url(#bg)"/>
  <rect width="200" height="200" fill="url(#glow)"/>
  <path d="${shield}" fill="url(#sh)"/>
  <path d="${shield}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="3" transform="translate(100 100) scale(0.9) translate(-100 -100)"/>
  <path d="M100 22 L160 44 V70 H40 V44 Z" fill="#fff" fill-opacity="0.12"/>
  <path d="M100 34 l3.5 7.2 7.9 1.1 -5.7 5.6 1.3 7.9 -7-3.7 -7 3.7 1.3-7.9 -5.7-5.6 7.9-1.1z" fill="#fff" fill-opacity="0.9"/>
  <text x="100" y="${112 + size * 0.36}" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${size}" fill="#fff" letter-spacing="1">${tag}</text>
</svg>`;
}

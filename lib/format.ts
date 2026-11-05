export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const fmt = (x: number, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
export const sgn = (x: number, d = 1) => (x > 0 ? "+" : x < 0 ? "−" : "±") + fmt(Math.abs(x), d);
export const arrow = (x: number) => (Math.abs(x) < 0.05 ? "◆" : x > 0 ? "▲" : "▼");
export const tone = (x: number, invert = false) => (Math.abs(x) < 0.05 ? "flat" : (x > 0) !== invert ? "up" : "down");
export const usd = (v: number) =>
  Math.abs(v) >= 1e6 ? `${v < 0 ? "−" : ""}$${fmt(Math.abs(v) / 1e6, 2)}m` : `${v < 0 ? "−" : ""}$${Math.round(Math.abs(v) / 1000)}k`;
export const avg = (a: number[], i: number, j: number) => a.slice(i, j).reduce((x, y) => x + y, 0) / (j - i);

export interface Lever {
  id: string; label: string; min: number; max: number; step: number; unit: string; pre?: string; hint: string;
}
export function leverValue(l: Lever, v: number) {
  const signed = l.min < 0;
  const dec = (String(l.step).split(".")[1] || "").length;
  return (signed && v > 0 ? "+" : "") + (l.pre ? (v < 0 ? "−" + l.pre : l.pre) : v < 0 ? "−" : "") + fmt(Math.abs(v), dec) + l.unit;
}

/** Scenario params travel in the URL so any result is a shareable link. */
export function encodeParams(p: Record<string, unknown>) {
  return encodeURIComponent(btoa(JSON.stringify(p)));
}
export function decodeParams<T>(s: string | null): Partial<T> | null {
  if (!s) return null;
  try { const v = JSON.parse(atob(decodeURIComponent(s))); return v && typeof v === "object" ? v : null; } catch { return null; }
}

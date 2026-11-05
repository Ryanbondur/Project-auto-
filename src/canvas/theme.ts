/**
 * Shared visual theme — keep in sync with CSS `--atd-*` in styles/app.css.
 * Canvas reads these constants; React chrome uses the CSS variables.
 * Tune once on phone (~390px).
 */

export type EraId = 1 | 2 | 3 | 4 | 5;

export const theme = {
  bgVoid: "#070B10",
  bgBoard: "#0A121A",
  /** Optional faint square grid — ≤35% of #12202C */
  gridLine: "rgba(18, 32, 44, 0.35)",
  panel: "rgba(14, 22, 32, 0.94)",
  panelEdge: "rgba(46, 230, 255, 0.4)",
  text: "#E8F4FA",
  textDim: "#7A93A8",
  danger: "#FF4D6A",
  gold: "#F0C14A",
  cyan: "#2EE6FF",
  cyanDim: "#1A8FA3",
  magenta: "#FF2EC8",
  magentaDim: "#A31A7A",
  era: {
    1: "#C4A574",
    2: "#8FB36A",
    3: "#D4A017",
    4: "#5B8CFF",
    5: "#B388FF",
  } as const satisfies Record<EraId, string>,
  /** Phone glow budget — selective bloom only (path / select / impact / boss). */
  pathGlowBlur: 3,
  selectGlowBlur: 3.5,
  impactGlowBlur: 3,
  bossGlowBlur: 4,
} as const;

export function eraColor(era: EraId | number): string {
  const key = Math.min(5, Math.max(1, Math.floor(era))) as EraId;
  return theme.era[key];
}

/** Darken a hex (#RRGGBB) toward void for shade fills. */
export function shadeHex(hex: string, amount = 0.35): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const mix = (c: number) =>
    Math.round(c * (1 - amount) + 0x07 * amount)
      .toString(16)
      .padStart(2, "0");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

/** Lighten a hex toward white for highlights. */
export function tintHex(hex: string, amount = 0.25): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const mix = (c: number) =>
    Math.round(c + (255 - c) * amount)
      .toString(16)
      .padStart(2, "0");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

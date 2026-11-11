import { Easing, interpolate } from "remotion";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easeInOut = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);
export const easeSine = Easing.inOut(Easing.sin);

/** Eased 0→1 between frames a and b. */
export const ramp = (f: number, a: number, b: number, easing = easeInOut) =>
  interpolate(f, [a, b], [0, 1], { ...CLAMP, easing });

/** Linear 0→1 between frames a and b. */
export const lin = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], CLAMP);

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Fade in over [a,b], hold, fade out over [c,d]. */
export const pulse = (f: number, a: number, b: number, c: number, d: number) =>
  Math.min(ramp(f, a, b), 1 - ramp(f, c, d));

/** Position at parameter t (0..1) along a polyline, plus heading. */
export const alongPath = (pts: [number, number][], t: number) => {
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    lens.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? d / lens[i] : 0;
      return {
        x: mix(pts[i][0], pts[i + 1][0], k),
        y: mix(pts[i][1], pts[i + 1][1], k),
        dx: pts[i + 1][0] - pts[i][0],
        dy: pts[i + 1][1] - pts[i][1],
        dist: Math.max(0, Math.min(1, t)) * total,
        total,
      };
    }
    d -= lens[i];
  }
  return { x: pts[0][0], y: pts[0][1], dx: 1, dy: 0, dist: 0, total };
};

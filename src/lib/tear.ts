// The torn bottom edge: an uneven row of teeth, the way paper really rips. The shape is fixed (seeded), so it
// looks the same on every load.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TearShape {
  viewBox: string;
  path: string;
}

export function buildTearShape(width = 440, seed = 5): TearShape {
  const random = mulberry32(seed);
  const points: string[] = [];
  let x = 0;
  let deep = true;
  while (x < width) {
    x = Math.min(width, x + 12 + random() * 10);
    points.push(`${x.toFixed(1)} ${(deep ? 6 + random() * 9 : 0.5 + random() * 3).toFixed(1)}`);
    deep = !deep;
  }
  return {
    viewBox: `0 0 ${width} 16`,
    path: `M0 0 L${points.join(" L")} L${width} 0 Z`,
  };
}

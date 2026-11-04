// Pure geometry of the fortune wheel. Angles are degrees, clockwise, 0 = 12 o'clock (where the
// pointer sits). Slice i spans [i·a, (i+1)·a] with a = 360 / sliceCount at rotation 0.

export const sliceAngle = (sliceCount: number): number => 360 / Math.max(sliceCount, 1);

/** The rotation (mod 360) that puts the centre of `index` under the pointer. */
export const restingRotation = (sliceCount: number, index: number): number => {
  const angle = sliceAngle(sliceCount);
  return (360 - (index + 0.5) * angle) % 360;
};

/**
 * Where a spin starting at `from` should stop: at least `fullTurns` whole turns further, landing
 * on `index`, nudged off-centre by `jitter` (-1..1, a fraction of half a slice) so it looks honest.
 */
export const spinTarget = (
  from: number,
  sliceCount: number,
  index: number,
  fullTurns: number,
  jitter: number,
): number => {
  const angle = sliceAngle(sliceCount);
  const landing = restingRotation(sliceCount, index) + jitter * angle * 0.35;
  const base = from - (from % 360) + fullTurns * 360;
  return base + (((landing % 360) + 360) % 360);
};

/** How many slice borders the pointer has passed at `rotation` — a change means "tick". */
export const bordersPassed = (rotation: number, sliceCount: number): number =>
  Math.floor(rotation / sliceAngle(sliceCount));

/** Ease-out quart: fast start, long suspenseful crawl at the end. */
export const easeOutQuart = (progress: number): number => 1 - (1 - progress) ** 4;

/** SVG path of one slice in a 200×200 viewBox centred at (100,100). */
export const slicePath = (sliceCount: number, index: number, radius: number): string => {
  const angle = sliceAngle(sliceCount);
  const start = polar(radius, index * angle);
  const end = polar(radius, (index + 1) * angle);
  const largeArc = angle > 180 ? 1 : 0;
  return `M100 100 L${start.x} ${start.y} A${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

/** The point at `radius` and clockwise `degrees` from 12 o'clock. */
export const polar = (radius: number, degrees: number): { x: number; y: number } => {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: 100 + radius * Math.cos(radians), y: 100 + radius * Math.sin(radians) };
};

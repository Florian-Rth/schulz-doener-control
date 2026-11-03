/** Gravity of the showroom. A bit stronger than earth: throws look snappier. */
export const GRAVITY = 14;

/** Where bodies wait before they are thrown — far below the floor, weightless. */
export const parkingSpot = (index: number): [number, number, number] => [
  (index % 12) * 0.9 - 5,
  -40 - Math.floor(index / 12),
  0,
];

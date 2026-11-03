// Playful lines are drawn at random from a pool — a Testing Library text matcher
// that accepts any line of it.
export const oneOf =
  (pool: readonly string[]) =>
  (text: string): boolean =>
    pool.includes(text);

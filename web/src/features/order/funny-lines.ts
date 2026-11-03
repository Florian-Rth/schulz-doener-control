// Random-but-stable picks from the playful copy pools. A seed is rolled once
// (per configurator opening, per launcher); the same seed and salt always give
// the same line, so a re-render never swaps a button label under the finger.

export const rollSeed = (): number => Math.floor(Math.random() * 1_000_000);

const saltOf = (pool: readonly string[]): number => {
  let hash = 0;
  for (const character of pool[0] ?? "") {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) % 1_000_003;
  }
  return hash;
};

/** One line of `pool`, chosen by `seed`. Different pools differ even for the same seed. */
export const pickLine = (pool: readonly string[], seed: number): string =>
  pool[(seed + saltOf(pool)) % pool.length] ?? pool[0] ?? "";

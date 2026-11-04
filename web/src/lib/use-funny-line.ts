import { useState } from "react";
import { pickLine, rollSeed } from "./funny-lines";

/** A line from `pool`, rolled once per mount, so re-renders never swap it. */
export const useFunnyLine = (pool: readonly string[]): string => {
  const [seed] = useState(rollSeed);
  return pickLine(pool, seed);
};

import { pickLine } from "../../funny-lines";
import { useKonfiguratorContext } from "./konfigurator-context";

// A prime stride, so consecutive steps land on different lines of a pool.
const STEP_STRIDE = 7919;

/** A line from `pool` for the current step of this configurator session. */
export const useFunnyLine = (pool: readonly string[]): string => {
  const { lineSeed, stepIndex } = useKonfiguratorContext();
  return pickLine(pool, lineSeed + stepIndex * STEP_STRIDE);
};

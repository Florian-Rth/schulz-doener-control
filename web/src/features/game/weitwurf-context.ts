import { createContext, useContext } from "react";
import type { WeitwurfRound } from "./hooks/use-weitwurf-round";

// One context for the Weitwurf screen: HUD, start card and end screen read the
// round instead of threading its many slices through props.
export const WeitwurfContext = createContext<WeitwurfRound | null>(null);

export const useWeitwurfContext = (): WeitwurfRound => {
  const value = useContext(WeitwurfContext);
  if (value === null) {
    throw new Error("useWeitwurfContext muss innerhalb von <WeitwurfPage> verwendet werden.");
  }
  return value;
};

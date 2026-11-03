import { createContext, useContext } from "react";
import type { ThekenModusState } from "../../hooks/use-theken-modus";

// One context for the Theken-Modus group: header, order screen, final screen
// and navigation read the stepper state instead of threading it as props.
export const ThekenContext = createContext<ThekenModusState | null>(null);

export const useThekenContext = (): ThekenModusState => {
  const value = useContext(ThekenContext);
  if (value === null) {
    throw new Error("useThekenContext muss innerhalb von <ThekenModus> verwendet werden.");
  }
  return value;
};

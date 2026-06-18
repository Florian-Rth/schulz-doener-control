import { createContext, useContext } from "react";
import type { PushOperations } from "./hooks/use-push-operations";

export type PushContextValue = PushOperations;

export const PushContext = createContext<PushContextValue | null>(null);

// Context hook for the push-subscribe compound. Throws when used outside the
// provider so a misuse fails loudly instead of silently rendering nothing.
export const usePushContext = (): PushContextValue => {
  const value = useContext(PushContext);
  if (value === null) {
    throw new Error("usePushContext must be used within a PushSubscribeCard provider.");
  }
  return value;
};

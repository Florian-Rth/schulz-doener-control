import { createContext, useContext } from "react";
import type { UseDoenerKonfiguratorResult } from "../../hooks/use-doener-konfigurator";

export type KonfiguratorContextValue = UseDoenerKonfiguratorResult & {
  onClose: () => void;
  /** Rolled once per opening; picks the playful lines (see useFunnyLine). */
  lineSeed: number;
};

export const KonfiguratorContext = createContext<KonfiguratorContextValue | null>(null);

// One context for the configurator group (header, stage, step panel). Throws
// outside the provider to make a missing wrapper loud.
export const useKonfiguratorContext = (): KonfiguratorContextValue => {
  const value = useContext(KonfiguratorContext);
  if (value === null) {
    throw new Error(
      "useKonfiguratorContext muss innerhalb von <DoenerKonfigurator> verwendet werden.",
    );
  }
  return value;
};

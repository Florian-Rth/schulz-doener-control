import { createContext, useContext } from "react";
import type { InstallGuideValue } from "./hooks/use-install-guide";

export const InstallGuideContext = createContext<InstallGuideValue | null>(null);

// Context hook for the install-guide compound. Throws when used outside the provider so a misuse
// fails loudly instead of silently rendering nothing.
export const useInstallGuideContext = (): InstallGuideValue => {
  const value = useContext(InstallGuideContext);
  if (value === null) {
    throw new Error("useInstallGuideContext must be used within an InstallGuide provider.");
  }
  return value;
};

import type { FC, ReactNode } from "react";
import { usePwaGate } from "../../hooks/use-pwa-gate";
import { InstallGuide } from "../InstallGuide";
import { GateSplash } from "./internal/GateSplash";

interface PwaGateProps {
  children: ReactNode;
}

// Wraps the authenticated app shell. Reads the gate decision (Logic) and renders one of three: a
// splash while the kill-switch config resolves, the install guide for browser users, or the app.
// Holds no layout of its own.
export const PwaGate: FC<PwaGateProps> = ({ children }) => {
  const decision = usePwaGate();

  if (decision === "loading") {
    return <GateSplash />;
  }
  if (decision === "guide") {
    return <InstallGuide />;
  }
  return <>{children}</>;
};

import type { FC } from "react";
import { PrimaryButton } from "@/components";
import { installGuideCopy } from "../../../copy";
import { useInstallGuideContext } from "../../../install-guide-context";

// One-tap install button, shown only when the browser captured an installable prompt (Android /
// Chromium desktop). iOS and browsers without the prompt fall back to the textual steps. Pure UI.
export const InstallCta: FC = () => {
  const { canInstall, install } = useInstallGuideContext();

  if (!canInstall) {
    return null;
  }

  return (
    <PrimaryButton onClick={install} startIcon="add">
      {installGuideCopy.installCta}
    </PrimaryButton>
  );
};

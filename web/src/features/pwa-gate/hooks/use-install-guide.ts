import { useSyncExternalStore } from "react";
import { detectInstallPlatform, type InstallPlatform } from "@/lib/push";
import { canPromptInstall, promptInstall, subscribeInstallPrompt } from "@/lib/pwa/install-prompt";
import { installGuideCopy } from "../copy";

export interface InstallGuideValue {
  platform: InstallPlatform;
  title: string;
  steps: readonly string[];
  note: string | null;
  canInstall: boolean;
  install: () => void;
}

interface PlatformCopy {
  title: string;
  steps: readonly string[];
  note: string | null;
}

const selectPlatformCopy = (platform: InstallPlatform): PlatformCopy => {
  switch (platform) {
    case "ios":
      return { title: installGuideCopy.ios.title, steps: installGuideCopy.ios.steps, note: null };
    case "android":
      return {
        title: installGuideCopy.android.title,
        steps: installGuideCopy.android.steps,
        note: null,
      };
    case "desktop":
      return {
        title: installGuideCopy.desktop.title,
        steps: installGuideCopy.desktop.steps,
        note: installGuideCopy.desktop.note,
      };
  }
};

// Logic layer for the install guide: resolves the platform, selects the matching German copy, and
// exposes the one-tap install affordance (present on Android / Chromium desktop, absent on iOS).
export const useInstallGuide = (): InstallGuideValue => {
  const platform = detectInstallPlatform();
  const canInstall = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall, () => false);
  const copy = selectPlatformCopy(platform);

  const install = (): void => {
    void promptInstall();
  };

  return {
    platform,
    title: copy.title,
    steps: copy.steps,
    note: copy.note,
    canInstall,
    install,
  };
};

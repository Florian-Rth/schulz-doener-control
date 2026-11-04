import type { FC } from "react";
import { DoenerStage } from "@/components";
import { useKonfiguratorContext } from "../konfigurator-context";

// The 3D showroom area between header and step panel.
export const KonfiguratorStage: FC = () => {
  const { build, meatOptions, sauceOptions, isPresenting, lineSeed } = useKonfiguratorContext();

  return (
    <DoenerStage
      build={build}
      presenting={isPresenting}
      seed={lineSeed}
      meatKeys={meatOptions.map((option) => option.key)}
      sauceKeys={sauceOptions.map((option) => option.key)}
    />
  );
};

import type { FC } from "react";
import { DoenerMascot, DoenerStage } from "@/components";
import { useMyTier } from "../../../api";
import { useKonfiguratorContext } from "../konfigurator-context";

// The 3D showroom area between header and step panel. The Chef's own
// Döner-Tier stands next to the Döner as a cardboard standee — and takes
// every sloppy throw personally.
export const KonfiguratorStage: FC = () => {
  const { build, meatOptions, sauceOptions, isPresenting, lineSeed } = useKonfiguratorContext();
  const { data: tier } = useMyTier();

  return (
    <DoenerStage
      build={build}
      presenting={isPresenting}
      seed={lineSeed}
      meatKeys={meatOptions.map((option) => option.key)}
      sauceKeys={sauceOptions.map((option) => option.key)}
    >
      {tier === undefined ? null : (
        <DoenerMascot emoji={tier.emoji} name={tier.name} seed={lineSeed} />
      )}
    </DoenerStage>
  );
};

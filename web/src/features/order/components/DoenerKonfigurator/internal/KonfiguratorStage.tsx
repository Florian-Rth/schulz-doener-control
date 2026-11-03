import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FC, lazy, Suspense } from "react";
import { konfiguratorCopy } from "../../../copy";
import { useKonfiguratorContext } from "../konfigurator-context";
import { useFunnyLine } from "../use-funny-line";
import { useImpactWord } from "../use-impact-word";
import { ImpactBurst } from "./ImpactBurst";

// three.js + Rapier are only downloaded when someone actually opens the configurator.
const DoenerScene = lazy(() =>
  import("./scene/DoenerScene").then((module) => ({ default: module.DoenerScene })),
);

const StageLoading: FC = () => {
  const loading = useFunnyLine(konfiguratorCopy.loading);
  return (
    <Stack sx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 1.5 }}>
      <CircularProgress size={28} />
      <Typography sx={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.75)" }}>
        {loading}
      </Typography>
    </Stack>
  );
};

// The 3D showroom area between header and step panel.
export const KonfiguratorStage: FC = () => {
  const { build, meatOptions, sauceOptions, isPresenting, lineSeed } = useKonfiguratorContext();
  const impactWord = useImpactWord(build, lineSeed);

  return (
    <Stack sx={{ flex: 1, minHeight: 0, position: "relative", touchAction: "none" }}>
      <Suspense fallback={<StageLoading />}>
        <DoenerScene
          build={build}
          meatKeys={meatOptions.map((option) => option.key)}
          sauceKeys={sauceOptions.map((option) => option.key)}
          presenting={isPresenting}
        />
      </Suspense>
      <ImpactBurst word={impactWord} />
    </Stack>
  );
};

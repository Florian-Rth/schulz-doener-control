import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { konfiguratorCopy } from "../../../copy";
import { useKonfiguratorContext } from "../konfigurator-context";

// Navy top bar: close, title, step counter and a red progress line.
export const KonfiguratorHeader: FC = () => {
  const { stepIndex, stepCount, onClose } = useKonfiguratorContext();

  return (
    <Stack sx={{ gap: 1.5, px: 2.25, pt: 2, pb: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
        <ButtonBase
          aria-label={konfiguratorCopy.close}
          onClick={onClose}
          sx={(theme) => ({
            width: 36,
            height: 36,
            borderRadius: `${theme.radii.sm - 1}px`,
            backgroundColor: "rgba(255,255,255,.12)",
          })}
        >
          <MaterialIcon name="close" sx={{ fontSize: 22, color: "navy.contrastText" }} />
        </ButtonBase>
        <Stack sx={{ flex: 1 }}>
          <Typography
            id="doener-konfigurator-title"
            component="h2"
            sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.contrastText" }}
          >
            {konfiguratorCopy.title}
          </Typography>
          <Typography sx={{ fontSize: "0.6875rem", color: "rgba(255,255,255,.7)" }}>
            {konfiguratorCopy.stepOf(stepIndex + 1, stepCount)}
          </Typography>
        </Stack>
        <MaterialIcon name="view_in_ar" sx={{ fontSize: 24, color: "primary.main" }} />
      </Stack>
      <LinearProgress
        variant="determinate"
        value={((stepIndex + 1) / stepCount) * 100}
        aria-hidden
        sx={(theme) => ({
          height: 4,
          borderRadius: `${theme.radii.pill}px`,
          backgroundColor: "rgba(255,255,255,.12)",
        })}
      />
    </Stack>
  );
};

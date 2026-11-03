import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { thekenCopy } from "../../../copy";
import { useThekenContext } from "../theken-context";

// Navy top bar: close, title, the "3 / 12" counter and a red progress line.
export const ThekenHeader: FC = () => {
  const { progressLabel, progressValue, isFinished, close } = useThekenContext();

  return (
    <Stack sx={{ gap: 1.5, px: 2.25, pt: 2, pb: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
        <ButtonBase
          aria-label={thekenCopy.close}
          onClick={close}
          sx={(theme) => ({
            width: 40,
            height: 40,
            borderRadius: `${theme.radii.sm - 1}px`,
            backgroundColor: "rgba(255,255,255,.12)",
          })}
        >
          <MaterialIcon name="close" sx={{ fontSize: 24, color: "navy.contrastText" }} />
        </ButtonBase>
        <Typography
          id="theken-modus-title"
          component="h2"
          sx={{ flex: 1, fontSize: "1.0625rem", fontWeight: 700, color: "navy.contrastText" }}
        >
          {thekenCopy.title}
        </Typography>
        <Typography
          aria-live="polite"
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "navy.contrastText",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {isFinished ? thekenCopy.finish : progressLabel}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progressValue}
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

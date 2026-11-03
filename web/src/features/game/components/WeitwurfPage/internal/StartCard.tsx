import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { PrimaryButton } from "@/components";
import { gameCopy } from "../../../copy";
import { useWeitwurfContext } from "../../../weitwurf-context";

// Before the first round: how to throw, what pieces are worth, and "Los".
export const StartCard: FC = () => {
  const { introLine, start } = useWeitwurfContext();

  return (
    <Paper
      sx={(theme) => ({
        position: "absolute",
        left: theme.spacing(2),
        right: theme.spacing(2),
        bottom: theme.spacing(3),
        borderRadius: `${theme.radii.xl}px`,
        p: 2.25,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      })}
    >
      <Typography component="h1" sx={{ fontSize: "1.25rem", fontWeight: 800, color: "navy.main" }}>
        {gameCopy.introTitle}
      </Typography>
      <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "primary.main" }}>
        {introLine}
      </Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5 }}>
        {gameCopy.introBody}
      </Typography>
      <Typography variant="eyebrow">{gameCopy.introPoints}</Typography>
      <PrimaryButton onClick={start} startIcon="local_fire_department">
        {gameCopy.start}
      </PrimaryButton>
    </Paper>
  );
};

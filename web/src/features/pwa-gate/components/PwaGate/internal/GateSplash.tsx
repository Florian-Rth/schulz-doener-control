import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import type { FC } from "react";

// Neutral full-height splash shown while the gate's kill-switch config resolves, so a browser user
// never sees a flash of the app before the install guide takes over. Pure UI.
export const GateSplash: FC = () => {
  return (
    <Stack
      sx={(theme) => ({
        minHeight: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.background.app,
      })}
    >
      <CircularProgress color="primary" />
    </Stack>
  );
};

import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { waitingGameCopy } from "../../../copy";

// Entry to the Döner-Weitwurf while the Abholer is on the way. A plain link
// to the route: the home feature never imports the game feature.
export const WaitingGameTile: FC = () => (
  <ButtonBase
    component={Link}
    to="/weitwurf"
    sx={(theme) => ({
      justifyContent: "flex-start",
      textAlign: "left",
      gap: 1.25,
      backgroundColor: "navy.main",
      borderRadius: `${theme.radii.sm - 1}px`,
      p: 1.25,
      mt: 1,
    })}
  >
    <MaterialIcon name="local_fire_department" sx={{ fontSize: 24, color: "gold.main" }} />
    <Stack sx={{ flex: 1, minWidth: 0, gap: 0.25 }}>
      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "navy.contrastText" }}>
        {waitingGameCopy.title}
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,.75)", lineHeight: 1.4 }}>
        {waitingGameCopy.body}
      </Typography>
    </Stack>
    <MaterialIcon name="chevron_right" sx={{ fontSize: 20, color: "navy.contrastText" }} />
  </ButtonBase>
);

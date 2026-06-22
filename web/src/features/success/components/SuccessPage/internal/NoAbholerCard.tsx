import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { successCopy } from "../../../copy";

// Informational card shown when the caller is not the pickup person but no
// Abholer has been designated yet — so there is no one to pay. Presentational.
export const NoAbholerCard: FC = () => {
  return (
    <Stack
      direction="row"
      sx={(theme) => ({
        alignItems: "center",
        gap: 1.25,
        backgroundColor: theme.palette.subtle.main,
        borderRadius: `${theme.radii.lg}px`,
        p: 2.25,
      })}
    >
      <MaterialIcon name="hourglass_empty" sx={{ fontSize: 24, color: "muted.main" }} />
      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "label.main" }}>
        {successCopy.noAbholerYet}
      </Typography>
    </Stack>
  );
};

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { collectSentence, successCopy } from "../../../copy";
import { formatEur } from "../../../money";

interface PickupCollectCardProps {
  collectCents: number;
  collectCount: number;
}

// Navy "you collect today" card. Shown when the caller is the pickup person.
export const PickupCollectCard: FC<PickupCollectCardProps> = ({ collectCents, collectCount }) => {
  return (
    <Stack
      sx={(theme) => ({
        backgroundColor: theme.palette.navy.main,
        borderRadius: `${theme.radii.lg}px`,
        p: 2.25,
        alignItems: "center",
        gap: 0.5,
        color: theme.palette.primary.contrastText,
      })}
    >
      <MaterialIcon name="directions_car" sx={{ fontSize: 34, color: "gold.main" }} />
      <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700 }}>
        {successCopy.pickupTitle}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.8125rem",
          color: "rgba(255,255,255,.78)",
          textAlign: "center",
          lineHeight: 1.45,
        }}
      >
        {collectSentence(formatEur(collectCents), collectCount)}
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "teal.main" }}>
        {successCopy.pickupCaption}
      </Typography>
    </Stack>
  );
};

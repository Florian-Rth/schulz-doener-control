import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar } from "@/components";
import { successCopy } from "../../../copy";
import { formatEur } from "../../../money";
import type { Abholer } from "../../../types";

interface OwesAbholerCardProps {
  abholer: Abholer;
  priceCents: number;
}

// "I owe the abholer" card: avatar + name + big amount + an info note. No pay
// button here — a payer reimburses the Abholer on the home screen once the
// Abholer closes ordering (orders frozen), so the PayPal link only appears then.
export const OwesAbholerCard: FC<OwesAbholerCardProps> = ({ abholer, priceCents }) => {
  const priceLabel = formatEur(priceCents);
  return (
    <Stack
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: `${theme.radii.lg}px`,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
        p: 2.25,
        alignItems: "center",
        gap: 1,
      })}
    >
      <Typography variant="eyebrow" sx={{ mb: 0.5 }}>
        {successCopy.owesEyebrow}
      </Typography>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
        <Avatar displayName={abholer.name} colorHex={abholer.colorHex} size={38} />
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600, color: "navy.main" }}>
          {abholer.name}
        </Typography>
      </Stack>
      <Typography
        sx={{ fontSize: "2.125rem", fontWeight: 700, color: "navy.main", letterSpacing: "-0.02em" }}
      >
        {priceLabel}
      </Typography>
      <Alert severity="info" sx={{ width: "100%" }}>
        {successCopy.owesInfoNote}
      </Alert>
    </Stack>
  );
};

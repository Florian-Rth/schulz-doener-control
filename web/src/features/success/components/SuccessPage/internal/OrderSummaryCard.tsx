import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { formatEur } from "../../../money";

interface OrderSummaryCardProps {
  productLabel: string;
  priceCents: number;
  detail: string;
}

// White summary card: product label + big red price + detail line.
export const OrderSummaryCard: FC<OrderSummaryCardProps> = ({
  productLabel,
  priceCents,
  detail,
}) => {
  return (
    <Stack
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: `${theme.radii.lg}px`,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
        p: 2,
        gap: 0.375,
      })}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "navy.main" }}>
          {productLabel}
        </Typography>
        <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, color: "primary.main" }}>
          {formatEur(priceCents)}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>{detail}</Typography>
    </Stack>
  );
};

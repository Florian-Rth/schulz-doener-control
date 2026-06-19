import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { successCopy } from "../../../copy";
import { formatEur } from "../../../money";
import type { OrderResultLine } from "../../../types";

interface OrderSummaryCardProps {
  lines: OrderResultLine[];
  priceCents: number;
}

// White summary card: one row per ordered line (quantity × label, detail, line
// total) and the big red order total at the foot.
export const OrderSummaryCard: FC<OrderSummaryCardProps> = ({ lines, priceCents }) => {
  return (
    <Stack
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: `${theme.radii.lg}px`,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
        p: 2,
        gap: 1.25,
      })}
    >
      {lines.map((line, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: read-only result list, never reordered
        <Stack key={index} sx={{ gap: 0.375 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
              {line.quantity > 1 ? `${line.quantity}× ` : ""}
              {line.productLabel}
            </Typography>
            <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
              {formatEur(line.lineTotalCents)}
            </Typography>
          </Stack>
          {line.detail !== "" ? (
            <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>{line.detail}</Typography>
          ) : null}
        </Stack>
      ))}
      <Divider />
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "label.main" }}>
          {successCopy.total}
        </Typography>
        <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, color: "primary.main" }}>
          {formatEur(priceCents)}
        </Typography>
      </Stack>
    </Stack>
  );
};

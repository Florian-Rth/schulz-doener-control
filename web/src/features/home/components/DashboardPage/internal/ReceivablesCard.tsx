import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useReceivables } from "../../../api";
import { homeCopy } from "../../../copy";
import { ReceivableRowItem } from "./ReceivableRowItem";

// White "Was mir noch zusteht" card: header (title + open count badge + open
// total) over the receivable rows (open first, then settled — backend order).
// Read-only — no settle/PayPal actions. Fetches via its own one-shot query (NOT
// the dashboard aggregate). Renders nothing while loading or when nobody owes
// the caller anything.
export const ReceivablesCard: FC = () => {
  const receivablesQuery = useReceivables();
  const data = receivablesQuery.data;
  const rows = data?.rows ?? [];

  if (rows.length === 0) {
    return null;
  }

  const lastIndex = rows.length - 1;

  return (
    <Paper
      sx={(theme) => ({
        p: 2,
        borderRadius: `${theme.radii.xl}px`,
        boxShadow: "0 2px 6px rgba(0,0,0,.10)",
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.75 }}>
        <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "navy.main" }}>
          {homeCopy.receivablesTitle}
        </Typography>
        {data !== undefined && data.openCount > 0 ? (
          <Typography
            sx={(theme) => ({
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "warning.contrastText",
              backgroundColor: "warning.main",
              borderRadius: `${theme.radii.sm - 1}px`,
              px: 1,
              py: 0.125,
            })}
          >
            {data.openCount}
          </Typography>
        ) : null}
        <Stack sx={{ flex: 1 }} />
        {data !== undefined ? (
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "warning.main" }}>
            {data.openTotalLabel}
          </Typography>
        ) : null}
      </Stack>

      <Stack>
        {rows.map((receivable, index) => (
          <ReceivableRowItem
            key={receivable.id}
            receivable={receivable}
            divider={index !== lastIndex}
          />
        ))}
      </Stack>
    </Paper>
  );
};

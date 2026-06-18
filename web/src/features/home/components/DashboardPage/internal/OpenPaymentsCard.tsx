import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { homeCopy } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";
import { DebtRowItem } from "./DebtRowItem";

// White "Offene Zahlungen" card: header (title + count badge + total) over the
// debt rows. Renders nothing when the caller owes nobody.
export const OpenPaymentsCard: FC = () => {
  const { debts } = useDashboardContext();

  if (debts.rows.length === 0) {
    return null;
  }

  const lastIndex = debts.rows.length - 1;

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
          {homeCopy.paymentsTitle}
        </Typography>
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
          {debts.openCount}
        </Typography>
        <Stack sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "warning.main" }}>
          {debts.totalLabel} €
        </Typography>
      </Stack>

      <Stack>
        {debts.rows.map((debt, index) => (
          <DebtRowItem key={debt.id} debt={debt} divider={index !== lastIndex} />
        ))}
      </Stack>
    </Paper>
  );
};

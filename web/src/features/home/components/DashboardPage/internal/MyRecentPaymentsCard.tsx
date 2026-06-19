import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useMyPaymentHistory } from "../../../api";
import { homeCopy } from "../../../copy";
import { PaymentHistoryRowItem } from "./PaymentHistoryRowItem";

// White "Meine letzten Zahlungen" card: header (title) over the settled-payment
// rows (newest-settled first, capped at 10 by the backend). Read-only history —
// no PayPal/settle actions. Fetches via its own query (NOT the dashboard
// aggregate). Renders nothing while loading or when the caller has paid nobody.
export const MyRecentPaymentsCard: FC = () => {
  const historyQuery = useMyPaymentHistory();
  const payments = historyQuery.data?.payments ?? [];

  if (payments.length === 0) {
    return null;
  }

  const lastIndex = payments.length - 1;

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
          {homeCopy.paymentHistoryTitle}
        </Typography>
      </Stack>

      <Stack>
        {payments.map((payment, index) => (
          <PaymentHistoryRowItem
            key={`${payment.settledAt}-${payment.personName}`}
            payment={payment}
            divider={index !== lastIndex}
          />
        ))}
      </Stack>
    </Paper>
  );
};

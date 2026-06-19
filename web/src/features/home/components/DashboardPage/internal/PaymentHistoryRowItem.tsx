import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar } from "@/components";
import { formatSettledDate } from "../../../copy";
import type { PaymentHistoryRow } from "../../../types";

interface PaymentHistoryRowItemProps {
  payment: PaymentHistoryRow;
  /** Every row but the last gets a hairline divider below. */
  divider: boolean;
}

// One settled-payment history row: creditor avatar + name + reason over the
// amount and the short German settle date. Read-only — no pay/settle actions.
// The amountLabel already carries " €" (new-endpoint convention) → rendered
// as-is, no appended unit.
export const PaymentHistoryRowItem: FC<PaymentHistoryRowItemProps> = ({ payment, divider }) => {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 1.375,
        py: 1.25,
        borderBottom: divider ? "1px solid rgba(0,34,48,.07)" : "none",
      }}
    >
      <Avatar displayName={payment.personName} colorHex={payment.avatarColorHex} size={36} />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "navy.main" }}>
          {payment.personName}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>{payment.reason}</Typography>
      </Stack>
      <Stack sx={{ alignItems: "flex-end", gap: 0.25 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
          {payment.amountLabel}
        </Typography>
        <Typography sx={{ fontSize: "0.6875rem", color: "muted.main" }}>
          {formatSettledDate(payment.settledAt)}
        </Typography>
      </Stack>
    </Stack>
  );
};

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar, PayPalButton } from "@/components";
import { homeCopy } from "../../../copy";
import type { DebtRow } from "../../../types";
import { SettleDebtButton } from "./SettleDebtButton";

interface DebtRowItemProps {
  debt: DebtRow;
  /** First row gets a divider below; the last row does not. */
  divider: boolean;
}

// One open-payment row: creditor avatar + name + reason/day over the amount and
// a PayPal button. When the creditor has no handle (paypalUrl null) we drop the
// dead button for a muted "Bar zahlen" hint instead.
export const DebtRowItem: FC<DebtRowItemProps> = ({ debt, divider }) => {
  const reasonLine = debt.dayLabel !== null ? `${debt.reason} · ${debt.dayLabel}` : debt.reason;

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
      <Avatar displayName={debt.creditorName} colorHex={debt.creditorAvatarColorHex} size={36} />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "navy.main" }}>
          {debt.creditorName}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>{reasonLine}</Typography>
      </Stack>
      <Stack sx={{ alignItems: "flex-end", gap: 0.5 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
          {debt.amountLabel} €
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
          <SettleDebtButton debtId={debt.id} />
          {debt.paypalUrl !== null ? (
            <PayPalButton href={debt.paypalUrl} size="pill">
              {homeCopy.pay}
            </PayPalButton>
          ) : (
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "muted.main" }}>
              {homeCopy.payCash}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

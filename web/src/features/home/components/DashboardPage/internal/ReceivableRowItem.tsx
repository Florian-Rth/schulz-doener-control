import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar } from "@/components";
import { formatSettledDate, homeCopy } from "../../../copy";
import type { ReceivableRow } from "../../../types";

interface ReceivableRowItemProps {
  receivable: ReceivableRow;
  /** Every row but the last gets a hairline divider below. */
  divider: boolean;
}

// One receivable row: debtor avatar + name + reason/day over the amount and a
// state chip. Open → an orange "Offen" pill; settled → a green "Bezahlt" line
// with the short German settle date. Read-only — no settle/PayPal actions.
// `amountLabel` already carries " €" (new-endpoint convention) → rendered as-is.
export const ReceivableRowItem: FC<ReceivableRowItemProps> = ({ receivable, divider }) => {
  const reasonLine =
    receivable.dayLabel !== null
      ? `${receivable.reason} · ${receivable.dayLabel}`
      : receivable.reason;

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
      <Avatar displayName={receivable.debtorName} colorHex={receivable.avatarColorHex} size={36} />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "navy.main" }}>
          {receivable.debtorName}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>{reasonLine}</Typography>
      </Stack>
      <Stack sx={{ alignItems: "flex-end", gap: 0.5 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
          {receivable.amountLabel}
        </Typography>
        {receivable.isSettled ? (
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "success.main" }}>
              {homeCopy.receivableSettled}
            </Typography>
            {receivable.settledAt !== null ? (
              <Typography sx={{ fontSize: "0.6875rem", color: "muted.main" }}>
                {formatSettledDate(receivable.settledAt)}
              </Typography>
            ) : null}
          </Stack>
        ) : (
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
            {homeCopy.receivableOpen}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

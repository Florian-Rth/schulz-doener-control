import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

interface PayPalButtonProps {
  /** PayPal.Me URL. When null the button renders disabled (no handle set). */
  href: string | null;
  children: ReactNode;
  /** `pill` = inline ledger button; `cta` = full-width success CTA. */
  size?: "pill" | "cta";
  sx?: SxProps<Theme>;
}

// Blue PayPal button. Opens PayPal.Me in a new tab; disabled when the
// recipient has not supplied a handle yet (href === null).
export const PayPalButton: FC<PayPalButtonProps> = ({ href, children, size = "cta", sx }) => {
  const disabled = href === null;
  const isCta = size === "cta";
  // When enabled the button renders as an anchor; only then are link props
  // (href/target/rel) valid. Disabled => a plain <button>, no link props.
  const linkProps = disabled
    ? {}
    : ({ href, target: "_blank", rel: "noopener noreferrer" } as const);

  return (
    <Button
      color="paypal"
      variant="contained"
      disabled={disabled}
      {...linkProps}
      startIcon={
        isCta ? <MaterialIcon name="account_balance_wallet" sx={{ fontSize: 20 }} /> : undefined
      }
      sx={[
        (theme) => ({
          borderRadius: isCta ? `${theme.radii.md}px` : `${theme.radii.sm - 3}px`,
          fontWeight: 700,
          ...(isCta
            ? { width: "100%", py: 1.875, fontSize: "0.9375rem" }
            : { py: 0.625, px: 1.5, fontSize: "0.75rem", minWidth: 0 }),
          "&:hover": { backgroundColor: theme.palette.paypal.dark },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Button>
  );
};

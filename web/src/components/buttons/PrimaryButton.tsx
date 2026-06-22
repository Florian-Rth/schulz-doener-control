import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ElementType, FC, ReactNode } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  /** Optional leading Material icon name. */
  startIcon?: string;
  sx?: SxProps<Theme>;
  /**
   * Render as another element (e.g. a router `Link`) while keeping the CTA
   * styling. When set to a link component, pass its target via `to`.
   */
  component?: ElementType;
  /** Router link target, forwarded to `component` when it is a `Link`. */
  to?: string;
  "aria-label"?: string;
}

// The red CTA. Carries the mock's red shadow and the muted-pink disabled state.
// Can also render as a router link (`component={Link} to="…"`) so a navigation
// CTA reuses the same styling instead of re-implementing it.
export const PrimaryButton: FC<PrimaryButtonProps> = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  startIcon,
  sx,
  component,
  to,
  "aria-label": ariaLabel,
}) => {
  return (
    <Button
      type={component === undefined ? type : undefined}
      onClick={onClick}
      disabled={disabled || loading}
      loading={loading}
      variant="contained"
      color="primary"
      component={component ?? "button"}
      to={to}
      aria-label={ariaLabel}
      startIcon={
        startIcon !== undefined ? (
          <MaterialIcon name={startIcon} sx={{ fontSize: 22 }} />
        ) : undefined
      }
      sx={[
        (theme) => ({
          width: "100%",
          py: 2,
          borderRadius: `${theme.radii.md}px`,
          fontSize: "1rem",
          fontWeight: 700,
          boxShadow: "0 6px 16px rgba(201,0,35,.28)",
          "&:hover": { backgroundColor: theme.palette.primary.dark, boxShadow: "none" },
          "&.Mui-disabled": {
            backgroundColor: theme.ds.disabledRed,
            color: theme.palette.primary.contrastText,
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Button>
  );
};

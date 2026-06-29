import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ElementType, FC, ReactNode } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

interface SecondaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  /** Optional leading Material icon name. */
  startIcon?: string;
  sx?: SxProps<Theme>;
  /**
   * Render as another element (e.g. a router `Link`) while keeping the styling.
   * When set to a link component, pass its target via `to`.
   */
  component?: ElementType;
  /** Router link target, forwarded to `component` when it is a `Link`. */
  to?: string;
  "aria-label"?: string;
}

// The navy outlined secondary CTA. Mirrors PrimaryButton's API but reads as the
// calmer, second-rank action (e.g. the collector's "edit my order" next to the
// red close action). Full-width, navy border + text.
export const SecondaryButton: FC<SecondaryButtonProps> = ({
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
      variant="outlined"
      color="navy"
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
          py: 1.75,
          borderRadius: `${theme.radii.md}px`,
          fontSize: "0.9375rem",
          fontWeight: 700,
          borderWidth: "1.5px",
          "&:hover": { borderWidth: "1.5px", backgroundColor: "transparent" },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Button>
  );
};

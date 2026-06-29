import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";

interface GhostButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  /** Optional leading Material icon name. */
  startIcon?: string;
  sx?: SxProps<Theme>;
}

// The outlined red "Zurück zur Übersicht" button — transparent fill, 1.5px red
// border, red text.
export const GhostButton: FC<GhostButtonProps> = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  startIcon,
  sx,
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      loading={loading}
      variant="outlined"
      color="primary"
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

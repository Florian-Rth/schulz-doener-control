import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
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
}

// The red CTA. Carries the mock's red shadow and the muted-pink disabled state.
export const PrimaryButton: FC<PrimaryButtonProps> = ({
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
      variant="contained"
      color="primary"
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

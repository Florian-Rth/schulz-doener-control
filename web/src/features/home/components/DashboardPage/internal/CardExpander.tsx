import Button from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC } from "react";
import { MaterialIcon } from "@/components";

interface CardExpanderProps {
  label: string;
  /** Chevron direction: down = more to come, up = collapse. */
  direction: "more" | "less";
  onClick: () => void;
  loading?: boolean;
  sx?: SxProps<Theme>;
}

// The quiet full-width "show more / show less" text button at the foot of a
// dashboard card (Bestenliste, Zahlungs-Historie).
export const CardExpander: FC<CardExpanderProps> = ({
  label,
  direction,
  onClick,
  loading = false,
  sx,
}) => {
  return (
    <Button
      variant="text"
      onClick={onClick}
      loading={loading}
      endIcon={
        <MaterialIcon
          name={direction === "more" ? "expand_more" : "expand_less"}
          sx={{ fontSize: 20 }}
        />
      }
      sx={[
        (theme) => ({
          width: "100%",
          borderRadius: `${theme.radii.md}px`,
          fontSize: "0.75rem",
          fontWeight: 700,
          color: theme.palette.muted.main,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label}
    </Button>
  );
};

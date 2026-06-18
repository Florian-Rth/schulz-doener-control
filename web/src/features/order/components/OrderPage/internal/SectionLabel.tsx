import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC } from "react";

interface SectionLabelProps {
  label: string;
  /** Optional muted hint shown after the label (e.g. "· Mehrfachauswahl"). */
  hint?: string;
  /** `eyebrow` = uppercase section heading; `field` = small field label. */
  variant?: "eyebrow" | "field";
  sx?: SxProps<Theme>;
}

// Section / field heading. Presentational only.
export const SectionLabel: FC<SectionLabelProps> = ({ label, hint, variant = "field", sx }) => {
  if (variant === "eyebrow") {
    return (
      <Typography variant="eyebrow" sx={[...(Array.isArray(sx) ? sx : [sx])]}>
        {label}
      </Typography>
    );
  }
  return (
    <Stack
      direction="row"
      sx={[{ alignItems: "center", gap: 0.75 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}>
        {label}
      </Typography>
      {hint !== undefined ? (
        <Typography sx={{ fontSize: "0.6875rem", color: "muted.main" }}>{hint}</Typography>
      ) : null}
    </Stack>
  );
};

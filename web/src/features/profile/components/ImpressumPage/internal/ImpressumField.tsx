import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";

interface ImpressumFieldProps {
  label: string;
  value: string;
}

// A single labelled legal-notice line: small grey label above the value. The
// value is plain text (often a TODO placeholder until real details are filled).
export const ImpressumField: FC<ImpressumFieldProps> = ({ label, value }) => {
  return (
    <Stack sx={{ gap: 0.25 }}>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.9375rem", color: "navy.main", whiteSpace: "pre-line" }}>
        {value}
      </Typography>
    </Stack>
  );
};

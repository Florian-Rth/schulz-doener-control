import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC, ReactNode } from "react";

interface ImpressumSectionProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

// A white paper card with a labelled header (eyebrow + title) above its body.
// Self-contained surface styling; the parent controls spacing between cards via
// the enclosing Stack's `gap`.
export const ImpressumSection: FC<ImpressumSectionProps> = ({ eyebrow, title, children }) => {
  return (
    <Stack
      sx={(theme) => ({
        gap: 1,
        p: 2.25,
        borderRadius: `${theme.radii.lg}px`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 8px 24px rgba(15,23,42,.08)",
      })}
    >
      <Stack sx={{ gap: 0.25 }}>
        <Typography variant="eyebrow" sx={{ color: "primary.main" }}>
          {eyebrow}
        </Typography>
        <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.main" }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Stack>
  );
};

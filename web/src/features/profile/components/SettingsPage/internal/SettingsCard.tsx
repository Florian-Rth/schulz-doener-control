import Stack from "@mui/material/Stack";
import type { FC, ReactNode } from "react";

interface SettingsCardProps {
  children: ReactNode;
}

// White paper surface for one settings card. Self-contained surface styling
// only; the parent controls spacing between cards via the enclosing Stack's
// `gap`.
export const SettingsCard: FC<SettingsCardProps> = ({ children }) => {
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
      {children}
    </Stack>
  );
};

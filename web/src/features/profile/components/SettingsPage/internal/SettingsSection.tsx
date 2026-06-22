import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC, ReactNode } from "react";
import { SettingsCard } from "./SettingsCard";

interface SettingsSectionProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

// A settings card with a labelled header (eyebrow + title) above its body.
export const SettingsSection: FC<SettingsSectionProps> = ({ eyebrow, title, children }) => {
  return (
    <SettingsCard>
      <Stack sx={{ gap: 0.25 }}>
        <Typography variant="eyebrow" sx={{ color: "primary.main" }}>
          {eyebrow}
        </Typography>
        <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.main" }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </SettingsCard>
  );
};

import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton } from "@/components";
import { useFunnyLine } from "@/lib/use-funny-line";
import { settingsCopy } from "../../../copy";
import { SettingsSection } from "./SettingsSection";

interface SecuritySectionProps {
  onChangePassword: () => void;
}

// "Sicherheit" card: a short intro and a ghost button to the change-password
// screen. No logic of its own — the parent supplies the navigation handler.
export const SecuritySection: FC<SecuritySectionProps> = ({ onChangePassword }) => {
  const intro = useFunnyLine(settingsCopy.securityIntros);

  return (
    <SettingsSection
      eyebrow={settingsCopy.securitySectionEyebrow}
      title={settingsCopy.securitySectionTitle}
    >
      <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5 }}>
        {intro}
      </Typography>
      <GhostButton onClick={onChangePassword} sx={{ mt: 0.5 }}>
        {settingsCopy.changePasswordLink}
      </GhostButton>
    </SettingsSection>
  );
};

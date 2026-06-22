import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar } from "@/components";
import type { Session } from "@/features/auth";
import { settingsCopy } from "../../../copy";
import { DisplayNameForm } from "../../DisplayNameForm";
import { SettingsSection } from "./SettingsSection";

interface IdentitySectionProps {
  user: Session;
}

// "Identität" card: the live avatar + a read-only identity line, then the
// editable display-name form. The avatar re-derives its initials/color from the
// session, which the form's save invalidates — so it updates right after a save.
export const IdentitySection: FC<IdentitySectionProps> = ({ user }) => {
  return (
    <SettingsSection
      eyebrow={settingsCopy.identitySectionEyebrow}
      title={settingsCopy.identitySectionTitle}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
        <Avatar displayName={user.displayName} colorHex={user.avatarColorHex} size={48} />
        <Stack sx={{ gap: 0.25, minWidth: 0 }}>
          <Typography variant="eyebrow" sx={{ color: "label.main" }}>
            {settingsCopy.identityPreviewLabel}
          </Typography>
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
            {user.displayName}
          </Typography>
        </Stack>
      </Stack>

      <DisplayNameForm initialName={user.displayName} />
    </SettingsSection>
  );
};

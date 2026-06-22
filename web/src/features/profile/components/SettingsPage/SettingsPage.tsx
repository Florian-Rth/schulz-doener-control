import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout } from "@/components";
import { useAuth } from "@/features/auth";
import { settingsCopy } from "../../copy";
import { IdentitySection } from "./internal/IdentitySection";
import { PayPalSection } from "./internal/PayPalSection";
import { SecuritySection } from "./internal/SecuritySection";
import { SettingsHeader } from "./internal/SettingsHeader";

// The self-service settings hub. Layout only: reads the session via `useAuth`
// and composes the red header + three section cards (Identität, Geld kassieren,
// Sicherheit). All logic lives inside the section forms/hooks. While the session
// is loading/absent it renders a minimal loading line.
export const SettingsPage: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goHome = (): void => {
    void navigate({ to: "/" });
  };

  const goToChangePassword = (): void => {
    void navigate({ to: "/passwort-aendern" });
  };

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <SettingsHeader onBack={goHome} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.75 }}>
        {user === null ? (
          <Typography sx={{ fontSize: "0.875rem", color: "label.main", px: 0.25 }}>
            {settingsCopy.loading}
          </Typography>
        ) : (
          <>
            <IdentitySection user={user} />
            <PayPalSection payPalHandle={user.payPalHandle} />
            <SecuritySection onChangePassword={goToChangePassword} />
          </>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
};

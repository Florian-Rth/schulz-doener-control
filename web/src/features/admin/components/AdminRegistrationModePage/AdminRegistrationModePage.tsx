import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout } from "@/components";
import { useAdminRegistrationMode } from "../../api";
import { registrationCopy } from "../../copy";
import { AdminRegistrationHeader } from "./internal/AdminRegistrationHeader";
import { RegistrationModeForm } from "./internal/RegistrationModeForm";

// The registration-mode administration screen (/admin/registrierung). The data query lives in
// `useAdminRegistrationMode`; the form (selector + secret key + save) is mounted only once the GET
// resolves so its RHF defaults are the loaded values. This body composes the header, intro and the
// loading / error / form states.
export const AdminRegistrationModePage: FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAdminRegistrationMode();

  return (
    <PageLayout bg="app">
      <PageLayout.Header>
        <AdminRegistrationHeader onBack={() => void navigate({ to: "/admin" })} />
      </PageLayout.Header>
      <PageLayout.Content sx={{ gap: 1.5 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.5, px: 0.25 }}>
          {registrationCopy.intro}
        </Typography>

        {isLoading ? (
          <Typography sx={{ fontSize: "0.875rem", color: "muted.main", px: 0.25 }}>
            {registrationCopy.loading}
          </Typography>
        ) : null}

        {isError ? (
          <Typography role="alert" sx={{ fontSize: "0.875rem", color: "primary.main", px: 0.25 }}>
            {registrationCopy.loadError}
          </Typography>
        ) : null}

        {data !== undefined ? (
          <RegistrationModeForm initialMode={data.mode} initialSecretKey={data.secretKey} />
        ) : null}
      </PageLayout.Content>
    </PageLayout>
  );
};

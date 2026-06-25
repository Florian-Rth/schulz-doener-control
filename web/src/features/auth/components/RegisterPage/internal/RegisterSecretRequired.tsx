import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { PrimaryButton } from "@/components/buttons";
import { authCopy } from "../../../copy";

// Presentational panel shown when registration is secret-key-only and the visitor arrived without a
// key in the QR-link. There is no form to fill; the only path forward is back to the login screen.
export const RegisterSecretRequired: FC = () => {
  return (
    <Stack sx={{ width: "100%", alignItems: "center", gap: 1 }}>
      <Typography
        component="h1"
        sx={{ fontSize: 22, fontWeight: 700, color: "navy.main", letterSpacing: "-0.01em" }}
      >
        {authCopy.registerSecretRequiredTitle}
      </Typography>
      <Typography
        sx={{ fontSize: 13, color: "muted.main", maxWidth: 280, lineHeight: 1.45, mb: 1 }}
      >
        {authCopy.registerSecretRequiredBody}
      </Typography>
      <PrimaryButton component={Link} to="/login" aria-label={authCopy.toLogin}>
        {authCopy.toLogin}
      </PrimaryButton>
    </Stack>
  );
};

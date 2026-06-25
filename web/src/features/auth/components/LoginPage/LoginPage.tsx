import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import logoUrl from "@/assets/logo.png";
import { PrimaryButton } from "@/components/buttons";
import { authCopy } from "../../copy";
import { useLoginForm } from "../../hooks/use-login-form";
import { AuthRegistrationMode } from "../../schemas";
import { LoginField } from "./internal/LoginField";
import { ServerStatusLine } from "./internal/ServerStatusLine";

interface LoginPageProps {
  /** Optional deep-link target to return to after a successful login. */
  redirect?: string;
  /**
   * The self-registration mode from the client config (1 Enabled / 2 Disabled /
   * 3 SecretKeyOnly), supplied by the route. When Disabled the register link is
   * hidden. Defaults to Enabled so the link shows while the config resolves.
   */
  registrationMode?: number;
}

// Layout shell for the login screen: a centered column on the login background,
// matching the mock. Logic lives in `useLoginForm`; this body only composes.
export const LoginPage: FC<LoginPageProps> = ({
  redirect,
  registrationMode = AuthRegistrationMode.Enabled,
}) => {
  const { form, onSubmit, isPending, serverError } = useLoginForm({ redirect });
  const showRegisterLink = registrationMode !== AuthRegistrationMode.Disabled;

  return (
    <Stack
      sx={(theme) => ({
        // Fill the screen including when the mobile URL bar shows/hides.
        // `100dvh` is the dynamic viewport height; the `100vh`/`100%` fallback
        // for browsers without `dvh` lives on `#root` in AppGlobalStyles (which
        // is full height there), so this just opts into the dynamic unit.
        minHeight: "100dvh",
        width: "100%",
        px: 3.5,
        pb: 3.5,
        backgroundColor: theme.palette.background.login,
      })}
    >
      <Stack sx={{ height: "64px", flexShrink: 0 }} aria-hidden />
      <Stack
        sx={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 0.5,
        }}
      >
        <Box
          component="img"
          src={logoUrl}
          alt={authCopy.brandAlt}
          sx={{ width: 248, maxWidth: "100%", height: "auto", display: "block", mb: 0.75 }}
        />
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "primary.main",
            textTransform: "uppercase",
          }}
        >
          {authCopy.eyebrow}
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: 22,
            fontWeight: 700,
            color: "navy.main",
            mt: 1.75,
            letterSpacing: "-0.01em",
          }}
        >
          {authCopy.heading}
        </Typography>
        <Typography
          sx={{ fontSize: 13, color: "muted.main", maxWidth: 260, lineHeight: 1.45, mb: 1.5 }}
        >
          {authCopy.subline}
        </Typography>

        <Stack
          component="form"
          noValidate
          onSubmit={onSubmit}
          sx={{ width: "100%", gap: 0.5, textAlign: "left" }}
        >
          <LoginField
            control={form.control}
            name="username"
            label={authCopy.usernameLabel}
            placeholder={authCopy.usernamePlaceholder}
            autoComplete="username"
          />
          <LoginField
            control={form.control}
            name="password"
            label={authCopy.passwordLabel}
            placeholder={authCopy.passwordPlaceholder}
            type="password"
            autoComplete="current-password"
          />

          {serverError !== null ? (
            <Typography role="alert" sx={{ fontSize: 13, color: "primary.main", fontWeight: 600 }}>
              {serverError}
            </Typography>
          ) : null}

          <PrimaryButton type="submit" loading={isPending} sx={{ mt: 1.5 }}>
            {authCopy.submit}
          </PrimaryButton>
        </Stack>

        {showRegisterLink ? (
          <Stack sx={{ mt: 1.75 }}>
            <Link to="/register" style={{ textDecoration: "none" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "primary.main" }}>
                {authCopy.loginToRegister}
              </Typography>
            </Link>
          </Stack>
        ) : null}

        <Stack sx={{ mt: 2.25 }}>
          <ServerStatusLine label={authCopy.serverStatus} />
        </Stack>
      </Stack>
    </Stack>
  );
};

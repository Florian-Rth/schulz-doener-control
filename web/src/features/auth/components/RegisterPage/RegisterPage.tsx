import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import logoUrl from "@/assets/logo.png";
import { PrimaryButton } from "@/components/buttons";
import { authCopy } from "../../copy";
import { useRegisterForm } from "../../hooks/use-register-form";
import { RegisterField } from "./internal/RegisterField";
import { RegisterSuccess } from "./internal/RegisterSuccess";

// Layout shell for the registration screen: a centered column on the login
// background, mirroring LoginPage. Logic lives in `useRegisterForm`; this body
// only composes the hook with the form / success panel.
export const RegisterPage: FC = () => {
  const { form, onSubmit, isPending, serverError, registered } = useRegisterForm();

  return (
    <Stack
      sx={(theme) => ({
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

        {registered ? (
          <RegisterSuccess />
        ) : (
          <>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "primary.main",
                textTransform: "uppercase",
              }}
            >
              {authCopy.registerEyebrow}
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
              {authCopy.registerHeading}
            </Typography>
            <Typography
              sx={{ fontSize: 13, color: "muted.main", maxWidth: 260, lineHeight: 1.45, mb: 1.5 }}
            >
              {authCopy.registerSubline}
            </Typography>

            <Stack
              component="form"
              noValidate
              onSubmit={onSubmit}
              sx={{ width: "100%", gap: 0.5, textAlign: "left" }}
            >
              <RegisterField
                control={form.control}
                name="username"
                label={authCopy.registerUsernameLabel}
                placeholder={authCopy.registerUsernamePlaceholder}
                autoComplete="username"
              />
              <RegisterField
                control={form.control}
                name="displayName"
                label={authCopy.registerDisplayNameLabel}
                placeholder={authCopy.registerDisplayNamePlaceholder}
                autoComplete="name"
              />
              <RegisterField
                control={form.control}
                name="payPalHandle"
                label={authCopy.registerPayPalHandleLabel}
                placeholder={authCopy.registerPayPalHandlePlaceholder}
                autoComplete="off"
              />
              <RegisterField
                control={form.control}
                name="password"
                label={authCopy.registerPasswordLabel}
                placeholder={authCopy.registerPasswordPlaceholder}
                type="password"
                autoComplete="new-password"
              />
              <RegisterField
                control={form.control}
                name="confirmPassword"
                label={authCopy.registerConfirmPasswordLabel}
                placeholder={authCopy.registerConfirmPasswordPlaceholder}
                type="password"
                autoComplete="new-password"
              />

              {serverError !== null ? (
                <Typography
                  role="alert"
                  sx={{ fontSize: 13, color: "primary.main", fontWeight: 600 }}
                >
                  {serverError}
                </Typography>
              ) : null}

              <PrimaryButton type="submit" loading={isPending} sx={{ mt: 1.5 }}>
                {authCopy.registerSubmit}
              </PrimaryButton>
            </Stack>

            <Stack sx={{ mt: 2.25 }}>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "primary.main" }}>
                  {authCopy.toLogin}
                </Typography>
              </Link>
            </Stack>
          </>
        )}
      </Stack>
    </Stack>
  );
};

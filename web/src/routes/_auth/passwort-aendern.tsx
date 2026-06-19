import Stack from "@mui/material/Stack";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components";
import { ChangePasswordForm } from "@/features/profile";

// The password-change screen. Serves BOTH the forced first-login change (the
// guard routes a locked account here) and the self-service change reached from
// the profile menu. Pure layout: composes the page shell around the
// change-password feature form. The form derives forced-vs-self-service from the
// session (`useAuth().user.mustChangePassword`) and adapts itself; all logic
// lives in the feature hook.
const PasswortAendernRoute = () => {
  return (
    <PageLayout bg="login">
      <PageLayout.Content sx={{ flex: 1, justifyContent: "center" }}>
        <Stack
          sx={(theme) => ({
            width: "100%",
            p: 2.5,
            borderRadius: `${theme.radii.lg}px`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: "0 8px 24px rgba(15,23,42,.08)",
          })}
        >
          <ChangePasswordForm />
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
};

export const Route = createFileRoute("/_auth/passwort-aendern")({
  component: PasswortAendernRoute,
});

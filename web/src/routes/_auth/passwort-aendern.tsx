import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";

// Placeholder shell for the forced password-change screen (reached when the
// backend reports `mustChangePassword`); the auth-management feature fills it in.
const PasswortAendernRoute = () => {
  return (
    <Stack sx={{ p: 2, gap: 1 }}>
      <Typography variant="h2" sx={{ color: "navy.main" }}>
        Passwort ändern
      </Typography>
      <Typography sx={{ color: "muted.main" }}>Bitte vergib ein neues Passwort, Chef.</Typography>
    </Stack>
  );
};

export const Route = createFileRoute("/_auth/passwort-aendern")({
  component: PasswortAendernRoute,
});

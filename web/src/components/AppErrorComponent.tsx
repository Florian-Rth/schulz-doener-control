import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { FC } from "react";

// Root-level error boundary fallback for the router (the router warns if a root
// route has none). Page-level by nature: it replaces the whole route, so it owns
// its own full-viewport centering. It never renders `null` — a blank screen with
// no recourse is worse than a visible "try again", even for a transient error.
export const AppErrorComponent: FC<ErrorComponentProps> = ({ reset }) => {
  return (
    <Stack
      sx={{
        minHeight: "100dvh",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2,
        p: 4,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
        Da ist was angebrannt, Chef.
      </Typography>
      <Typography sx={{ color: "text.secondary", maxWidth: 360 }}>
        Beim Laden ist ein unerwarteter Fehler aufgetreten. Versuch es bitte erneut.
      </Typography>
      <Button variant="contained" onClick={reset}>
        Erneut versuchen
      </Button>
    </Stack>
  );
};

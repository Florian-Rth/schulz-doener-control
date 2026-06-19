import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CancelledError } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { FC } from "react";

// A query or navigation cancelled because the user navigated away (or React
// StrictMode remounted in dev) is not a real failure — it must not render an
// error screen.
const isBenignCancellation = (error: unknown): boolean => {
  if (error instanceof CancelledError) {
    return true;
  }
  return error instanceof Error && (error.name === "CancelledError" || error.name === "AbortError");
};

// Root-level error boundary fallback for the router. Page-level by nature: it
// replaces the whole route, so it owns its own full-viewport centering.
export const AppErrorComponent: FC<ErrorComponentProps> = ({ error, reset }) => {
  if (isBenignCancellation(error)) {
    return null;
  }

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

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";

// Placeholder shell for the Döner-Tiere catalog; the tiere feature fills this in.
const TiereRoute = () => {
  return (
    <Stack sx={{ p: 2, gap: 1 }}>
      <Typography variant="h2" sx={{ color: "navy.main" }}>
        Döner-Tiere
      </Typography>
      <Typography sx={{ color: "muted.main" }}>Alle 15 erfassten Exemplare.</Typography>
    </Stack>
  );
};

export const Route = createFileRoute("/_auth/tiere")({
  component: TiereRoute,
});

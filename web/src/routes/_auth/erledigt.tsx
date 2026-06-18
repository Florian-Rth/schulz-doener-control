import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const erledigtSearchSchema = z.object({
  orderId: z.string().min(1),
});

// Placeholder shell for the success screen; the success feature fills this in.
// Success is URL-driven: `orderId` survives a refresh. Missing id → back home.
const ErledigtRoute = () => {
  return (
    <Stack sx={{ p: 2, gap: 1 }}>
      <Typography variant="h2" sx={{ color: "success.main" }}>
        Erledigt, Chef
      </Typography>
      <Typography sx={{ color: "muted.main" }}>
        Bestellung in der Werks-Telemetrie verbucht ✓
      </Typography>
    </Stack>
  );
};

export const Route = createFileRoute("/_auth/erledigt")({
  validateSearch: erledigtSearchSchema,
  onError: () => {
    throw redirect({ to: "/" });
  },
  component: ErledigtRoute,
});

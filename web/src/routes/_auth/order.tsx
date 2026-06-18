import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";

// Placeholder shell for the order screen; the order feature fills this in.
const OrderRoute = () => {
  return (
    <Stack sx={{ p: 2, gap: 1 }}>
      <Typography variant="h2" sx={{ color: "navy.main" }}>
        Bestellung, Chef
      </Typography>
      <Typography sx={{ color: "muted.main" }}>Döner-Tag · Donnerstag.</Typography>
    </Stack>
  );
};

export const Route = createFileRoute("/_auth/order")({
  component: OrderRoute,
});

import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/profile";

// The self-service settings hub: rename, PayPal handle (incl. clear-to-cash) and
// a jump to the password change. Under `_auth` so it is only reachable while
// authenticated. Pure composition — all logic lives in the feature.
export const Route = createFileRoute("/_auth/einstellungen")({
  component: SettingsPage,
});

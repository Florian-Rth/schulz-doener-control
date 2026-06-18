import { createFileRoute } from "@tanstack/react-router";
import { BenachrichtigungenPage } from "@/features/push";

// Web-Push notification settings: subscribe / unsubscribe + permission flow.
export const Route = createFileRoute("/_auth/benachrichtigungen")({
  component: BenachrichtigungenPage,
});

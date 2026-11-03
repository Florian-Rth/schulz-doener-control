import { createFileRoute } from "@tanstack/react-router";
import { WeitwurfPage } from "@/features/game";

// The Döner-Weitwurf: a throwing mini-game while the Abholer is on the way.
export const Route = createFileRoute("/_auth/weitwurf")({
  component: WeitwurfPage,
});

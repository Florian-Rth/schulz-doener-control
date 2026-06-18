import { createFileRoute } from "@tanstack/react-router";
import { TiereCatalogPage } from "@/features/tiere";

// The Döner-Tiere catalog screen: all 15 Tiere with the caller's own badged.
export const Route = createFileRoute("/_auth/tiere")({
  component: TiereCatalogPage,
});

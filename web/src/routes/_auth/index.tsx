import { createFileRoute } from "@tanstack/react-router";
import { DashboardProvider } from "@/features/home";

// The home/dashboard screen. The greeting name + all slices come from the
// server-driven `GET /api/dashboard` aggregate inside the provider.
export const Route = createFileRoute("/_auth/")({
  component: DashboardProvider,
});

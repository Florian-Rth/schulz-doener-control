import { createFileRoute } from "@tanstack/react-router";
import { PrintProvider } from "@/features/print";

// The printable Abholer order list: hand it to the Döner-Laden. Reads today's
// open Döner-Tag from the dashboard aggregate; the same component renders on the
// phone and on paper (toggled by @media print CSS only).
export const Route = createFileRoute("/_auth/druck")({
  component: PrintProvider,
});

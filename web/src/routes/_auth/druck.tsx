import { createFileRoute } from "@tanstack/react-router";
import { PrintProvider } from "@/features/print";
import { useClientConfig } from "@/features/pwa-gate";

// The printable Abholer order list: hand it to the Döner-Laden. Reads today's
// open Döner-Tag from the dashboard aggregate; the same component renders on the
// phone and on paper (toggled by @media print CSS only).
//
// emailPdfEnabled is threaded in from this route (chosen approach a): the print
// feature must NOT import @/features/pwa-gate, but the route may compose both —
// so the route reads the client config here and hands the flag to PrintProvider
// as a prop. (It also reads session.workEmail itself via the blessed @/features/auth.)
const PrintRoute = () => {
  const config = useClientConfig();
  return <PrintProvider emailPdfEnabled={config.data?.emailPdfEnabled ?? false} />;
};

export const Route = createFileRoute("/_auth/druck")({
  component: PrintRoute,
});

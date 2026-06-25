import { createFileRoute } from "@tanstack/react-router";
import { ImpressumPage } from "@/features/profile";

// The German legal notice (Impressum) per §5 DDG. Under `_auth` so it is only
// reachable while authenticated. Pure composition — all content lives in the
// feature (the values are TODO placeholders until the real legal details land).
export const Route = createFileRoute("/_auth/impressum")({
  component: ImpressumPage,
});

import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { SuccessPage } from "@/features/success";

const erledigtSearchSchema = z.object({
  orderId: z.string().min(1),
});

// Success is URL-driven: `orderId` survives a refresh. The validated search param
// feeds the server-fetched result. A missing/invalid id redirects back home.
const ErledigtRoute = () => {
  const { orderId } = Route.useSearch();
  return <SuccessPage orderId={orderId} />;
};

export const Route = createFileRoute("/_auth/erledigt")({
  validateSearch: erledigtSearchSchema,
  onError: () => {
    throw redirect({ to: "/" });
  },
  component: ErledigtRoute,
});

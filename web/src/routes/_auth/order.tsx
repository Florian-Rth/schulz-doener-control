import { createFileRoute } from "@tanstack/react-router";
import { OrderFormProvider } from "@/features/order";

export const Route = createFileRoute("/_auth/order")({
  component: OrderFormProvider,
});

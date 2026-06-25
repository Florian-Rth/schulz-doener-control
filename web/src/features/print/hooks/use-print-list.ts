import { useNavigate } from "@tanstack/react-router";
import type { DashboardDay } from "@/features/home";
import { dayTitle, orderCountSubline } from "../copy";
import { formatGermanDate } from "../format";
import { formatEur } from "../money";
import type { PrintListContextValue } from "../print-context";

interface UsePrintListArgs {
  /** The open Döner-Tag resolved from the dashboard payload. */
  day: DashboardDay;
}

// Logic layer for the printable list: turns the dashboard day into the fully
// derived view model (title, subline, Abholer line, rows, grand total) plus the
// print + navigation operations. No JSX, no layout.
export const usePrintList = ({ day }: UsePrintListArgs): PrintListContextValue => {
  const navigate = useNavigate();

  const totalCents = day.orders.reduce((sum, order) => sum + order.priceCents, 0);

  return {
    title: dayTitle(formatGermanDate(new Date())),
    subline: orderCountSubline(day.orders.length),
    abholerNames: day.pickupNames.join(", "),
    orders: day.orders,
    totalLabel: formatEur(totalCents),
    print: () => {
      window.print();
    },
    goBack: () => {
      void navigate({ to: "/" });
    },
  };
};

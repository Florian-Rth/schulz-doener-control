import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/features/auth";
import type { DashboardDay } from "@/features/home";
import { useEmailOrderListPdf } from "../api";
import { dayTitle, emailListSuccess, orderCountSubline, printCopy } from "../copy";
import { formatGermanDate } from "../format";
import { formatEur } from "../money";
import type { PrintListContextValue } from "../print-context";

interface UsePrintListArgs {
  /** The open Döner-Tag resolved from the dashboard payload. */
  day: DashboardDay;
  /** Backend SMTP toggle for the e-mail-the-list action, threaded in from the route. */
  emailPdfEnabled: boolean;
}

// Logic layer for the printable list: turns the dashboard day into the fully
// derived view model (title, subline, Abholer line, rows, grand total) plus the
// print + navigation operations and the e-mail-the-list action. No JSX, no layout.
export const usePrintList = ({ day, emailPdfEnabled }: UsePrintListArgs): PrintListContextValue => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const emailMutation = useEmailOrderListPdf();
  const [emailToast, setEmailToast] = useState<string | null>(null);

  const totalCents = day.orders.reduce((sum, order) => sum + order.priceCents, 0);

  // The caller has a usable work e-mail when it is set and non-empty.
  const workEmailSet =
    user?.workEmail !== null && user?.workEmail !== undefined && user.workEmail !== "";
  const dayId = day.id;

  const emailList = (): void => {
    if (dayId === null) {
      return;
    }
    emailMutation.mutate(dayId, {
      onSuccess: (result) => {
        setEmailToast(emailListSuccess(result.sentToAddress));
      },
      onError: () => {
        setEmailToast(printCopy.emailListError);
      },
    });
  };

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
    emailButtonVisible: emailPdfEnabled && workEmailSet,
    emailHintVisible: emailPdfEnabled && !workEmailSet,
    emailList,
    isEmailingList: emailMutation.isPending,
    emailToast,
    dismissEmailToast: () => {
      setEmailToast(null);
    },
  };
};

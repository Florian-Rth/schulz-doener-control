import { createContext, useContext } from "react";
import type { OrderRow } from "@/features/home";

// The fully-derived view model the printable list consumes. All display strings
// are computed in the logic layer (use-print-list) so the UI pieces stay dumb.
export interface PrintListContextValue {
  /** "Döner-Tag Donnerstag, 18. Juni 2026". */
  title: string;
  /** "3 Bestellungen" — order count for the printed sheet (no synonym). */
  subline: string;
  /** Comma-joined Abholer names; empty string when none designated. */
  abholerNames: string;
  /** One row per order, in payload order. */
  orders: OrderRow[];
  /** Grand total as German money, e.g. "25,00 €". */
  totalLabel: string;
  /** Fires window.print(). */
  print: () => void;
  /** Navigates back to the dashboard. */
  goBack: () => void;
  /**
   * True when the "Liste an meine Mail schicken" button should show — the backend
   * enabled it AND the caller has a work e-mail on file.
   */
  emailButtonVisible: boolean;
  /**
   * True when the action is enabled but the caller has no work e-mail yet — show
   * the "Hinterlege deine Arbeits-Mail"-Hinweis with a link to the settings instead.
   */
  emailHintVisible: boolean;
  /** E-mails today's order list as a PDF to the caller's work address. */
  emailList: () => void;
  /** True while the e-mail-the-list mutation is in flight. */
  isEmailingList: boolean;
  /** Success/error toast text for the e-mail action; null = nothing to show. */
  emailToast: string | null;
  /** Dismisses the e-mail toast. */
  dismissEmailToast: () => void;
}

// One context for the print compound group. UI pieces read it instead of
// threading the derived strings. Throws outside the provider to make a
// missing-wrapper bug loud.
export const PrintListContext = createContext<PrintListContextValue | null>(null);

export const usePrintListContext = (): PrintListContextValue => {
  const value = useContext(PrintListContext);
  if (value === null) {
    throw new Error("usePrintListContext muss innerhalb von <PrintProvider> verwendet werden.");
  }
  return value;
};

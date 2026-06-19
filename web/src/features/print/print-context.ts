import { createContext, useContext } from "react";
import type { OrderRow } from "@/features/home";

// The fully-derived view model the printable list consumes. All display strings
// are computed in the logic layer (use-print-list) so the UI pieces stay dumb.
export interface PrintListContextValue {
  /** "Döner-Tag Donnerstag, 18. Juni 2026". */
  title: string;
  /** "Drehspieß-Tasche · 3 Bestellungen". */
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

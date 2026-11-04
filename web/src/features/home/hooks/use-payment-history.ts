import { useMyPaymentHistory } from "../api";
import type { PaymentHistoryRow } from "../types";

interface PaymentHistoryState {
  payments: PaymentHistoryRow[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
}

// Flattens the paged history into one newest-first list and exposes "load the
// next page" for the card's expander.
export const usePaymentHistory = (): PaymentHistoryState => {
  const historyQuery = useMyPaymentHistory();

  return {
    payments: historyQuery.data?.pages.flatMap((page) => page.payments) ?? [],
    hasMore: historyQuery.hasNextPage,
    isLoadingMore: historyQuery.isFetchingNextPage,
    loadMore: (): void => {
      void historyQuery.fetchNextPage();
    },
  };
};

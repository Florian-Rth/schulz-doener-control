import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { OrderResultSchema } from "./schemas";
import type { OrderResult } from "./types";

export const successKeys = {
  result: (orderId: string) => ["success", "result", orderId] as const,
};

const fetchOrderResult = async (orderId: string, signal: AbortSignal): Promise<OrderResult> => {
  const data = await apiClient.get(`/api/orders/${orderId}/result`, signal);
  return OrderResultSchema.parse(data);
};

export const useOrderResult = (orderId: string) =>
  useQuery({
    queryKey: successKeys.result(orderId),
    queryFn: ({ signal }) => fetchOrderResult(orderId, signal),
  });

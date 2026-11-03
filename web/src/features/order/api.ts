import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  MenuSchema,
  MyOrderSchema,
  MyTierSchema,
  OrderDetailsSchema,
  TodayOrderDaySchema,
} from "./schemas";
import type { Menu, MyOrder, MyTier, OrderDetails, OrderForm, TodayOrderDay } from "./types";

export const orderKeys = {
  menu: ["order", "menu"] as const,
  today: ["order", "today"] as const,
  myOrder: (dayId: string) => ["order", "my-order", dayId] as const,
  myTier: ["order", "my-tier"] as const,
};

const fetchMenu = async (signal: AbortSignal): Promise<Menu> => {
  const data = await apiClient.get("/api/menu", signal);
  return MenuSchema.parse(data);
};

export const useMenu = () =>
  useQuery({
    queryKey: orderKeys.menu,
    queryFn: ({ signal }) => fetchMenu(signal),
    staleTime: 5 * 60 * 1000,
  });

const fetchToday = async (signal: AbortSignal): Promise<TodayOrderDay> => {
  const data = await apiClient.get("/api/order-days/today", signal);
  return TodayOrderDaySchema.parse(data);
};

export const useTodayOrderDay = () =>
  useQuery({
    queryKey: orderKeys.today,
    queryFn: ({ signal }) => fetchToday(signal),
  });

const fetchMyOrder = async (dayId: string, signal: AbortSignal): Promise<MyOrder> => {
  const data = await apiClient.get(`/api/order-days/${dayId}/orders/mine`, signal);
  return MyOrderSchema.parse(data);
};

export const useMyOrder = (dayId: string | null) =>
  useQuery({
    queryKey: orderKeys.myOrder(dayId ?? ""),
    queryFn: ({ signal }) => fetchMyOrder(dayId as string, signal),
    enabled: dayId !== null,
  });

const fetchMyTier = async (signal: AbortSignal): Promise<MyTier> => {
  const data = await apiClient.get("/api/tiere/mine", signal);
  return MyTierSchema.parse(data);
};

// The caller's Döner-Tier — it stands next to the Döner in the Konfigurator.
// Purely decorative: no retries, a failure just means no mascot.
export const useMyTier = () =>
  useQuery({
    queryKey: orderKeys.myTier,
    queryFn: ({ signal }) => fetchMyTier(signal),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

interface SubmitOrderArgs {
  dayId: string;
  values: OrderForm;
}

const submitOrder = async ({ dayId, values }: SubmitOrderArgs): Promise<OrderDetails> => {
  const body = {
    lines: values.lines.map((line) => ({
      productId: line.productId,
      answers: line.answers,
      priceCents: line.priceCents,
      quantity: line.quantity,
    })),
    isPickup: values.isPickup,
  };
  const data = await apiClient.put(`/api/order-days/${dayId}/orders/mine`, body);
  return OrderDetailsSchema.parse(data);
};

export const useSubmitOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.today });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

const deleteOrder = async (dayId: string): Promise<void> => {
  await apiClient.delete(`/api/order-days/${dayId}/orders/mine`);
};

// Withdraws the caller's order for the day. Invalidates the order queries + the dashboard aggregate
// (raw key, mirroring useSubmitOrder) so the running-day participant list/own-order state refresh.
export const useDeleteMyOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: (_data, dayId) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.today });
      void queryClient.invalidateQueries({ queryKey: orderKeys.myOrder(dayId) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

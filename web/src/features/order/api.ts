import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { MenuSchema, MyOrderSchema, OrderDetailsSchema, TodayOrderDaySchema } from "./schemas";
import type { Menu, MyOrder, OrderDetails, OrderForm, TodayOrderDay } from "./types";

export const orderKeys = {
  menu: ["order", "menu"] as const,
  today: ["order", "today"] as const,
  myOrder: (dayId: string) => ["order", "my-order", dayId] as const,
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

interface SubmitOrderArgs {
  dayId: string;
  values: OrderForm;
}

const submitOrder = async ({ dayId, values }: SubmitOrderArgs): Promise<OrderDetails> => {
  const body = {
    lines: values.lines.map((line) => ({
      productId: line.productId,
      meat: line.meat,
      pizzaVariant: line.pizzaVariant,
      sauces: line.sauces,
      priceCents: line.priceCents,
      extra: line.extra ?? null,
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

import type { z } from "zod";
import type {
  MenuItemSchema,
  MenuSchema,
  MyOrderSchema,
  OrderDetailsSchema,
  OrderFormSchema,
  TodayOrderDaySchema,
} from "./schemas";

export type MenuItem = z.infer<typeof MenuItemSchema>;
export type Menu = z.infer<typeof MenuSchema>;
export type OrderDetails = z.infer<typeof OrderDetailsSchema>;
export type MyOrder = z.infer<typeof MyOrderSchema>;
export type TodayOrderDay = z.infer<typeof TodayOrderDaySchema>;

export type OrderForm = z.infer<typeof OrderFormSchema>;

export type ProductKind = OrderForm["kind"];
export type MeatType = NonNullable<OrderForm["meat"]>;
export type SauceType = OrderForm["sauces"][number];
export type PizzaVariant = NonNullable<OrderForm["pizzaVariant"]>;

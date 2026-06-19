import type { z } from "zod";
import type {
  MenuItemSchema,
  MenuSchema,
  MyOrderSchema,
  OrderDetailsSchema,
  OrderFormSchema,
  OrderLineFormSchema,
  OrderLineSchema,
  TodayOrderDaySchema,
} from "./schemas";

export type MenuItem = z.infer<typeof MenuItemSchema>;
export type Menu = z.infer<typeof MenuSchema>;
export type OrderLine = z.infer<typeof OrderLineSchema>;
export type OrderDetails = z.infer<typeof OrderDetailsSchema>;
export type MyOrder = z.infer<typeof MyOrderSchema>;
export type TodayOrderDay = z.infer<typeof TodayOrderDaySchema>;

export type OrderForm = z.infer<typeof OrderFormSchema>;
export type OrderLineForm = z.infer<typeof OrderLineFormSchema>;

export type ProductKind = OrderLineForm["kind"];
export type MeatType = NonNullable<OrderLineForm["meat"]>;
export type SauceType = OrderLineForm["sauces"][number];
export type PizzaVariant = NonNullable<OrderLineForm["pizzaVariant"]>;

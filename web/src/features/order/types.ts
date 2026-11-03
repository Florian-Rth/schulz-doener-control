import type { z } from "zod";
import type {
  AnswerValueSchema,
  CategorySchema,
  FieldOptionSchema,
  FieldSchema,
  MenuItemSchema,
  MenuSchema,
  MyOrderSchema,
  MyTierSchema,
  OrderDetailsSchema,
  OrderFormSchema,
  OrderLineFormSchema,
  OrderLineSchema,
  TodayOrderDaySchema,
} from "./schemas";

export type FieldOption = z.infer<typeof FieldOptionSchema>;
export type Field = z.infer<typeof FieldSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type Menu = z.infer<typeof MenuSchema>;
export type AnswerValue = z.infer<typeof AnswerValueSchema>;
export type OrderLine = z.infer<typeof OrderLineSchema>;
export type OrderDetails = z.infer<typeof OrderDetailsSchema>;
export type MyOrder = z.infer<typeof MyOrderSchema>;
export type MyTier = z.infer<typeof MyTierSchema>;
export type TodayOrderDay = z.infer<typeof TodayOrderDaySchema>;

export type OrderForm = z.infer<typeof OrderFormSchema>;
export type OrderLineForm = z.infer<typeof OrderLineFormSchema>;

import type { z } from "zod";
import type { OrderResultSchema } from "./schemas";

export type OrderResult = z.infer<typeof OrderResultSchema>;
export type OrderResultLine = OrderResult["lines"][number];
export type Abholer = NonNullable<OrderResult["abholer"]>;

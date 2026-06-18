import type { z } from "zod";
import type { OrderResultSchema } from "./schemas";

export type OrderResult = z.infer<typeof OrderResultSchema>;
export type Abholer = NonNullable<OrderResult["abholer"]>;

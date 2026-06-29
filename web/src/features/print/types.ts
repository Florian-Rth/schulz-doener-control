import type { z } from "zod";
import type { EmailOrderListPdfResponseSchema } from "./schemas";

export type EmailOrderListPdfResponse = z.infer<typeof EmailOrderListPdfResponseSchema>;

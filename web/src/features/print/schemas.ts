import { z } from "zod";

// POST /api/order-days/{id}/email-pdf — the Abholer e-mails today's order list as
// a PDF to their own work address. The server resolves the recipient from the
// caller's stored work e-mail and returns the address it actually sent to (so the
// success toast can echo it back). Errors: 409 (SMTP off / day not open),
// 403 (not Abholer/admin), 400 (no work e-mail on file).
export const EmailOrderListPdfResponseSchema = z.object({
  sentToAddress: z.string(),
});

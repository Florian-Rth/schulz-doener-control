import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { EmailOrderListPdfResponseSchema } from "./schemas";
import type { EmailOrderListPdfResponse } from "./types";

// POST /api/order-days/{dayId}/email-pdf — the Abholer e-mails today's order list
// as a PDF to their own work address. The response carries the address the server
// sent to. No cache to invalidate (the print view is derived from the dashboard
// query, which this does not change), so the mutation only surfaces the result.
const emailOrderListPdf = async (dayId: string): Promise<EmailOrderListPdfResponse> => {
  const data = await apiClient.post(`/api/order-days/${dayId}/email-pdf`);
  return EmailOrderListPdfResponseSchema.parse(data);
};

export const useEmailOrderListPdf = () =>
  useMutation({
    mutationFn: emailOrderListPdf,
  });

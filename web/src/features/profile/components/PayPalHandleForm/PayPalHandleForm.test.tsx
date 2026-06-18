import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { PayPalHandleForm } from "@/features/profile";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";

// Seeds the CSRF cookie the apiClient echoes on the PUT mutation.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const renderForm = (ui: ReactElement): ReturnType<typeof render> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("PayPalHandleForm", () => {
  it("validiert ungültige Handles, bevor eine Anfrage rausgeht", async () => {
    let requestCount = 0;
    mswServer.use(
      http.put("*/api/profile/paypal-handle", () => {
        requestCount += 1;
        return HttpResponse.json({ payPalHandle: "Slash", payPalHandleSet: true });
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderForm(
      <PayPalHandleForm initialHandle={null} />,
    );

    await user.type(await findByLabelText("PayPal.Me-Name"), "hat slash/");
    await user.click(await findByRole("button", { name: "Speichern" }));

    // Validation message shown, no network call made.
    expect(await findByText(/nur Buchstaben und Zahlen/i)).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });

  it("speichert einen gültigen Handle per PUT und meldet Erfolg", async () => {
    seedXsrfCookie();
    const onSaved = vi.fn();
    let receivedBody: unknown = null;
    mswServer.use(
      http.put("*/api/profile/paypal-handle", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ payPalHandle: "MarkusW", payPalHandleSet: true });
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderForm(
      <PayPalHandleForm initialHandle={null} onSaved={onSaved} />,
    );

    await user.type(await findByLabelText("PayPal.Me-Name"), "MarkusW");
    await user.click(await findByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("MarkusW");
    });
    expect(receivedBody).toEqual({ payPalHandle: "MarkusW" });
    expect(await findByText(/gespeichert/i)).toBeInTheDocument();
  });
});

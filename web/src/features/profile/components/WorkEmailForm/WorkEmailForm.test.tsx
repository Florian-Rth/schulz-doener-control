import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { WorkEmailForm } from "@/features/profile";
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

describe("WorkEmailForm", () => {
  it("hält den Speichern-Knopf deaktiviert, solange nichts geändert wurde", async () => {
    const { findByRole } = renderForm(<WorkEmailForm initialEmail={null} />);

    expect(await findByRole("button", { name: "Arbeits-Mail speichern" })).toBeDisabled();
  });

  it("validiert eine ungültige E-Mail, bevor eine Anfrage rausgeht", async () => {
    let requestCount = 0;
    mswServer.use(
      http.put("*/api/profile/work-email", () => {
        requestCount += 1;
        return HttpResponse.json({ workEmail: null, workEmailSet: false });
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderForm(
      <WorkEmailForm initialEmail={null} />,
    );

    await user.type(await findByLabelText("Arbeits-E-Mail (optional)"), "kein-email");
    await user.click(await findByRole("button", { name: "Arbeits-Mail speichern" }));

    expect(
      await findByText("Bitte gib eine gültige E-Mail-Adresse ein, Chef."),
    ).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });

  it("speichert eine gültige Arbeits-Mail per PUT und meldet Erfolg", async () => {
    seedXsrfCookie();
    let receivedBody: unknown = null;
    mswServer.use(
      http.put("*/api/profile/work-email", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ workEmail: "max@schulz.st", workEmailSet: true });
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderForm(
      <WorkEmailForm initialEmail={null} />,
    );

    await user.type(await findByLabelText("Arbeits-E-Mail (optional)"), "max@schulz.st");
    await user.click(await findByRole("button", { name: "Arbeits-Mail speichern" }));

    await waitFor(() => {
      expect(receivedBody).toEqual({ workEmail: "max@schulz.st" });
    });
    expect(await findByText(/gespeichert/i)).toBeInTheDocument();
  });
});

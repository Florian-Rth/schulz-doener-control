import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { DisplayNameForm } from "@/features/profile";
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

describe("DisplayNameForm", () => {
  it("hält den Speichern-Knopf deaktiviert, solange nichts geändert wurde", async () => {
    const { findByRole } = renderForm(<DisplayNameForm initialName="Markus Wagner" />);

    expect(await findByRole("button", { name: "Namen speichern" })).toBeDisabled();
  });

  it("validiert einen leeren Namen, bevor eine Anfrage rausgeht", async () => {
    let requestCount = 0;
    mswServer.use(
      http.put("*/api/profile/display-name", () => {
        requestCount += 1;
        return HttpResponse.json({
          displayName: "Markus Wagner",
          initials: "MW",
          avatarColorHex: "#00728E",
        });
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderForm(
      <DisplayNameForm initialName="Markus Wagner" />,
    );

    await user.clear(await findByLabelText("Anzeigename"));
    await user.click(await findByRole("button", { name: "Namen speichern" }));

    expect(await findByText("Pflichtfeld")).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });

  it("speichert einen neuen Namen per PUT und meldet Erfolg", async () => {
    seedXsrfCookie();
    const onSaved = vi.fn();
    let receivedBody: unknown = null;
    mswServer.use(
      http.put("*/api/profile/display-name", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          displayName: "Markus W.",
          initials: "MW",
          avatarColorHex: "#00728E",
        });
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderForm(
      <DisplayNameForm initialName="Markus Wagner" onSaved={onSaved} />,
    );

    const field = await findByLabelText("Anzeigename");
    await user.clear(field);
    await user.type(field, "Markus W.");
    await user.click(await findByRole("button", { name: "Namen speichern" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("Markus W.");
    });
    expect(receivedBody).toEqual({ displayName: "Markus W." });
    expect(await findByText(/gespeichert/i)).toBeInTheDocument();
  });
});

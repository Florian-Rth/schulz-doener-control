import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";
import { konfiguratorCopy } from "../../copy";

// Every playful line is drawn at random from a pool — match any of them.
const oneOf =
  (pool: readonly string[]) =>
  (text: string): boolean =>
    pool.includes(text);

// jsdom has no WebGL — replace the three.js stage with a probe that exposes
// what would be in the bread.
vi.mock("@/components/DoenerStage/internal/scene/DoenerScene", () => ({
  DoenerScene: ({
    build,
    presenting,
  }: {
    build: { meat: string | null; veggies: string[]; sauces: string[] };
    presenting: boolean;
  }) => (
    <div data-testid="doener-scene" data-presenting={String(presenting)}>
      {[build.meat ?? "", ...build.veggies, ...build.sauces].join("|")}
    </div>
  ),
}));

const DAY_ID = "22222222-2222-2222-2222-222222222222";

const authenticatedSession = {
  userId: "11111111-1111-1111-1111-111111111111",
  displayName: "Markus Wagner",
  firstName: "Markus",
  initials: "MW",
  avatarColorHex: "#00728E",
  role: "employee",
  payPalHandleSet: true,
  payPalHandle: "MarkusW",
  mustChangePassword: false,
};

const menuResponse = {
  categories: [
    {
      key: "doener",
      name: "Döner",
      sortOrder: 1,
      fields: [
        {
          key: "meat",
          label: "Fleisch",
          type: "single",
          display: "segmented",
          maxLength: null,
          required: true,
          options: [
            { key: "kalb", label: "Kalb", icon: null, priceDeltaCents: 0 },
            { key: "haehnchen", label: "Hähnchen", icon: null, priceDeltaCents: 0 },
          ],
        },
        {
          key: "sauce",
          label: "Soße",
          type: "multi",
          display: "chips",
          maxLength: null,
          required: false,
          options: [
            { key: "kraeuter", label: "Kräuter", icon: "🌿", priceDeltaCents: 0 },
            { key: "knoblauch", label: "Knoblauch", icon: "🧄", priceDeltaCents: 0 },
            { key: "scharf", label: "Scharf", icon: "🌶", priceDeltaCents: 0 },
          ],
        },
        {
          key: "extra",
          label: "Extrawünsche",
          type: "text",
          display: "textarea",
          maxLength: 300,
          required: false,
          options: [],
        },
      ],
    },
  ],
  items: [
    {
      id: "doener",
      name: "Döner",
      categoryKey: "doener",
      baseItemKey: null,
      priceCents: 750,
      priceLabel: "7,50 €",
      materialIcon: "kebab_dining",
      note: null,
      isInsider: false,
      sortOrder: 1,
      defaultAnswers: null,
    },
    {
      id: "danny",
      name: "Danny-Box",
      categoryKey: "doener",
      baseItemKey: "doener",
      priceCents: 600,
      priceLabel: "6,00 €",
      materialIcon: "workspace_premium",
      note: "Pommes · Fleisch · Soße",
      isInsider: true,
      sortOrder: 5,
      defaultAnswers: null,
    },
  ],
};

const useHandlers = (onSubmit: (body: unknown) => void = () => {}): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/menu", () => HttpResponse.json(menuResponse)),
    http.get("*/api/order-days/today", () =>
      HttpResponse.json({ isOpen: true, day: { id: DAY_ID, iCanStillOrder: true } }),
    ),
    http.get("*/api/order-days/:dayId/orders/mine", () =>
      HttpResponse.json({ hasOrder: false, order: null }),
    ),
    http.put("*/api/order-days/:dayId/orders/mine", async ({ request }) => {
      const body: unknown = await request.json();
      onSubmit(body);
      return HttpResponse.json({
        id: "99999999-9999-9999-9999-999999999999",
        orderDayId: DAY_ID,
        lines: [],
        priceCents: 750,
        priceLabel: "7,50 €",
        isPickup: false,
      });
    }),
  );
};

describe("DoenerKonfigurator", () => {
  it("baut einen Döner Schritt für Schritt und übernimmt ihn in die Bestellung", async () => {
    let submitted: unknown = null;
    useHandlers((body) => {
      submitted = body;
    });
    // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
    document.cookie = "dc_xsrf=test-token";
    const user = userEvent.setup();
    const screen = renderApp({ initialPath: "/order" });

    await user.click(await screen.findByRole("button", { name: /^Döner/ }));
    await user.click(await screen.findByRole("button", { name: /Döner-Konfigurator/ }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(oneOf(konfiguratorCopy.meatQuestions))).toBeInTheDocument();
    expect(dialog.getByText("Schritt 1 von 8")).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "Hähnchen" }));

    // Salat, Tomaten yes · Gurken, Zwiebeln no · Rotkohl yes.
    const yes = (): Promise<void> =>
      user.click(dialog.getByRole("button", { name: oneOf(konfiguratorCopy.yes) }));
    const no = (): Promise<void> =>
      user.click(dialog.getByRole("button", { name: oneOf(konfiguratorCopy.no) }));
    await yes();
    await yes();
    await no();
    await no();
    await yes();

    expect(dialog.getByText(oneOf(konfiguratorCopy.sauceQuestions))).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: /Scharf/ }));
    await user.click(dialog.getByRole("button", { name: /Knoblauch/ }));
    expect(await dialog.findByTestId("doener-scene")).toHaveTextContent(
      "haehnchen|salat|tomate|rotkohl|scharf|knoblauch",
    );
    await user.click(dialog.getByRole("button", { name: oneOf(konfiguratorCopy.sauceNext) }));

    // Turntable presentation with the summary.
    expect(dialog.getByText(oneOf(konfiguratorCopy.doneTitles))).toBeInTheDocument();
    expect(dialog.getByTestId("doener-scene")).toHaveAttribute("data-presenting", "true");
    expect(dialog.getByText("Salat, Tomaten, Rotkohl")).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: oneOf(konfiguratorCopy.apply) }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("textbox", { name: "Extrawünsche" })).toHaveValue(
      "ohne Gurken, ohne Zwiebeln",
    );

    await user.click(screen.getByRole("button", { name: /Bestellung abgeben/ }));
    await waitFor(() => {
      expect(submitted).not.toBeNull();
    });
    expect(JSON.stringify(submitted)).toContain('"meat":{"options":["haehnchen"]}');
    // Menu order, not click order.
    expect(JSON.stringify(submitted)).toContain('"sauce":{"options":["knoblauch","scharf"]}');
    // The longest UI flow in the suite (17 clicks) — give it room under parallel load.
  }, 15_000);

  it("nimmt mit 'Einfach mit allem' das ganze Gemüse und springt zur Soße", async () => {
    useHandlers();
    const user = userEvent.setup();
    const screen = renderApp({ initialPath: "/order" });

    await user.click(await screen.findByRole("button", { name: /^Döner/ }));
    await user.click(await screen.findByRole("button", { name: /Döner-Konfigurator/ }));
    const dialog = within(await screen.findByRole("dialog"));
    await user.click(dialog.getByRole("button", { name: "Kalb" }));
    await user.click(dialog.getByRole("button", { name: oneOf(konfiguratorCopy.everything) }));

    expect(dialog.getByText(oneOf(konfiguratorCopy.sauceQuestions))).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: oneOf(konfiguratorCopy.sauceSkip) }));
    expect(dialog.getByText(oneOf(konfiguratorCopy.quipDry))).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: oneOf(konfiguratorCopy.apply) }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Extrawünsche" })).toHaveValue("mit allem");
    });
  });

  it("bietet den Konfigurator nicht für Boxen ohne Brot an", async () => {
    useHandlers();
    const user = userEvent.setup();
    const screen = renderApp({ initialPath: "/order" });

    await user.click(await screen.findByRole("button", { name: /Danny-Box/ }));
    expect(await screen.findByRole("button", { name: "Kalb" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Döner-Konfigurator/ })).not.toBeInTheDocument();
  });
});

import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

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

const DAY_ID = "22222222-2222-2222-2222-222222222222";

// A realistic generic menu: a Döner category (meat single / sauce multi / extra text)
// and a Pizza category (variant single / extra text), plus three products, one of
// which (Danny-Box) carries preset defaultAnswers. The "Extra Fleisch" sauce option
// carries a +1,50 € price delta to exercise the live-price recompute.
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
            { key: "Kalb", label: "Kalb", icon: null, priceDeltaCents: 0 },
            { key: "Haehnchen", label: "Hähnchen", icon: null, priceDeltaCents: 0 },
            { key: "Gemischt", label: "Gemischt", icon: null, priceDeltaCents: 0 },
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
            { key: "Kraeuter", label: "Kräuter", icon: "🌿", priceDeltaCents: 0 },
            { key: "Knoblauch", label: "Knoblauch", icon: "🧄", priceDeltaCents: 0 },
            { key: "Scharf", label: "Scharf", icon: "🌶", priceDeltaCents: 0 },
            { key: "ExtraFleisch", label: "Extra Fleisch", icon: null, priceDeltaCents: 150 },
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
    {
      key: "pizza",
      name: "Pizza",
      sortOrder: 2,
      fields: [
        {
          key: "variant",
          label: "Sorte",
          type: "single",
          display: "chips",
          maxLength: null,
          required: true,
          options: [
            { key: "salami", label: "Salami", icon: null, priceDeltaCents: 0 },
            { key: "margherita", label: "Margherita", icon: null, priceDeltaCents: 0 },
            { key: "funghi", label: "Funghi", icon: null, priceDeltaCents: 0 },
            { key: "tonno", label: "Tonno", icon: null, priceDeltaCents: 0 },
            { key: "hawaii", label: "Hawaii", icon: null, priceDeltaCents: 0 },
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
      defaultAnswers: {
        meat: { options: ["Kalb"] },
        sauce: { options: ["Knoblauch"] },
      },
    },
    {
      id: "pizza",
      name: "Pizza",
      categoryKey: "pizza",
      baseItemKey: null,
      priceCents: 900,
      priceLabel: "9,00 €",
      materialIcon: "local_pizza",
      note: null,
      isInsider: false,
      sortOrder: 6,
      defaultAnswers: null,
    },
  ],
};

interface OrderHandlerOptions {
  /** Captures the PUT request body when the order is submitted. */
  onSubmit?: (body: unknown) => void;
}

const useOrderHandlers = ({ onSubmit }: OrderHandlerOptions = {}): void => {
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
      onSubmit?.(body);
      return HttpResponse.json({
        id: "99999999-9999-9999-9999-999999999999",
        orderDayId: DAY_ID,
        lines: [
          {
            productId: "doener",
            productLabel: "Döner Kalb",
            answers: { meat: { options: ["Kalb"] }, sauce: { options: ["Knoblauch", "Scharf"] } },
            priceCents: 750,
            priceLabel: "7,50 €",
            quantity: 1,
            lineTotalCents: 750,
            lineTotalLabel: "7,50 €",
            detail: "Knoblauch, Scharf",
          },
        ],
        priceCents: 750,
        priceLabel: "7,50 €",
        isPickup: false,
      });
    }),
  );
};

const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

// An existing order for the day, in the OrderDetails wire shape — drives the "remove my order" flow.
const existingOrder = {
  hasOrder: true,
  order: {
    id: "99999999-9999-9999-9999-999999999999",
    orderDayId: DAY_ID,
    lines: [
      {
        productId: "doener",
        productLabel: "Döner Kalb",
        answers: { meat: { options: ["Kalb"] }, sauce: { options: ["Knoblauch"] } },
        priceCents: 750,
        priceLabel: "7,50 €",
        quantity: 1,
        lineTotalCents: 750,
        lineTotalLabel: "7,50 €",
        detail: "Knoblauch",
      },
    ],
    priceCents: 750,
    priceLabel: "7,50 €",
    isPickup: false,
  },
};

// Like useOrderHandlers but with an existing order on the day and a DELETE handler that records the
// withdrawal, so the remove-my-order flow can be exercised end to end.
const useExistingOrderHandlers = (onDelete: () => void): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/menu", () => HttpResponse.json(menuResponse)),
    http.get("*/api/order-days/today", () =>
      HttpResponse.json({ isOpen: true, day: { id: DAY_ID, iCanStillOrder: true } }),
    ),
    http.get("*/api/order-days/:dayId/orders/mine", () => HttpResponse.json(existingOrder)),
    http.delete("*/api/order-days/:dayId/orders/mine", () => {
      onDelete();
      return new HttpResponse(null, { status: 204 });
    }),
  );
};

describe("OrderPage", () => {
  it("zeigt die Produkte und deaktiviert den Submit, bis ein Produkt gewählt ist", async () => {
    useOrderHandlers();
    const { findByRole } = renderApp({ initialPath: "/order" });

    // Submit is disabled until a product is chosen.
    const submit = await findByRole("button", { name: /Bestellung abgeben/ });
    expect(submit).toBeDisabled();

    // Category fields are hidden before any product is picked.
    expect(await findByRole("button", { name: /^Döner/ })).toBeInTheDocument();
  });

  it("rendert bei Döner die Kategorie-Felder Fleisch + Soße und blendet die Pizza-Sorte aus", async () => {
    useOrderHandlers();
    const user = userEvent.setup();
    const { findByRole, queryByRole } = renderApp({ initialPath: "/order" });

    await user.click(await findByRole("button", { name: /^Döner/ }));

    // Meat segmented + sauce multi-select appear from the menu; the pizza variant chips do not.
    expect(await findByRole("button", { name: "Kalb" })).toBeInTheDocument();
    expect(await findByRole("button", { name: "Hähnchen" })).toBeInTheDocument();
    expect(await findByRole("button", { name: /Knoblauch/ })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Margherita" })).not.toBeInTheDocument();

    // A product is now selected → submit is enabled.
    expect(await findByRole("button", { name: /Bestellung abgeben/ })).not.toBeDisabled();
  });

  it("rendert bei Pizza die Sorten-Chips und blendet die Döner-Felder aus", async () => {
    useOrderHandlers();
    const user = userEvent.setup();
    const { findByRole, queryByRole } = renderApp({ initialPath: "/order" });

    await user.click(await findByRole("button", { name: /^Pizza/ }));

    expect(await findByRole("button", { name: "Margherita" })).toBeInTheDocument();
    expect(await findByRole("button", { name: "Salami" })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Kalb" })).not.toBeInTheDocument();
    expect(queryByRole("button", { name: "Hähnchen" })).not.toBeInTheDocument();
  });

  it("füllt beim Produktwählen den Zeilenpreis automatisch und aktualisiert den Gesamtbetrag", async () => {
    useOrderHandlers();
    const user = userEvent.setup();
    const { findByRole, findByLabelText, findAllByText } = renderApp({ initialPath: "/order" });

    // Picking the Pizza (9,00 €) seeds that line's price field from the item base.
    await user.click(await findByRole("button", { name: /^Pizza/ }));
    const price = await findByLabelText("Preis");
    expect(price).toHaveValue("9,00");
    // Line total + order total both reflect the auto-filled price.
    expect((await findAllByText("9,00 €")).length).toBeGreaterThanOrEqual(2);
  });

  it("seedet die Standard-Antworten und den Preis eines Presets (Danny-Box)", async () => {
    useOrderHandlers();
    const user = userEvent.setup();
    const { findByRole, findByLabelText } = renderApp({ initialPath: "/order" });

    await user.click(await findByRole("button", { name: /Danny-Box/ }));

    // defaultAnswers pre-selects Kalb + Knoblauch.
    expect(await findByRole("button", { name: "Kalb" })).toHaveAttribute("aria-pressed", "true");
    expect(await findByRole("button", { name: /Knoblauch/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Base price 6,00 € seeded.
    expect(await findByLabelText("Preis")).toHaveValue("6,00");
  });

  it("rechnet den Preis live hoch, wenn eine Option mit Aufpreis gewählt wird", async () => {
    useOrderHandlers();
    const user = userEvent.setup();
    const { findByRole, findByLabelText } = renderApp({ initialPath: "/order" });

    await user.click(await findByRole("button", { name: /^Döner/ }));
    expect(await findByLabelText("Preis")).toHaveValue("7,50");

    // "Extra Fleisch" carries a +1,50 € delta → 7,50 € becomes 9,00 €.
    await user.click(await findByRole("button", { name: /Extra Fleisch/ }));
    await waitFor(async () => {
      expect(await findByLabelText("Preis")).toHaveValue("9,00");
    });
  });

  it("erhöht mit dem Mengen-Stepper Zeilen- und Gesamtbetrag", async () => {
    useOrderHandlers();
    const user = userEvent.setup();
    const { findByRole, findByLabelText, findAllByText } = renderApp({ initialPath: "/order" });

    await user.click(await findByRole("button", { name: /^Pizza/ }));
    expect(await findByLabelText("Menge")).toHaveTextContent("1");

    await user.click(await findByRole("button", { name: "Menge erhöhen" }));
    expect(await findByLabelText("Menge")).toHaveTextContent("2");
    // 2 × 9,00 € → 18,00 € shown for the line total and the order total.
    expect((await findAllByText("18,00 €")).length).toBeGreaterThanOrEqual(2);
  });

  it("fügt eine weitere Position hinzu und entfernt sie wieder", async () => {
    useOrderHandlers();
    const user = userEvent.setup();
    const { findByRole, findByText, findAllByText, queryByText, queryAllByText } = renderApp({
      initialPath: "/order",
    });

    expect(await findByText("Position 1")).toBeInTheDocument();
    expect(queryByText("Position 2")).not.toBeInTheDocument();

    await user.click(await findByRole("button", { name: /weitere Position/ }));
    expect(await findByText("Position 2")).toBeInTheDocument();

    // Each of the two lines now carries its own remove control; remove the second.
    const removeButtons = await findAllByText("Position entfernen");
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[1]);
    await waitFor(() => {
      expect(queryByText("Position 2")).not.toBeInTheDocument();
    });
    // Back to a single line → the lone line's remove control disappears.
    expect(queryAllByText("Position entfernen")).toHaveLength(0);
  });

  it("blockiert den Submit und zeigt den Sorten-Fehler, wenn bei Pizza keine Sorte gewählt ist", async () => {
    seedXsrfCookie();
    let captured: unknown = null;
    useOrderHandlers({
      onSubmit: (body) => {
        captured = body;
      },
    });
    const user = userEvent.setup();
    const { findByRole, findByText, router } = renderApp({ initialPath: "/order" });

    // Pizza picked but no variant chosen → the dynamic required-single rule blocks submit.
    await user.click(await findByRole("button", { name: /^Pizza/ }));
    await user.click(await findByRole("button", { name: /Bestellung abgeben/ }));

    // The now-visible variant error is surfaced below the chip row.
    expect(await findByText("Sorte wählen, Chef.")).toBeInTheDocument();

    // The dynamic pizza validation prevents the PUT and any navigation.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/order");
    });
    expect(captured).toBeNull();
  });

  it("zeigt den Fleisch-Fehler, wenn beim Döner kein Fleisch gewählt ist", async () => {
    seedXsrfCookie();
    let captured: unknown = null;
    useOrderHandlers({
      onSubmit: (body) => {
        captured = body;
      },
    });
    const user = userEvent.setup();
    const { findByRole, findByText, router } = renderApp({ initialPath: "/order" });

    // Döner picked but no meat chosen → the dynamic required-single rule blocks submit.
    await user.click(await findByRole("button", { name: /^Döner/ }));
    await user.click(await findByRole("button", { name: /Bestellung abgeben/ }));

    // The meat error is surfaced below the segmented control.
    expect(await findByText("Fleisch wählen, Chef.")).toBeInTheDocument();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/order");
    });
    expect(captured).toBeNull();
  });

  it("sendet lines[] mit answers + Menge im PUT-Payload und navigiert zur Erfolgsseite", async () => {
    seedXsrfCookie();
    let captured: unknown = null;
    useOrderHandlers({
      onSubmit: (body) => {
        captured = body;
      },
    });
    const user = userEvent.setup();
    const { findByRole, router } = renderApp({ initialPath: "/order" });

    await user.click(await findByRole("button", { name: /^Döner/ }));
    await user.click(await findByRole("button", { name: "Kalb" }));
    await user.click(await findByRole("button", { name: /Knoblauch/ }));
    await user.click(await findByRole("button", { name: /Scharf/ }));
    await user.click(await findByRole("button", { name: "Menge erhöhen" }));
    await user.click(await findByRole("button", { name: /Bestellung abgeben/ }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/erledigt");
    });
    expect(router.state.location.search).toMatchObject({
      orderId: "99999999-9999-9999-9999-999999999999",
    });

    const body = captured as {
      isPickup: boolean;
      lines: {
        productId: string;
        answers: Record<string, { options?: string[]; text?: string }>;
        priceCents: number;
        quantity: number;
      }[];
    };
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].productId).toBe("doener");
    expect(body.lines[0].answers.meat.options).toEqual(["Kalb"]);
    expect(body.lines[0].answers.sauce.options).toEqual(["Knoblauch", "Scharf"]);
    expect(body.lines[0].priceCents).toBe(750);
    expect(body.lines[0].quantity).toBe(2);
  });

  it("blendet 'Meine Bestellung entfernen' aus, wenn noch keine Bestellung existiert", async () => {
    useOrderHandlers();
    const { findByRole, queryByRole } = renderApp({ initialPath: "/order" });

    // Wait for the form to mount, then assert the withdraw action is absent without an order.
    await findByRole("button", { name: /Bestellung abgeben/ });
    expect(queryByRole("button", { name: "Meine Bestellung entfernen" })).not.toBeInTheDocument();
  });

  it("entfernt die bestehende Bestellung nach Bestätigung und navigiert zur Übersicht", async () => {
    seedXsrfCookie();
    let deleteCalled = false;
    useExistingOrderHandlers(() => {
      deleteCalled = true;
    });
    const user = userEvent.setup();
    const { findByRole, router } = renderApp({ initialPath: "/order" });

    await user.click(await findByRole("button", { name: "Meine Bestellung entfernen" }));
    // Confirm in the dialog.
    await user.click(await findByRole("button", { name: "Ja, entfernen" }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
  });
});

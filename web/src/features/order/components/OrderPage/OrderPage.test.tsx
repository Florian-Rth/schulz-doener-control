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

const menuResponse = {
  items: [
    {
      id: "doener",
      name: "Döner",
      defaultPriceCents: 750,
      defaultPriceLabel: "7,50 €",
      kind: "doener",
      materialIcon: "kebab_dining",
      note: null,
      isInsider: false,
      sortOrder: 1,
    },
    {
      id: "danny",
      name: "Danny-Box",
      defaultPriceCents: 600,
      defaultPriceLabel: "6,00 €",
      kind: "doener",
      materialIcon: "workspace_premium",
      note: "Pommes · Fleisch · Soße",
      isInsider: true,
      sortOrder: 5,
    },
    {
      id: "pizza",
      name: "Pizza",
      defaultPriceCents: 900,
      defaultPriceLabel: "9,00 €",
      kind: "pizza",
      materialIcon: "local_pizza",
      note: null,
      isInsider: false,
      sortOrder: 6,
    },
  ],
  pizzaVariants: ["Salami", "Margherita", "Funghi", "Tonno", "Hawaii"],
  sauceOptions: ["Kraeuter", "Knoblauch", "Scharf"],
  meatOptions: ["Kalb", "Haehnchen"],
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
            kind: "doener",
            meat: "Kalb",
            pizzaVariant: null,
            sauces: ["Knoblauch", "Scharf"],
            priceCents: 750,
            priceLabel: "7,50 €",
            extra: null,
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

describe("OrderPage", () => {
  it("zeigt die Produkte und deaktiviert den Submit, bis ein Produkt gewählt ist", async () => {
    useOrderHandlers();
    const { findByRole } = renderApp({ initialPath: "/order" });

    // Submit is disabled until a product is chosen (mock parity).
    const submit = await findByRole("button", { name: /Bestellung abgeben/ });
    expect(submit).toBeDisabled();

    // Conditional fields are hidden before any product is picked.
    expect(await findByRole("button", { name: /^Döner/ })).toBeInTheDocument();
  });

  it("zeigt bei Döner Fleisch + Soße und blendet die Pizza-Sorte aus", async () => {
    useOrderHandlers();
    const user = userEvent.setup();
    const { findByRole, queryByRole } = renderApp({ initialPath: "/order" });

    await user.click(await findByRole("button", { name: /^Döner/ }));

    // Meat segmented + sauce multi-select appear; the pizza variant chips do not.
    expect(await findByRole("button", { name: "Kalb" })).toBeInTheDocument();
    expect(await findByRole("button", { name: "Hähnchen" })).toBeInTheDocument();
    expect(await findByRole("button", { name: /Knoblauch/ })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Margherita" })).not.toBeInTheDocument();

    // A product is now selected → submit is enabled.
    expect(await findByRole("button", { name: /Bestellung abgeben/ })).not.toBeDisabled();
  });

  it("zeigt bei Pizza die Sorten-Chips und blendet Fleisch + Soße aus", async () => {
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

    // Picking the Pizza (9,00 €) seeds that line's price field from the default.
    await user.click(await findByRole("button", { name: /^Pizza/ }));
    const price = await findByLabelText("Preis");
    expect(price).toHaveValue("9,00");
    // Line total + order total both reflect the auto-filled price.
    expect((await findAllByText("9,00 €")).length).toBeGreaterThanOrEqual(2);
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

    // Pizza picked but no variant chosen → per-line superRefine blocks submit.
    await user.click(await findByRole("button", { name: /^Pizza/ }));
    await user.click(await findByRole("button", { name: /Bestellung abgeben/ }));

    // The now-visible variant error is surfaced below the chip row.
    expect(await findByText("Welche Pizza, Chef?")).toBeInTheDocument();

    // The per-line pizza validation prevents the PUT and any navigation.
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

    // Döner picked but no meat chosen → per-line superRefine blocks submit.
    await user.click(await findByRole("button", { name: /^Döner/ }));
    await user.click(await findByRole("button", { name: /Bestellung abgeben/ }));

    // The meat error is surfaced below the segmented control.
    expect(await findByText("Fleisch wählen, Chef.")).toBeInTheDocument();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/order");
    });
    expect(captured).toBeNull();
  });

  it("sendet lines[] mit Menge im PUT-Payload und navigiert zur Erfolgsseite", async () => {
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
      lines: { sauces: string[]; meat: string; priceCents: number; quantity: number }[];
    };
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].sauces).toEqual(["Knoblauch", "Scharf"]);
    expect(body.lines[0].meat).toBe("Kalb");
    expect(body.lines[0].priceCents).toBe(750);
    expect(body.lines[0].quantity).toBe(2);
  });
});

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
        productId: "doener",
        productLabel: "Döner Kalb",
        kind: "doener",
        meat: "Kalb",
        pizzaVariant: null,
        sauces: ["Knoblauch", "Scharf"],
        priceCents: 750,
        priceLabel: "7,50 €",
        extra: null,
        isPickup: false,
        detail: "Knoblauch, Scharf",
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

  it("sendet die Soßen-Mehrfachauswahl im PUT-Payload und navigiert zur Erfolgsseite", async () => {
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
    await user.click(await findByRole("button", { name: /Bestellung abgeben/ }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/erledigt");
    });
    expect(router.state.location.search).toMatchObject({
      orderId: "99999999-9999-9999-9999-999999999999",
    });

    const body = captured as { sauces: string[]; meat: string; priceCents: number };
    expect(body.sauces).toEqual(["Knoblauch", "Scharf"]);
    expect(body.meat).toBe("Kalb");
    expect(body.priceCents).toBe(750);
  });
});

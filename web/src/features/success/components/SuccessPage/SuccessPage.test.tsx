import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { OrderResult } from "@/features/success";
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

const ORDER_ID = "99999999-9999-9999-9999-999999999999";

const owesResult: OrderResult = {
  lines: [
    {
      productLabel: "Dürüm Kalb",
      detail: "Scharf, ohne Zwiebeln",
      quantity: 1,
      priceCents: 800,
      lineTotalCents: 800,
    },
    {
      productLabel: "Pizza Margherita",
      detail: "",
      quantity: 2,
      priceCents: 900,
      lineTotalCents: 1800,
    },
  ],
  priceCents: 2600,
  isPickup: false,
  abholer: {
    name: "Lukas Brandt",
    initials: "LB",
    colorHex: "#00728E",
    payPalHandle: "LukasBrandtHB",
  },
  collectCents: 0,
  collectCount: 0,
  myPayPalUrl: "https://paypal.me/LukasBrandtHB/26.00EUR",
};

const pickupResult: OrderResult = {
  lines: [
    {
      productLabel: "Döner Hähnchen",
      detail: "Mit allem",
      quantity: 1,
      priceCents: 750,
      lineTotalCents: 750,
    },
  ],
  priceCents: 750,
  isPickup: true,
  abholer: null,
  collectCents: 1550,
  collectCount: 2,
  myPayPalUrl: null,
};

const useSuccessHandlers = (result: OrderResult): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/orders/:id/result", () => HttpResponse.json(result)),
  );
};

describe("SuccessPage", () => {
  it("zeigt den PayPal-Button mit korrektem href, wenn der Chef nicht abholt", async () => {
    useSuccessHandlers(owesResult);
    const { findByRole, findByText } = renderApp({
      initialPath: `/erledigt?orderId=${ORDER_ID}`,
    });

    expect(await findByText("Erledigt, Chef")).toBeInTheDocument();
    // Both ordered lines render, the second prefixed with its quantity.
    expect(await findByText("Dürüm Kalb")).toBeInTheDocument();
    expect(await findByText("2× Pizza Margherita")).toBeInTheDocument();

    const payLink = await findByRole("link", { name: /per PayPal senden/ });
    expect(payLink).toHaveAttribute("href", "https://paypal.me/LukasBrandtHB/26.00EUR");
    expect(payLink).toHaveAttribute("target", "_blank");
    expect(await findByText("Lukas Brandt")).toBeInTheDocument();
  });

  it("zeigt die Abholer-Sammelkarte, wenn der Chef selbst abholt", async () => {
    useSuccessHandlers(pickupResult);
    const { findByText, queryByRole } = renderApp({
      initialPath: `/erledigt?orderId=${ORDER_ID}`,
    });

    expect(await findByText("Du holst heute ab, Chef!")).toBeInTheDocument();
    expect(await findByText(/Du sammelst 15,50 € von 2 Kollegen ein\./)).toBeInTheDocument();
    // No pay-to-abholer button in the pickup branch.
    expect(queryByRole("link", { name: /per PayPal senden/ })).not.toBeInTheDocument();
  });
});

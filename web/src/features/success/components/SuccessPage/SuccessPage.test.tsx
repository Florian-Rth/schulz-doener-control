import userEvent from "@testing-library/user-event";
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
};

// Not the pickup person and no abholer designated yet → info card, no payment.
const noAbholerResult: OrderResult = {
  ...owesResult,
  abholer: null,
};

const useSuccessHandlers = (result: OrderResult): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/orders/:id/result", () => HttpResponse.json(result)),
  );
};

describe("SuccessPage", () => {
  it("zeigt den Betrag und einen Hinweis statt eines PayPal-Buttons, wenn der Chef nicht abholt", async () => {
    useSuccessHandlers(owesResult);
    const { findAllByText, findByText, queryByRole } = renderApp({
      initialPath: `/erledigt?orderId=${ORDER_ID}`,
    });

    expect(await findByText("Erledigt, Chef")).toBeInTheDocument();
    // Both ordered lines render, the second prefixed with its quantity.
    expect(await findByText("Dürüm Kalb")).toBeInTheDocument();
    expect(await findByText("2× Pizza Margherita")).toBeInTheDocument();

    // The amount stays prominent (big amount + Gesamt line), the Abholer is named, and the info
    // note points to the home screen — but NO pay button/link appears here.
    expect((await findAllByText("26,00 €")).length).toBeGreaterThanOrEqual(2);
    expect(await findByText("Lukas Brandt")).toBeInTheDocument();
    expect(
      await findByText(/Bezahlen kannst du auf der Startseite, sobald der Abholer/),
    ).toBeInTheDocument();
    expect(queryByRole("link", { name: /per PayPal senden/ })).not.toBeInTheDocument();
    expect(queryByRole("button", { name: /per PayPal senden/ })).not.toBeInTheDocument();
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

  it("zeigt einen Hinweis, wenn noch kein Abholer festgelegt ist", async () => {
    useSuccessHandlers(noAbholerResult);
    const { findByText, queryByRole } = renderApp({
      initialPath: `/erledigt?orderId=${ORDER_ID}`,
    });

    expect(await findByText(/Noch kein Abholer festgelegt/)).toBeInTheDocument();
    expect(queryByRole("link", { name: /per PayPal senden/ })).not.toBeInTheDocument();
  });

  it("zeigt einen Fehler mit Retry, wenn die Bestellung nicht geladen werden kann", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/orders/:id/result", () => HttpResponse.json(null, { status: 500 })),
    );
    const { findByText, queryByText, findByRole } = renderApp({
      initialPath: `/erledigt?orderId=${ORDER_ID}`,
    });

    expect(await findByText("Bestellung konnte nicht geladen werden, Chef.")).toBeInTheDocument();
    // The celebratory success header is withheld on a load failure.
    expect(queryByText("Erledigt, Chef")).not.toBeInTheDocument();

    // Retry now succeeds → the result renders and the error clears.
    mswServer.use(http.get("*/api/orders/:id/result", () => HttpResponse.json(owesResult)));
    const user = userEvent.setup();
    await user.click(await findByRole("button", { name: "Nochmal versuchen" }));

    expect(await findByText("Erledigt, Chef")).toBeInTheDocument();
    expect(queryByText("Bestellung konnte nicht geladen werden, Chef.")).not.toBeInTheDocument();
  });
});

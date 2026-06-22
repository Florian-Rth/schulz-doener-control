import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homeCopy } from "../copy";
import type { DashboardDay, OrderRow } from "../types";
import { useDayStatus } from "./use-day-status";

// One crafted order row. `isMine` is the only field useDayStatus reads; the rest
// just satisfy the type so the test mirrors the DashboardPage fixtures.
const buildOrder = (overrides: Partial<OrderRow> = {}): OrderRow => ({
  orderId: "o1",
  personName: "Tobias Klein",
  avatarColorHex: "#45B8A1",
  productLabel: "Döner Hähnchen",
  description: "ohne Soße",
  priceCents: 750,
  priceLabel: "7,50",
  isMine: false,
  isPickup: false,
  ...overrides,
});

// A running open day; override per case. Defaults: ordering open, a foreign
// Abholer set, caller is not the collector and has not ordered.
const buildDay = (overrides: Partial<DashboardDay> = {}): DashboardDay => ({
  isOpen: true,
  id: "day-1",
  synonym: "Drehspieß-Tasche",
  pushText: null,
  cutoffLabel: null,
  participantCount: 1,
  pickupNames: ["Lukas Brandt"],
  iCanStillOrder: true,
  isOrderingClosed: false,
  amICollector: false,
  abholer: {
    name: "Lukas Brandt",
    initials: "LB",
    colorHex: "#00728E",
    payPalUrl: "https://paypal.me/LukasBrandtHB/7.60EUR",
  },
  orders: [buildOrder()],
  ...overrides,
});

describe("useDayStatus", () => {
  describe("statusLine", () => {
    it("zeigt 'Bestellung geschlossen', sobald nicht mehr bestellt werden kann — auch wenn man bestellt hat", () => {
      const { result } = renderHook(() =>
        useDayStatus(buildDay({ iCanStillOrder: false, orders: [buildOrder({ isMine: true })] })),
      );

      expect(result.current.statusLine).toBe(homeCopy.statusOrderingClosed);
    });

    it("zeigt bei offener Bestellung 'du bist dabei', wenn man bestellt hat", () => {
      const { result } = renderHook(() =>
        useDayStatus(buildDay({ iCanStillOrder: true, orders: [buildOrder({ isMine: true })] })),
      );

      expect(result.current.statusLine).toBe(homeCopy.statusOrderingInfo);
    });

    it("zeigt bei offener Bestellung 'du fehlst noch', wenn man nicht bestellt hat", () => {
      const { result } = renderHook(() =>
        useDayStatus(buildDay({ iCanStillOrder: true, orders: [buildOrder({ isMine: false })] })),
      );

      expect(result.current.statusLine).toBe(homeCopy.statusOrderingMissing);
    });
  });

  describe("hasNoCollector", () => {
    it("ist true, wenn kein Abholer feststeht", () => {
      const { result } = renderHook(() => useDayStatus(buildDay({ abholer: null })));

      expect(result.current.hasNoCollector).toBe(true);
    });

    it("ist false, sobald ein Abholer feststeht", () => {
      const { result } = renderHook(() => useDayStatus(buildDay()));

      expect(result.current.hasNoCollector).toBe(false);
    });
  });

  describe("canTakeOver", () => {
    it("ist true, wenn ein fremder Abholer feststeht und man nicht selbst abholt", () => {
      const { result } = renderHook(() => useDayStatus(buildDay({ amICollector: false })));

      expect(result.current.canTakeOver).toBe(true);
    });

    it("ist false, wenn man selbst der Abholer ist", () => {
      const { result } = renderHook(() => useDayStatus(buildDay({ amICollector: true })));

      expect(result.current.canTakeOver).toBe(false);
    });

    it("ist false, wenn noch kein Abholer feststeht", () => {
      const { result } = renderHook(() =>
        useDayStatus(buildDay({ abholer: null, amICollector: false })),
      );

      expect(result.current.canTakeOver).toBe(false);
    });
  });

  describe("iHaveOrdered", () => {
    it("ist true, wenn eine eigene Bestellung vorliegt", () => {
      const { result } = renderHook(() =>
        useDayStatus(
          buildDay({ orders: [buildOrder({ isMine: false }), buildOrder({ isMine: true })] }),
        ),
      );

      expect(result.current.iHaveOrdered).toBe(true);
    });

    it("ist false, wenn keine eigene Bestellung vorliegt", () => {
      const { result } = renderHook(() =>
        useDayStatus(buildDay({ orders: [buildOrder({ isMine: false })] })),
      );

      expect(result.current.iHaveOrdered).toBe(false);
    });
  });

  describe("isEmpty", () => {
    it("ist true, wenn der Tag keine Bestellungen hat", () => {
      const { result } = renderHook(() => useDayStatus(buildDay({ orders: [] })));

      expect(result.current.isEmpty).toBe(true);
    });

    it("ist false, sobald es mindestens eine Bestellung gibt", () => {
      const { result } = renderHook(() => useDayStatus(buildDay({ orders: [buildOrder()] })));

      expect(result.current.isEmpty).toBe(false);
    });
  });
});

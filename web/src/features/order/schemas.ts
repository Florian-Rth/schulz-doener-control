import { z } from "zod";

// --- API boundary schemas (validated with .parse on every response) ---

// One row from GET /api/menu — the 6 seeded products for the order grid.
export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultPriceCents: z.number().int(),
  defaultPriceLabel: z.string(),
  kind: z.enum(["doener", "pizza"]),
  materialIcon: z.string(),
  note: z.string().nullable(),
  isInsider: z.boolean(),
  sortOrder: z.number().int(),
});

// GET /api/menu — the products plus the static order vocabularies so the SPA
// never hardcodes enum strings.
export const MenuSchema = z.object({
  items: z.array(MenuItemSchema),
  pizzaVariants: z.array(z.enum(["Salami", "Margherita", "Funghi", "Tonno", "Hawaii"])),
  sauceOptions: z.array(z.enum(["Kraeuter", "Knoblauch", "Scharf"])),
  meatOptions: z.array(z.enum(["Kalb", "Haehnchen"])),
});

// The shared order DTO returned by the order/pickup endpoints.
export const OrderDetailsSchema = z.object({
  id: z.string(),
  orderDayId: z.string(),
  productId: z.string(),
  productLabel: z.string(),
  kind: z.enum(["doener", "pizza"]),
  meat: z.enum(["Kalb", "Haehnchen"]).nullable(),
  pizzaVariant: z.enum(["Salami", "Margherita", "Funghi", "Tonno", "Hawaii"]).nullable(),
  sauces: z.array(z.enum(["Kraeuter", "Knoblauch", "Scharf"])),
  priceCents: z.number().int(),
  priceLabel: z.string(),
  extra: z.string().nullable(),
  isPickup: z.boolean(),
  detail: z.string(),
});

// GET /api/order-days/{dayId}/orders/mine — prefills the form when editing.
export const MyOrderSchema = z.object({
  hasOrder: z.boolean(),
  order: OrderDetailsSchema.nullable(),
});

// GET /api/order-days/today — the backend returns { isOpen, day: OrderDayDetailsDto | null }
// (PLAN #8 — the day is nested, null when no day is open). The order screen only needs the
// open-day id and whether the caller can still order, so we model just those off the nested
// `day`; the dashboard owns the rich shape. Extra OrderDayDetailsDto fields on the wire are
// ignored by this object schema.
export const TodayOrderDayDetailsSchema = z.object({
  id: z.string(),
  iCanStillOrder: z.boolean(),
});

export const TodayOrderDaySchema = z.object({
  isOpen: z.boolean(),
  day: TodayOrderDayDetailsSchema.nullable(),
});

// --- Form schema (RHF + zodResolver) ---

const SAUCE_VALUES = ["Kraeuter", "Knoblauch", "Scharf"] as const;
const PIZZA_VALUES = ["Salami", "Margherita", "Funghi", "Tonno", "Hawaii"] as const;

export const OrderFormSchema = z
  .object({
    productId: z.string().min(1, "Wähl erst ein Produkt, Chef."),
    kind: z.enum(["doener", "pizza"]),
    meat: z.enum(["Kalb", "Haehnchen"]).nullable(),
    pizzaVariant: z.enum(PIZZA_VALUES).nullable(),
    sauces: z.array(z.enum(SAUCE_VALUES)),
    extra: z.string().max(300).optional(),
    priceCents: z.number().int().positive(),
    isPickup: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "doener") {
      if (value.meat === null) {
        ctx.addIssue({ code: "custom", message: "Fleisch wählen, Chef.", path: ["meat"] });
      }
      if (value.pizzaVariant !== null) {
        ctx.addIssue({
          code: "custom",
          message: "Keine Pizza-Sorte beim Döner.",
          path: ["pizzaVariant"],
        });
      }
    }
    if (value.kind === "pizza") {
      if (value.pizzaVariant === null) {
        ctx.addIssue({ code: "custom", message: "Welche Pizza, Chef?", path: ["pizzaVariant"] });
      }
      if (value.meat !== null) {
        ctx.addIssue({ code: "custom", message: "Keine Fleischwahl bei Pizza.", path: ["meat"] });
      }
      if (value.sauces.length > 0) {
        ctx.addIssue({ code: "custom", message: "Keine Soßen bei Pizza.", path: ["sauces"] });
      }
    }
  });

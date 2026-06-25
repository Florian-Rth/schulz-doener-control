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

// One pizza variant in the menu vocabulary. `value` is the stable variant id the order line
// carries on the wire; `label` is the German display name. The set is admin-editable, so this is an
// open list of {value,label} pairs (no closed enum).
export const PizzaVariantOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

// GET /api/menu — the products plus the order vocabularies so the SPA never hardcodes choice
// strings. `pizzaVariants` is the dynamic, admin-managed catalog ({value,label}); sauces and meats
// stay closed enums.
export const MenuSchema = z.object({
  items: z.array(MenuItemSchema),
  pizzaVariants: z.array(PizzaVariantOptionSchema),
  sauceOptions: z.array(z.enum(["Kraeuter", "Knoblauch", "Scharf"])),
  meatOptions: z.array(z.enum(["Kalb", "Haehnchen", "Gemischt"])),
});

// One line of an order in the shared order DTO. priceCents/priceLabel are PER
// UNIT; lineTotalCents/lineTotalLabel are priceCents * quantity.
export const OrderLineSchema = z.object({
  productId: z.string(),
  productLabel: z.string(),
  kind: z.enum(["doener", "pizza"]),
  meat: z.enum(["Kalb", "Haehnchen", "Gemischt"]).nullable(),
  // The chosen pizza variant `value` (a stable id from the admin-managed catalog), null for döner.
  pizzaVariant: z.string().nullable(),
  sauces: z.array(z.enum(["Kraeuter", "Knoblauch", "Scharf"])),
  priceCents: z.number().int(),
  priceLabel: z.string(),
  extra: z.string().nullable(),
  quantity: z.number().int(),
  lineTotalCents: z.number().int(),
  lineTotalLabel: z.string(),
  detail: z.string(),
});

// The shared order DTO returned by the order/pickup endpoints. priceCents /
// priceLabel are the ORDER TOTAL across all lines.
export const OrderDetailsSchema = z.object({
  id: z.string(),
  orderDayId: z.string(),
  lines: z.array(OrderLineSchema),
  priceCents: z.number().int(),
  priceLabel: z.string(),
  isPickup: z.boolean(),
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

// One editable line in the order form. The per-line pizza/döner consistency is
// enforced in a superRefine so the issue paths point at the exact line field.
export const OrderLineFormSchema = z
  .object({
    productId: z.string().min(1, "Wähl erst ein Produkt, Chef."),
    kind: z.enum(["doener", "pizza"]),
    meat: z.enum(["Kalb", "Haehnchen", "Gemischt"]).nullable(),
    // The chosen pizza variant `value` from the dynamic catalog; the superRefine below requires it
    // for a pizza line and forbids it for a döner line, so a plain nullable string suffices here.
    pizzaVariant: z.string().nullable(),
    sauces: z.array(z.enum(SAUCE_VALUES)),
    extra: z.string().max(300).optional(),
    priceCents: z.number().int().positive(),
    quantity: z.number().int().min(1, "Mindestens 1, Chef.").max(20, "Höchstens 20, Chef."),
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

export const OrderFormSchema = z.object({
  lines: z.array(OrderLineFormSchema).min(1).max(20),
  isPickup: z.boolean(),
});

import { z } from "zod";
import type { Menu } from "./types";

// --- API boundary schemas (validated with .parse on every response) ---

// One selectable option inside a field (e.g. a meat, a sauce, a pizza variant).
// `priceDeltaCents` is added to the item base price when the option is selected.
export const FieldOptionSchema = z.object({
  key: z.string(),
  label: z.string(),
  icon: z.string().nullable(),
  priceDeltaCents: z.number().int(),
});

// One configurable field on a category. `type` is the answer cardinality,
// `display` is the UI control to render it with.
export const FieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["single", "multi", "text"]),
  display: z.enum(["segmented", "chips", "dropdown", "textarea"]),
  maxLength: z.number().int().nullable(),
  required: z.boolean(),
  options: z.array(FieldOptionSchema),
});

// A food category (Döner, Pizza, …) with its ordered field definitions. The
// order form renders one control per field, in `fields` order.
export const CategorySchema = z.object({
  key: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
  fields: z.array(FieldSchema),
});

// A single answer value for one field: `options` for select fields (one entry
// for single-select, many for multi), `text` for free-text fields. Either half
// may be omitted depending on the field type.
export const AnswerValueSchema = z.object({
  options: z.array(z.string()).nullish(),
  text: z.string().nullish(),
});

// A full answer map for one line, keyed by field key.
export const AnswersSchema = z.record(z.string(), AnswerValueSchema);

// One product from GET /api/menu. `categoryKey` links it to a category whose
// fields drive the order form; `defaultAnswers` pre-seeds those fields (e.g. a
// preset box that comes with a fixed meat + sauce).
export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryKey: z.string().nullable(),
  baseItemKey: z.string().nullable(),
  priceCents: z.number().int(),
  priceLabel: z.string(),
  materialIcon: z.string(),
  note: z.string().nullable(),
  isInsider: z.boolean(),
  sortOrder: z.number().int(),
  defaultAnswers: AnswersSchema.nullable(),
});

// GET /api/menu — the generic Store→Category→Field→Option engine: the products
// plus the categories that describe how each product is configured. The SPA
// renders fields dynamically from this and never hardcodes any choice strings.
export const MenuSchema = z.object({
  categories: z.array(CategorySchema),
  items: z.array(MenuItemSchema),
});

// One line of an order in the shared order DTO. `answers` carries the chosen
// options / text per field. priceCents/priceLabel are PER UNIT;
// lineTotalCents/lineTotalLabel are priceCents * quantity.
export const OrderLineSchema = z.object({
  productId: z.string(),
  productLabel: z.string(),
  answers: AnswersSchema,
  priceCents: z.number().int(),
  priceLabel: z.string(),
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

// One value inside the form's answer map. Same shape as the wire answer value.
export const AnswerValueFormSchema = z.object({
  options: z.array(z.string()).nullish(),
  text: z.string().nullish(),
});

// One editable line in the order form. The static schema only enforces the
// product/price/quantity invariants; the per-field answer rules (required,
// cardinality, max length) are dynamic and live in buildOrderFormSchema, which
// looks each line's category up from the menu.
export const OrderLineFormSchema = z.object({
  productId: z.string().min(1, "Wähl erst ein Produkt, Chef."),
  answers: z.record(z.string(), AnswerValueFormSchema),
  priceCents: z.number().int().positive(),
  quantity: z.number().int().min(1, "Mindestens 1, Chef.").max(20, "Höchstens 20, Chef."),
});

export const OrderFormSchema = z.object({
  lines: z.array(OrderLineFormSchema).min(1).max(20),
  isPickup: z.boolean(),
});

// Builds the resolver schema for a given menu. Each line is validated against
// its product's category field defs: required fields must be answered,
// single-select must carry exactly one known option, multi-select a subset of
// known options, and text fields must stay within maxLength. Issues are raised
// on the exact `lines.<i>.answers.<fieldKey>` path so the matching control shows
// the caption.
type OrderFormResolverSchema = ReturnType<typeof OrderFormSchema.superRefine>;

export const buildOrderFormSchema = (menu: Menu): OrderFormResolverSchema =>
  OrderFormSchema.superRefine((value, ctx) => {
    value.lines.forEach((line, index) => {
      if (line.productId === "") {
        return;
      }
      const item = menu.items.find((entry) => entry.id === line.productId);
      if (item === undefined || item.categoryKey === null) {
        return;
      }
      const category = menu.categories.find((entry) => entry.key === item.categoryKey);
      if (category === undefined) {
        return;
      }
      for (const field of category.fields) {
        const answer = line.answers[field.key];
        const path = ["lines", index, "answers", field.key];
        if (field.type === "text") {
          const text = answer?.text ?? "";
          if (field.required && text.trim() === "") {
            ctx.addIssue({ code: "custom", message: `${field.label} fehlt, Chef.`, path });
          }
          if (field.maxLength !== null && text.length > field.maxLength) {
            ctx.addIssue({
              code: "custom",
              message: `Höchstens ${field.maxLength} Zeichen, Chef.`,
              path,
            });
          }
          continue;
        }
        const selected = answer?.options ?? [];
        const validKeys = new Set(field.options.map((option) => option.key));
        if (selected.some((option) => !validKeys.has(option))) {
          ctx.addIssue({ code: "custom", message: "Ungültige Auswahl, Chef.", path });
        }
        if (field.type === "single") {
          if (field.required && selected.length !== 1) {
            ctx.addIssue({ code: "custom", message: `${field.label} wählen, Chef.`, path });
          } else if (selected.length > 1) {
            ctx.addIssue({ code: "custom", message: "Nur eine Auswahl, Chef.", path });
          }
        } else if (field.required && selected.length === 0) {
          ctx.addIssue({ code: "custom", message: `${field.label} wählen, Chef.`, path });
        }
      }
    });
  });

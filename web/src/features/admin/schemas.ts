import { z } from "zod";

// --- API boundary schemas (validated with .parse on every response) ---

// One row of GET /api/admin/users. The backend emits PascalCase role values
// ("Admin" | "Employee") on the wire; we keep them as-is and normalise only
// when gating. `payPalHandle` is null when the colleague has not set one.
export const AdminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  role: z.enum(["Admin", "Employee"]),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
  payPalHandle: z.string().nullable(),
  createdAt: z.string(),
});

export const AdminUsersResponseSchema = z.object({
  users: z.array(AdminUserSchema),
});

// POST /api/admin/users → the temporary password is shown exactly once.
export const CreateUserResponseSchema = z.object({
  userId: z.string(),
  username: z.string(),
  temporaryPassword: z.string(),
});

// PUT /api/admin/users/{id} → the updated summary row.
export const UpdateUserResponseSchema = z.object({
  user: AdminUserSchema,
});

// POST /api/admin/users/{id}/reset-password → a fresh one-time password.
export const ResetPasswordResponseSchema = z.object({
  temporaryPassword: z.string(),
});

// --- Form schemas ---

// Shared validators mirroring the backend rules. The role select is a string in
// the form (radio/segmented control); it is mapped to the numeric request value
// (1 Employee / 2 Admin) at submit time.
const usernameField = z
  .string()
  .trim()
  .min(2, "Mindestens 2 Zeichen, Chef.")
  .max(64, "Höchstens 64 Zeichen.")
  .regex(/^[A-Za-z0-9._-]+$/, "Nur Buchstaben, Zahlen, Punkt, Bindestrich und Unterstrich.");

const displayNameField = z.string().trim().min(1, "Pflichtfeld").max(128, "Höchstens 128 Zeichen.");

// PayPal is optional; when present the admin pastes the colleague's full PayPal
// link (paypal.me / paypal.com) and the backend parses the handle out of it.
const PAYPAL_LINK_MESSAGE =
  "Bitte gib einen gültigen PayPal-Link ein (z. B. https://paypal.me/name).";
const PAYPAL_HOSTS = new Set(["paypal.me", "www.paypal.me", "paypal.com", "www.paypal.com"]);
const isPayPalLink = (value: string): boolean => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && PAYPAL_HOSTS.has(url.hostname.toLowerCase());
};
const payPalHandleField = z
  .string()
  .trim()
  .max(256, "Höchstens 256 Zeichen.")
  .refine((value) => value === "" || isPayPalLink(value), PAYPAL_LINK_MESSAGE);

const roleField = z.enum(["Admin", "Employee"]);

export const CreateUserFormSchema = z.object({
  username: usernameField,
  displayName: displayNameField,
  payPalHandle: payPalHandleField,
  role: roleField,
});

export const EditUserFormSchema = z.object({
  displayName: displayNameField,
  payPalHandle: payPalHandleField,
  role: roleField,
  isActive: z.boolean(),
});

// --- Menu administration (C3) ---

// A single default-answer value for one field: `options` for select fields (one
// entry for single-select, many for multi), `text` for free-text fields. Mirrors
// the order feature's AnswerValue shape.
export const AdminAnswerValueSchema = z.object({
  options: z.array(z.string()).nullish(),
  text: z.string().nullish(),
});

// A default-answer map keyed by field key, pre-seeding a menu item's category
// fields (e.g. a preset that comes with a fixed meat + sauce).
export const AdminAnswersSchema = z.record(z.string(), AdminAnswerValueSchema);

// One row of GET /api/admin/menu. Includes retired (soft-deleted) items, so the
// list can mark them. `note` is null when none is set. `categoryKey` links the
// item to a food category (null = unclassified); `baseItemId` marks it a preset
// of another item (null = standalone). `defaultAnswers` pre-seeds the category
// fields. `defaultPriceCents` is the integer source of truth; `defaultPriceLabel`
// is the server-formatted German display string.
export const AdminMenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultPriceCents: z.number().int(),
  defaultPriceLabel: z.string(),
  categoryKey: z.string().nullable(),
  baseItemId: z.string().nullable(),
  materialIcon: z.string(),
  note: z.string().nullable(),
  isInsider: z.boolean(),
  sortOrder: z.number().int(),
  isAvailable: z.boolean(),
  defaultAnswers: AdminAnswersSchema.nullable(),
});

export const AdminMenuResponseSchema = z.object({
  items: z.array(AdminMenuItemSchema),
});

// POST / PUT both return the single affected item under `item`.
export const MenuItemResponseSchema = z.object({
  item: AdminMenuItemSchema,
});

// --- Menu form schema ---

// The price is entered in euros in the UI (German comma allowed) and converted
// to integer cents at submit time, so the form carries the cents value directly
// once parsed. `id` is only present in the create form (optional; slugified from
// name server-side when omitted). `categoryKey` / `baseItemId` are select values
// ("" = none); `defaultAnswers` is the per-field seed map.
const menuNameField = z.string().trim().min(1, "Pflichtfeld").max(64, "Höchstens 64 Zeichen.");

const menuIdField = z
  .string()
  .trim()
  .max(32, "Höchstens 32 Zeichen.")
  .regex(/^[A-Za-z0-9._-]*$/, "Nur Buchstaben, Zahlen, Punkt, Bindestrich und Unterstrich.");

const menuNoteField = z.string().trim().max(128, "Höchstens 128 Zeichen.");

const menuIconField = z.string().trim().min(1, "Pflichtfeld").max(64, "Höchstens 64 Zeichen.");

const priceCentsField = z
  .number({ error: "Gib einen gültigen Preis ein, Chef." })
  .int()
  .min(0, "Der Preis darf nicht negativ sein.");

const sortOrderField = z
  .number({ error: "Gib eine gültige Reihenfolge ein, Chef." })
  .int()
  .min(0, "Darf nicht negativ sein.");

export const MenuItemFormSchema = z.object({
  id: menuIdField,
  name: menuNameField,
  priceCents: priceCentsField,
  categoryKey: z.string(),
  baseItemId: z.string(),
  materialIcon: menuIconField,
  note: menuNoteField,
  isInsider: z.boolean(),
  sortOrder: sortOrderField,
  isAvailable: z.boolean(),
  // Values are optional: the default-answers editor's Controllers register a key per
  // category field, initially undefined until the admin picks a seed. normalizeAnswers
  // strips the empty/undefined entries before they reach the wire.
  defaultAnswers: z.record(z.string(), AdminAnswerValueSchema.optional()),
});

// --- Notification templates (open-day push texts) ---

// One row of GET /api/admin/notification-templates. `synonym` is the absurd Döner name the text is
// themed around; `body` is the push/feed message; `isActive` gates whether it is eligible for the
// random pick when a Döner-Tag opens.
export const AdminNotificationTemplateSchema = z.object({
  id: z.string(),
  synonym: z.string(),
  body: z.string(),
  isActive: z.boolean(),
});

export const AdminNotificationTemplatesResponseSchema = z.object({
  items: z.array(AdminNotificationTemplateSchema),
});

// POST / PUT both return the single affected template under `item`.
export const NotificationTemplateResponseSchema = z.object({
  item: AdminNotificationTemplateSchema,
});

// --- Notification template form schema ---

const templateSynonymField = z
  .string()
  .trim()
  .min(1, "Pflichtfeld")
  .max(64, "Höchstens 64 Zeichen.");

const templateBodyField = z
  .string()
  .trim()
  .min(1, "Pflichtfeld")
  .max(280, "Höchstens 280 Zeichen.");

export const NotificationTemplateFormSchema = z.object({
  synonym: templateSynonymField,
  body: templateBodyField,
  isActive: z.boolean(),
});

// --- Registration mode (self-registration policy) ---

// GET /api/admin/registration-mode → the current policy and the configured secret key. `mode` is
// the wire value (1 Enabled / 2 Disabled / 3 SecretKeyOnly); `secretKey` is null when none is set.
export const AdminRegistrationModeResponseSchema = z.object({
  mode: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  secretKey: z.string().nullable(),
});

// PUT /api/admin/registration-mode body. `mode` is the chosen policy; `secretKey` is only sent
// (and only required) for SecretKeyOnly — the page enforces that before submit.
export const UpdateRegistrationModeSchema = z.object({
  mode: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  secretKey: z.string().optional(),
});

// --- Registration-mode form schema ---

// The form mirrors the screen: a 3-way mode selector and an optional secret-key text field that is
// only meaningful (and required) when SecretKeyOnly is chosen. The cross-field rule is enforced in
// the page hook before submit; the field-level rule only bounds the length so the input stays sane.
const secretKeyField = z.string().trim().max(128, "Höchstens 128 Zeichen.");

export const RegistrationModeFormSchema = z.object({
  mode: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  secretKey: secretKeyField,
});

// --- Food categories (generic Store→Category→Field→Option engine) ---

// One field the category exposes, in render order. `fieldKey` references a field
// from GET /api/admin/fields; `isRequired` gates whether the order form demands an
// answer.
export const CategoryFieldLinkSchema = z.object({
  fieldKey: z.string(),
  sortOrder: z.number().int(),
  isRequired: z.boolean(),
});

// One row of GET /api/admin/categories. `fields` is the ordered link set that
// decides which fields the category's order form renders.
export const AdminCategorySchema = z.object({
  key: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
  isAvailable: z.boolean(),
  fields: z.array(CategoryFieldLinkSchema),
});

export const AdminCategoriesResponseSchema = z.object({
  items: z.array(AdminCategorySchema),
});

// POST / PUT / set-fields all return the single affected category under `item`.
export const CategoryResponseSchema = z.object({
  item: AdminCategorySchema,
});

// --- Fields & options (the order vocabulary) ---

// One selectable option inside a field. `icon` is an optional emoji / Material
// symbol (null when none); `priceDeltaCents` is added to the base price when the
// option is chosen.
export const AdminFieldOptionSchema = z.object({
  key: z.string(),
  label: z.string(),
  icon: z.string().nullable(),
  priceDeltaCents: z.number().int(),
  sortOrder: z.number().int(),
  isAvailable: z.boolean(),
});

// One row of GET /api/admin/fields. `type` is the answer cardinality (immutable
// after create); `display` is the UI control; `maxLength` only applies to text
// fields (null otherwise).
export const AdminFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["single", "multi", "text"]),
  display: z.enum(["segmented", "chips", "dropdown", "textarea"]),
  maxLength: z.number().int().nullable(),
  options: z.array(AdminFieldOptionSchema),
});

export const AdminFieldsResponseSchema = z.object({
  items: z.array(AdminFieldSchema),
});

// POST / PUT field endpoints and all option endpoints return the whole affected
// field under `item`.
export const FieldResponseSchema = z.object({
  item: AdminFieldSchema,
});

// --- Category / field / option form schemas ---

const slugKeyField = z
  .string()
  .trim()
  .min(1, "Pflichtfeld")
  .max(32, "Höchstens 32 Zeichen.")
  .regex(/^[A-Za-z0-9._-]+$/, "Nur Buchstaben, Zahlen, Punkt, Bindestrich und Unterstrich.");

const labelField = z.string().trim().min(1, "Pflichtfeld").max(64, "Höchstens 64 Zeichen.");

const engineSortOrderField = z
  .number({ error: "Gib eine gültige Reihenfolge ein, Chef." })
  .int()
  .min(0, "Darf nicht negativ sein.");

export const CategoryFormSchema = z.object({
  key: slugKeyField,
  name: labelField,
  sortOrder: engineSortOrderField,
  isAvailable: z.boolean(),
});

// `maxLength` is only meaningful for text fields; the form writes null for the
// other types. Null is allowed on the wire; a positive integer bounds text input.
const maxLengthField = z
  .number({ error: "Gib eine gültige Zahl ein, Chef." })
  .int()
  .min(1, "Mindestens 1, Chef.")
  .nullable();

export const FieldFormSchema = z.object({
  key: slugKeyField,
  label: labelField,
  type: z.enum(["single", "multi", "text"]),
  display: z.enum(["segmented", "chips", "dropdown", "textarea"]),
  maxLength: maxLengthField,
});

// The price delta is entered in euros and converted to integer cents at submit
// time. The icon is optional; an empty string means "no symbol" and becomes null
// on the wire.
const optionIconField = z.string().trim().max(64, "Höchstens 64 Zeichen.");

const priceDeltaCentsField = z
  .number({ error: "Gib einen gültigen Aufpreis ein, Chef." })
  .int()
  .min(0, "Der Aufpreis darf nicht negativ sein.");

export const FieldOptionFormSchema = z.object({
  key: slugKeyField,
  label: labelField,
  icon: optionIconField,
  priceDeltaCents: priceDeltaCentsField,
  sortOrder: engineSortOrderField,
  isAvailable: z.boolean(),
});

// --- Döner-Tiere (C4, read-only) ---

// One row of GET /api/admin/tiere. The backend returns the 15 tiers in priority
// order; `tags` is the 3-tag descriptor list and `condition` is the German
// trigger rule. Nothing here is editable, so there is no matching form schema.
export const AdminTierSchema = z.object({
  emoji: z.string(),
  name: z.string(),
  tagline: z.string(),
  tags: z.array(z.string()),
  condition: z.string(),
});

export const AdminTiereResponseSchema = z.object({
  windowDays: z.number().int(),
  tiers: z.array(AdminTierSchema),
});

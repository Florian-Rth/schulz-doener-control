# RFC: Generic, multi-store menu & food-category system

Status: **Plan / not started** · Owner: Florian · Last updated: 2026-07-23

This replaces the hard-coded product/field model with a configurable
**Store → Category → Field → Option** engine, fixes the Danny-Box kitchen-print
easter egg, and lays the groundwork for multiple stores. Decisions below were
settled in a grilling session; the rationale is captured so we don't re-litigate.

> **Executing this plan (read first).** This doc is self-contained — an agent with no prior
> context can implement it. Before touching `server/` invoke the **`backend-work`** skill;
> before touching `web/` invoke **`frontend-work`** (mandatory conventions). Work the phases
> in §11 in order — each is independently shippable. §10 is the production-safety contract:
> the migration **must** be rehearsed on staging against a prod snapshot before prod.
> §14 lists the resolved decisions. Appendix A is the exact start seed. **Appendix B is the
> definitive checklist of every file to create / modify / delete.** Product & design context:
> `CONTEXT.md`. Backend tests: `dotnet test` with `DOTNET_USE_POLLING_FILE_WATCHER=1`
> (a handful of Admin/Config/Menu/Push tests are known-flaky).

---

## 1. Problem & goals

Today the app looks generic (menu items and pizza variants are already editable DB
reference data with admin CRUD) but three things are still hard-coded, and they are
exactly what blocks the goals:

1. `ProductKind` — a binary `{ Doener, Pizza }` enum that gates which fields the order
   form shows. This is the thing that wants to become a real **food category**.
2. `MeatType` (Kalb/Hähnchen/Gemischt) and `Sauce` (`[Flags]`) — closed enums. These are
   the "field vocabularies" we want configurable, with icons and per-option prices.
3. Field visibility + döner-vs-pizza validation, duplicated across order form,
   `superRefine`, service normalization, and endpoint validators.

Concrete drivers:

- **Danny-Box easter egg is broken for the kitchen.** Danny-Box (`id="danny"`) prints as
  literally "Danny-Box", which the Dönermann can't parse. It should be modeled as a
  **preset**: a Dönerbox with pre-filled, still-editable answers, that **prints as its
  real base spec** ("Dönerbox — nur Pommes, Fleisch, Soße"), never the joke name.
- **Pizza pricing is wrong.** Every pizza is the same price today; variants must carry
  their own price.
- **A second store is a concrete plan.** One app, multiple stores, store selector — the
  model must be multi-tenant from now on.
- Keep the ability to add playful presets/easter eggs.

Non-goals for this effort:

- Reworking the **Döner-Tier engine** (kept as-is; see §5). Tier rework to config-driven
  is a later phase.
- Building the **store-selector UI** (model + scoping now; switcher UI later).

---

## 2. Locked decisions (from grilling)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Ambition | Generic engine, shipped in vertical slices; Tier left untouched for now |
| 2 | Multi-store | Real. One app, `Store` entity, store selector. Existing data → store #1 |
| 3 | Danny-Box print | Kitchen sees the **real base spec only**; joke name never reaches shop |
| 4 | Answer storage | **Unified JSON `answers`**; migrate typed columns in, drop them |
| 5 | Pricing | **Uniform deltas**: line price = item base + Σ selected-option deltas |
| 6 | Pizza variants | **Absorbed** into generic options (retire `PizzaVariant` entity + screen) |
| 7 | Taxonomy | **Fine categories + reusable field library** (fields referenced, not duplicated) |
| 8 | Seed policy | **Upsert by stable key, preserve admin edits** (insert missing, don't clobber) |
| 9 | Store rollout | **Full model + scoping now; selector UI deferred** |
| 10 | Form rendering | **Generic renderer + `display` hint** per field (keeps segmented/chips UX) |

---

## 3. Tier compatibility contract (the bridge that keeps the animals alive)

The Tier coupling is isolated to **one projection**: `TierService.PatternTiersAsync`
fills `TierOrderInput(ProductId, Kind, Meat, Sauce)`. Dashboard / streak / leaderboard /
Packesel read **only** Order headers + `Quantity × PriceCents` — never the typed columns.

So the whole animal system survives untouched as long as the seed honors this contract,
and the projection is repointed (its **logic/thresholds unchanged**, only its data source):

- Menu-item ids stay **`doener / duerum / big / box / danny / pizza`** (Tier counts by `ProductId`).
- The meat field uses key **`meat`** with option keys **`kalb / haehnchen / gemischt`**.
- The sauce field uses key **`sauce`** with option keys **`kraeuter / knoblauch / scharf`**.
- Ordering a Danny-Box still writes an `OrderLine` with **`ProductId="danny"`** (so the
  🦨/📦 tiers keep counting). Only the *kitchen sheet* resolves it to the base product.

These keys are **immutable** once created (labels/icons/prices stay editable). The admin
UI and seeder enforce this. "Döner-kind" (for the `Trockenmaus`/`noSauce` tier) is derived
from **whether the line's category includes the `meat` field**, replacing the dropped
`ProductKind`.

Tier rework (make the rules reference field/option keys, per-store animals) is a **later,
separate RFC**.

---

## 4. Target data model

New/changed entities live in `Core/Entities` (records for value-ish types, `sealed`
classes for entities, nullable non-virtual navs, per backend conventions).

### 4.1 New entities

```
Store
  Id (Guid, PK) · Key (string, unique, stable) · Name · SortOrder · IsActive · CreatedAt

Category
  Id (Guid) · StoreId (FK→Store) · Key (stable, unique per store) · Name
  · SortOrder · IsAvailable
  nav: Store?, Fields (via CategoryField)

FieldDefinition            // the reusable field library (per store)
  Id (Guid) · StoreId (FK) · Key (stable, unique per store) · Label
  · Type (FieldType: SingleSelect | MultiSelect | Text)
  · Display (FieldDisplay: Segmented | Chips | Dropdown | Textarea)
  · MaxLength (int?, Text only)
  nav: Options

FieldOption
  Id (Guid) · FieldDefinitionId (FK) · Key (stable, unique per field) · Label
  · Icon (string?) · PriceDeltaCents (int, default 0) · SortOrder · IsAvailable

CategoryField              // join: which fields a category exposes, in what order
  Id (Guid) · CategoryId (FK) · FieldDefinitionId (FK) · SortOrder · IsRequired
  unique (CategoryId, FieldDefinitionId)
```

New enums in `Core/Enums`: `FieldType`, `FieldDisplay`.

### 4.2 `MenuItem` (extend existing)

Add: `StoreId (FK, nullable during migration)`, `CategoryId (FK, nullable)`,
`BaseItemId (string?, self-FK → MenuItem.Id — the preset "is-a / prints-as" pointer)`,
`DefaultAnswers (jsonb, nullable)`.

Keep: `Id (string PK)`, `Name`, `DefaultPriceCents`, `MaterialIcon`, `Note`, `IsInsider`,
`SortOrder`, `IsAvailable`.

**Remove:** `Kind (ProductKind)` — role taken over by `CategoryId`.

A **preset** (e.g. Danny-Box) is just a `MenuItem` with `BaseItemId` set + `DefaultAnswers`
populated. It has its own id/name/price/icon/badge; its category is the base's category;
the kitchen print uses the **base item's** name.

### 4.3 `OrderLine` (modify)

**Remove:** `Meat (MeatType?)`, `Sauces (Sauce)`, `PizzaVariantId (Guid?)`, `Kind (ProductKind)`.
**Add:** `Answers (jsonb, not null, default '{}')`.

Keep: `Id`, `OrderId`, `ProductId (FK→MenuItem)`, `PriceCents` (frozen per line),
`Quantity`.

**`Answers` JSON shape** (one object keyed by field key):

```json
{
  "meat":  { "options": ["kalb"] },
  "sauce": { "options": ["knoblauch", "scharf"] },
  "extra": { "text": "ohne Zwiebeln" }
}
```

Mapped via a `jsonb` column with a value converter to a domain type
(`LineAnswers` record wrapping `IReadOnlyDictionary<string, AnswerValue>`, where
`AnswerValue(IReadOnlyList<string> Options, string? Text)`). Tier reads
`answers["meat"].Options` / `answers["sauce"].Options`.

### 4.4 Retired

`ProductKind`, `MeatType`, `Sauce`, `PizzaVariant` entity, `CanonicalPizzaVariants`,
`OrderVocabulary`, `OrderVocabularyParser` — all deleted once migration + consumers are
swapped.

---

## 5. Ordering: validation & pricing

A single pure Application-layer service replaces `NormalizeForKind` + the endpoint
whitelist validators + `OrderVocabularyParser`:

- **`AnswerValidator`** (`[Pure]` where possible): given a `Category`'s field defs and a
  submitted `answers` map, validate:
  - required fields present (per `CategoryField.IsRequired`),
  - `SingleSelect` → exactly one option, member of the field's available options,
  - `MultiSelect` → subset of available options,
  - `Text` → within `MaxLength`,
  - no unknown field keys.
  Returns `Result` with typed `Validation()` failures.
- **`LinePriceCalculator`** (`[Pure]`): `PriceCents = item.DefaultPriceCents +
  Σ PriceDeltaCents` over every selected option. This is the **suggested** price.

**Price stays user-editable** (CONTEXT: "Price per item — editable; feeds the PayPal
amount"). The calculator produces the default; the orderer may override; the override is
frozen into `OrderLine.PriceCents` at write time.

Preset defaults: when a preset item is selected, the form seeds `answers` from
`MenuItem.DefaultAnswers` (falling back to each field's own default), then the orderer can
edit them.

---

## 6. Seeding

- **Source:** a JSON document embedded as a resource in
  `Infrastructure/Persistence/Seeding/menu.seed.json`, deserialized by a new
  `GenericMenuSeeder` invoked from `DatabaseSeeder` (alongside the existing
  `NotificationTemplateSeeder`).
- **Shape:** one document describing store #1 → its fields (with options: key, label,
  icon, priceDelta) → its categories (→ field links with order/required) → its menu items
  (→ category key, optional base item, default answers).
- **Policy — upsert by stable key, preserve edits** (decision #8):
  - Insert rows whose stable key is missing.
  - For existing rows, **do not overwrite admin-editable fields** (name, price, icon,
    availability, sort). Only fill structural/nullable-new columns (e.g. assign
    `CategoryId`/`StoreId`/`BaseItemId` to legacy items on first run).
  - Reserved keys (`meat`, `sauce`, their option keys, the six item ids) are treated as
    immutable — seeder never renames them.
- Idempotent + race-safe (mirror the existing seeders' unique-violation handling).

---

## 7. API changes

### 7.1 Public read — `GET /api/menu`

Payload grows so the SPA can render generically. `MenuResponse`:

```
categories: [ { key, name, sortOrder,
                fields: [ { key, label, type, display, maxLength?, required,
                            options: [ { key, label, icon?, priceDeltaCents } ] } ] } ]
items:      [ { id, name, categoryKey, baseItemKey?, priceCents, materialIcon,
                note?, isInsider, sortOrder, defaultAnswers? } ]
```

Scoped to the single active store for now (store selector deferred).

### 7.2 Order write — `PUT /api/order-days/{dayId}/orders/mine`

`PutMyOrderLineDataDto` becomes `{ productId, quantity, priceCents?, answers }`.
Validator delegates to `AnswerValidator`; server recomputes the suggested price and
accepts an explicit override. Delete `OrderVocabularyParser`.

### 7.3 Admin CRUD (new + retired)

New endpoint files (FastEndpoints REPR, one file per endpoint, `...DataDto` bodies,
`...SummaryDto`/`...DetailsDto` results, validators required):

- `Endpoints/Admin/Categories/` — Get/GetById/Post/Put/DeleteById (+ manage field links).
- `Endpoints/Admin/Fields/` — CRUD for field definitions **and** their options (options
  nested under a field, e.g. `POST /api/admin/fields/{id}/options`).
- `Endpoints/Admin/Menu/` — extend item DTOs with `categoryKey`, `baseItemId`,
  `defaultAnswers`.
- **Retire** `Endpoints/Admin/PizzaVariants/` + `PizzaVariantService` +
  `Endpoints/Menu` pizza-variant projection.

All go through services (`ICategoryService`, `IFieldService`, extended `IMenuService`) —
endpoints never touch `AppDbContext`.

---

## 8. Print / kitchen sheet

- **`OrderLabelBuilder`** rewritten:
  - Resolve `ProductId → MenuItem`. If `BaseItemId` set (preset), use the **base item's**
    name as the product label — the joke name is dropped.
  - Build the description generically by joining the **labels** of selected options (in
    field/option sort order) + the `extra` text, `" · "`-separated. Falls back to
    "Standard".
  - Result for Danny-Box: `Dönerbox (Gemischt) · Kräuter · Pommes · ohne Salat, extra Fleisch`.
- **`OrderDayService.ProjectAsync` / `BuildPrintLineInput`** and the QuestPDF renderer
  (`OrderListPdfRenderer`) consume the new resolved label/description; column layout
  unchanged. Sorting by menu `SortOrder` still works.

---

## 9. Frontend changes

### 9.1 `features/order`

- **`schemas.ts`:** delete `MeatType`/`SauceType`/`PizzaVariantOption` enums. Add
  `FieldOptionSchema`, `FieldSchema` (type, display, options, required, maxLength),
  `CategorySchema`, new `MenuItemSchema` (categoryKey, baseItemKey?, defaultAnswers?),
  `MenuSchema { categories, items }`. `OrderLineFormSchema` = `{ productId, quantity,
  priceCents, answers: Record<fieldKey, { options?: string[]; text?: string }> }`.
  Replace the döner-vs-pizza `superRefine` with validation **built dynamically from the
  selected item's category field defs**.
- **`FieldRenderer`** (`components/OrderPage/internal/FieldRenderer.tsx`): one generic
  component switching on `type` + `display`:
  - `single/segmented → SegmentedControl`, `single/dropdown → Select`,
  - `multi/chips → MultiSelectChips`,
  - `text/textarea → TextField multiline`.
  Replaces `MeatField`, `SauceField`, `PizzaVariantField`, and the bespoke `ExtraField`.
  `OrderLineCard` maps over `category.fields` rendering a `FieldRenderer` each — deleting
  the `meatVisible`/`pizzaVisible` branch.
- **`use-order-config.ts`:** returns the selected item's `category.fields` (ordered)
  instead of visibility booleans. `selectProduct` seeds `answers` from
  `item.defaultAnswers` → field defaults, and sets suggested price.
- **Live price:** a hook recomputes suggested price = base + Σ option deltas as answers
  change (React Compiler on — no `useMemo`).

### 9.2 `features/admin`

- New `AdminCategoriesPage`, `AdminFieldsPage` (field + options editor: label, icon,
  price delta, sort, availability; reserved-key fields lock their keys).
- `MenuItemDialog` gains a **category select** and a **preset editor** (base item +
  default-answers form driven by the base category's fields).
- **Delete** `AdminPizzaVariantsPage` + its hooks/api.
- Follow compound-component + context conventions; forms via `dialogManager.showFormDialog`.

All user-facing strings **German**; add to feature i18n / `copy.ts` per convention.

---

## 10. Migration & production data preservation

**There is a live production DB. No important information may be lost.** This section is
the contract for that. The app has exactly **12 tables** (no persisted tier/stats/audit
tables — those are computed per request, so preserving order history is sufficient for
tiers, leaderboard, streak, and Packesel to keep producing identical results).

### 10.1 Preservation matrix — what happens to every table

| Table | Impact | What is preserved / how |
|-------|--------|--------------------------|
| **User** | untouched | credentials, role, PayPal handle, work email, avatar, active flag — no schema change |
| **RefreshToken** | untouched | active sessions survive (only FK is to User) |
| **PushSubscription** | untouched | VAPID device subscriptions survive |
| **Notification** | untouched | history + `OrderDayId` link intact |
| **NotificationTemplate** | untouched | Döner-Tag synonyms/templates intact |
| **RegistrationMode** | untouched | self-registration settings singleton intact |
| **Debt** | untouched | reimbursement ledger + `OrderId`/`OrderDayId`/user FKs intact; **amounts derive from frozen line prices, which we never recompute** |
| **OrderDay** | **+`StoreId`** | all rows keep status/synonym/cutoff/collector; every existing row set to store #1 |
| **Order** | untouched | headers (user, pickup flag, timestamps) intact; `OccurredOn` (drives streak/leaderboard/tier window) untouched |
| **OrderLine** | **drop 4 cols, add `answers`** | `ProductId`, **frozen `PriceCents`**, `Quantity`, `OrderId` all kept; `Meat`/`Sauces`/`PizzaVariantId`/`Extra` **losslessly folded into `answers` before the columns drop** |
| **MenuItem** | **drop `Kind`, +4 cols** | all rows kept (Restrict FK from `OrderLine.ProductId` forbids loss); `Kind` role replaced by `CategoryId` |
| **PizzaVariant** | **table dropped** | the 5 rows' identities survive as `variant` field options; existing line references migrated into `answers` first |

**Never touched:** historical `OrderLine.PriceCents` (frozen per order) — so every past
total, PayPal amount, and Debt stays exactly correct. We only change menu *default* prices
going forward.

### 10.2 The migration (single EF migration: expand → backfill → verify → contract)

1. **Expand (schema, additive, no loss):** create `Store`, `Category`, `FieldDefinition`,
   `FieldOption`, `CategoryField`. Add nullable `MenuItem.StoreId/CategoryId/BaseItemId/DefaultAnswers`.
   Add `OrderLine.Answers jsonb not null default '{}'`. Add nullable `OrderDay.StoreId`.
   Insert the store #1 row.
2. **Backfill (raw SQL, while the old columns still exist):**
   - `OrderLine.Answers` from `Meat` (→`meat.options=[kalb|haehnchen|gemischt]`, null→omit),
     `Sauces` (flags→`sauce.options=[…]`, `None`→omit), `PizzaVariantId` (the 5 fixed Guids
     →`variant.options=[key]`), `Extra` (non-empty→`extra.text`).
   - `OrderDay.StoreId := store #1` for all rows.
3. **Verify (guard, aborts the transaction on mismatch):** assert
   `count(OrderLine where Meat is not null) == count(answers ? 'meat')`, same for sauce and
   pizza variant, and `count(Extra <> '') == count(answers ? 'extra')`. If any mismatch, the
   whole migration rolls back — no half-migrated prod.
4. **Contract (drop, only after verify passes):** drop `OrderLine.Meat/Sauces/PizzaVariantId/Kind`,
   `MenuItem.Kind`, and the `PizzaVariant` table + FK.

Everything runs in one transaction (Postgres DDL is transactional), so the DB is either
fully old or fully new — never in between.

### 10.3 One-time establishment vs. ongoing seed (resolves the price/edit conflict)

The ongoing seed policy is *preserve admin edits* (§6) — but the 6 existing prod items
predate categories and carry **old prices**. So establishment is split:

- **One-time (in this migration / first `GenericMenuSeeder` run):** authoritatively set the
  6 known items' **category**, **new card base prices** (Appendix A), and the Danny **preset
  link + default answers**. This is a deliberate, one-time correction of the seeded items.
- **Ongoing (every later boot):** `GenericMenuSeeder` upserts the field library, categories,
  and category-field links by stable key, and **never overwrites** admin-editable fields
  (price/name/icon/availability) on rows that already exist. New default items added to
  `menu.seed.json` later are inserted; existing ones are left alone.

`MenuItem.CategoryId` stays nullable to avoid a chicken-and-egg not-null constraint (an
unassigned item simply renders no fields); the seeder fills it on first run.

> **Decision to confirm (§ "Open questions"):** the one-time step *overwrites the current
> prod prices of the 6 items* with the card prices. That is the intent (align with the real
> card), but it does discard any manual price the admin set on those 6 items. Historical
> orders are unaffected (frozen prices).

### 10.4 Rehearsal on staging before prod (mandatory)

Deploy topology: staging `~/doener-control-staging` (:8091) and prod `~/doener-control`
(:8090) are isolated, independently versioned; deploy = rsync + on-host compose rebuild.

1. Snapshot prod DB (`pg_dump`).
2. Restore the snapshot into **staging**, deploy this branch there, let the migration + seeder run.
3. **Verify against the snapshot:** row counts per table unchanged (except the new tables);
   the §10.3 backfill guard passed; and a spot-check that `GET /api/dashboard`,
   `GET /api/leaderboard`, and `GET /api/tiere/mine` for several users return the **same**
   values as pre-migration (the regression-lock test in §13 automates this on a fixture).
4. Confirm the Danny-Box kitchen print now reads as the Dönerbox spec.
5. Only then deploy to prod (with a fresh prod snapshot taken immediately before).

### 10.5 Rollback

DDL is transactional, so an in-migration failure auto-rolls-back. For a *post-deploy*
problem (data looks wrong after success), the down-migration is impractical (the old typed
columns are gone) — **rollback = restore the pre-deploy prod snapshot** from step 5. This is
why the snapshot immediately before prod deploy is mandatory.

### 10.6 Code impact (from the reference inventory)

The types being deleted (`MeatType`, `Sauce`, `ProductKind`, `PizzaVariant`,
`CanonicalPizzaVariants`, `OrderVocabulary`, `OrderVocabularyParser`, pizza-variant
service/endpoints) have a **known, finite consumer set** to swap — full file/line checklist
lives in the reference inventory (sections A–L). Existing migration `.cs`/`.Designer.cs`
files refer to these columns as **strings**, not CLR types, so deleting the enums does **not**
break migration history or a fresh `dotnet ef` build.

**Tier repoint** ships in this same slice: `TierService.PatternTiersAsync` builds
`TierOrderInput` from `answers["meat"]/["sauce"]` + `ProductId`, deriving döner-kind from
category membership (has a `meat` field). `TierCalculator` and every threshold stay byte-for-byte
unchanged.

---

## 11. Phasing (vertical slices, each independently shippable)

- **Phase 0 — Store foundation.** `Store` entity + `OrderDay.StoreId` + scope existing
  queries by the single store. Seed store #1. No user-visible change.
- **Phase 1 — Generic model + migration (backend).** Category/Field/Option/CategoryField
  entities; `MenuItem`/`OrderLine` changes; the EF migration (§10); `AnswerValidator` +
  `LinePriceCalculator`; `GenericMenuSeeder` + `menu.seed.json`; repoint TierService;
  rewrite `OrderLabelBuilder` (preset → base). Delete legacy enums/`PizzaVariant`.
  **Acceptance:** existing history intact; tiers/stats/leaderboard unchanged; Danny-Box
  prints as Dönerbox spec; per-pizza prices correct.
- **Phase 2 — Order form (API + frontend).** Generic `GET /api/menu`; `FieldRenderer` +
  dynamic validation + live price; remove hard-coded meat/sauce/pizza components.
  **Acceptance:** ordering any item via generic fields; Danny-Box orderable with editable
  defaults; price reflects option deltas.
- **Phase 3 — Admin.** Category/field/option/preset editors; retire pizza-variant screen.
  **Acceptance:** admin can add a new category + fields + a preset end-to-end.
- **Phase 4 — Later (separate RFCs).** Store-selector UI + per-store admin;
  Tier engine reworked to be config-driven (per-store animals).

---

## 12. Risks & mitigations

- **Data migration correctness on live prod.** One-shot backfill of live history. →
  Fully specified in §10: single transactional migration, an in-transaction verify guard
  that aborts on any count mismatch (§10.3), mandatory staging rehearsal against a prod
  snapshot (§10.4), and snapshot-restore rollback (§10.5). Frozen `OrderLine.PriceCents`
  is never recomputed, so all past totals/PayPal/Debt stay correct.
- **Tier key drift.** An admin renames a reserved option key → tiers silently break. →
  Immutable keys enforced in seeder + admin; a startup assertion that the reserved keys
  exist.
- **Untyped `answers` JSON.** Loss of DB-level type safety. → `AnswerValidator` at the
  write boundary + Zod at the client boundary are the guardrails; consider a DB `CHECK`
  later if needed.
- **Scope creep.** The engine is generic enough to over-build. → Field types limited to
  SingleSelect/MultiSelect/Text in v1 (no number/toggle until a real need); store-selector
  UI deferred.

---

## 13. Testing

- **Backend (xUnit v3, `Should_..._When_...`):** `AnswerValidator` (required/subset/
  maxlength/unknown-key), `LinePriceCalculator` (delta sums, overrides), `OrderLabelBuilder`
  (preset resolves to base, description join), `GenericMenuSeeder` (insert-missing,
  preserve-edits, reserved-key immutability), migration backfill (enum/flags/Guid→answers),
  `TierService` projection (answers-fed `TierOrderInput` reproduces prior tiers on a fixed
  history fixture — a regression lock).
- **Frontend (Vitest + Testing Library):** `FieldRenderer` per type/display, dynamic
  validation, live price, Danny-Box default-answers seeding.

---

## 14. Decisions log (all resolved — no open questions)

- **Prod price reset (§10.3): YES.** The one-time establishment overwrites the 6 existing
  items' current prod prices with the Appendix-A card prices. Historical orders unaffected
  (frozen prices).
- **Meat pricing:** no surcharge (chicken = same price); base price = card "Normal" price.
- **Danny-Box:** 7,00 € = box 6,00 + Pommes 1,00 (up from the legacy flat 6,00).

Nothing else is open — the plan is ready to implement.

---

## Appendix A — Start seed for store #1 (`menu.seed.json`)

Deliberately lean — the office's actual repertoire, **not** the full card. Prices from the
shop card (Stand 11.06.2026). The six ids and the `meat`/`sauce` keys are fixed by the
Tier contract (§3); the five pizza variant keys are kept so existing pizza orders migrate
cleanly.

### Store

`{ key: "schulz-doener", name: "Schulz Döner", sortOrder: 0, isActive: true }`

### Fields (reusable library)

| key | label | type | display | options (label · priceDelta) |
|-----|-------|------|---------|------------------------------|
| `meat` | Fleisch | single | segmented | `kalb` Kalb +0 · `haehnchen` Hähnchen +0 · `gemischt` Gemischt +0 |
| `sauce` | Soße | multi | chips | `kraeuter` Kräuter 🌿 +0 · `knoblauch` Knoblauch 🧄 +0 · `scharf` Scharf 🌶 +0 |
| `beilage` | Beilage | single | segmented | `ohne` Ohne Pommes +0 · `pommes` Mit Pommes **+100** |
| `variant` | Sorte | single | chips | `margherita` Margherita +0 · `funghi` Funghi +0 · `salami` Salami **+100** · `tonno` Thunfisch **+100** · `hawaii` Hawaii **+100** |
| `extra` | Extrawünsche | text | textarea | maxLength 256 |

### Categories → fields (`*` = required)

| category key | name | fields |
|--------------|------|--------|
| `doener` | Döner | `meat`\* · `sauce` · `extra` |
| `doenerbox` | Dönerbox | `meat`\* · `sauce` · `beilage`\* · `extra` |
| `pizza` | Pizza | `variant`\* · `extra` |

### Menu items

| id | name | category | basePriceCents | notes |
|----|------|----------|----------------|-------|
| `doener` | Döner | doener | 600 | „Normal" |
| `duerum` | Dürüm | doener | 700 | |
| `big` | Großer Döner | doener | 700 | „Groß"; feeds 🐗 Big-Döner-Wildsau |
| `box` | Dönerbox | doenerbox | 600 | „Box Normal"; `beilage` default `ohne` |
| `danny` | Danny-Box | doenerbox | 600 | **preset**, see below |
| `pizza` | Pizza | pizza | 900 | cheapest variant; deltas set the rest |

Pizza resolved prices: Margherita/Funghi 9,00 · Salami/Thunfisch/Hawaii 10,00.

### Danny-Box preset

```
id: "danny", baseItemId: "box", categoryKey: "doenerbox",
isInsider: true, basePriceCents: 600,
defaultAnswers: {
  meat:    { options: ["gemischt"] },
  sauce:   { options: ["kraeuter"] },
  beilage: { options: ["pommes"] },
  extra:   { text: "ohne Salat, extra Fleisch" }
}
```

Ordered as-is → **7,00 €** (box 600 + Pommes 100). Line stores `ProductId="danny"` (📦
Danny-Jünger keeps counting). Kitchen sheet prints: **`Dönerbox (Gemischt) · Kräuter ·
Mit Pommes · ohne Salat, extra Fleisch`** — never "Danny-Box".

### Deliberately dropped from the card (add later via admin)

Döner veg/special variants (Halloumi, Falafel, Antipast, Seitan), the full Teller range,
Pommes-Box, Nudeln/Schnitzel/Salat („Sonstiges"), and the extra pizza sorts
(Roma, Meeresfrüchte, Polo, Döner, Vegetarisch, Peperoni, Indien, America, Quattro
Formaggi, Mozzarella).

### Two judgment calls I made (flag if wrong)

1. **No meat surcharge.** The card charges Hähnchen-Döner 6,50 (Normal 6,00), but the
   surcharge pattern is inconsistent across products (it's Gemischt on Dürüm), and a shared
   option delta can't model both. Kept meat deltas at 0; base price = the „Normal" price.
2. **Danny lands at 7,00**, not the old 6,00 — because it's really „Box mit Pommes" (7,00
   on the card) and the price now falls out of `box 600 + Pommes 100`.

---

## Appendix B — Consumer checklist (create / modify / delete)

Paths under `server/src/` unless noted. This is the definitive impact map from the codebase
inventory. Historical EF migration files reference these columns as **strings**, so deleting
the CLR enums does not break migration history or a fresh `dotnet ef` build.

### DELETE entirely (backend)

- Enums: `Core/Enums/MeatType.cs`, `Core/Enums/Sauce.cs`, `Core/Enums/ProductKind.cs`
- Entities: `Core/Entities/PizzaVariant.cs`, `Core/Entities/CanonicalPizzaVariants.cs`
- EF config: `Infrastructure/Persistence/Configurations/PizzaVariantConfiguration.cs`
- App (PizzaVariants): `Application/PizzaVariants/` — `IPizzaVariantService`, `PizzaVariantDetails`,
  `PizzaVariantRemoval`, `CreatePizzaVariantCommand`, `UpdatePizzaVariantCommand`
- Impl: `Infrastructure/PizzaVariants/PizzaVariantService.cs`
- API: `Api/Endpoints/Admin/PizzaVariants/` (Get/Post/Put/Delete + `AdminPizzaVariantDtos.cs`)
- Vocab: `Application/Menu/OrderVocabulary.cs`, `Api/Endpoints/Orders/OrderVocabularyParser.cs`
- Legacy seeder path: `Persistence/Seeding/MenuSeeder.cs` (superseded by `GenericMenuSeeder`)
- Tests: `tests/.../Admin/AdminPizzaVariant*` (+ `AdminPizzaVariantTestHelpers.cs`,
  `AdminPizzaVariantAuthorizationTests.cs`)
- DI: remove `IPizzaVariantService` registration in `Infrastructure/DependencyInjection.cs`

### CREATE (backend)

- Entities: `Core/Entities/{Store,Category,FieldDefinition,FieldOption,CategoryField}.cs`
- Enums: `Core/Enums/{FieldType,FieldDisplay}.cs`
- EF configs for each new entity in `Infrastructure/Persistence/Configurations/`
- Application: `AnswerValidator`, `LinePriceCalculator` (Calculators), `LineAnswers`/`AnswerValue`
  value types; `ICategoryService`/`IFieldService` (+ their Commands/Query/Details/Summary)
- Infrastructure: `CategoryService`, `FieldService`, `Persistence/Seeding/GenericMenuSeeder.cs`,
  `Persistence/Seeding/menu.seed.json` (embedded resource)
- API: `Api/Endpoints/Admin/Categories/` + `Api/Endpoints/Admin/Fields/` (REPR, one file per
  endpoint + validators)
- The single EF migration (§10) + updated `AppDbContextModelSnapshot.cs`

### MODIFY (backend)

- `Core/Entities/OrderLine.cs` — drop `Meat/Sauces/PizzaVariantId/Kind` (+ nav); add `Answers`
- `Core/Entities/MenuItem.cs` — drop `Kind`; add `StoreId/CategoryId/BaseItemId/DefaultAnswers`
- `Core/Entities/OrderDay.cs` — add `StoreId`
- `Persistence/Configurations/OrderLineConfiguration.cs` — `answers` jsonb converter; remove enum
  conversions + pizza FK
- `Persistence/Configurations/MenuItemConfiguration.cs` — category FK + base self-FK; drop `Kind`
- `Application/Orders/OrderDetailsFactory.cs`, `Application/Orders/UpsertOrderCommand.cs`,
  `Application/Orders/OrderDetails.cs`
- `Application/Calculators/OrderLabelBuilder.cs` — generic answer→label; **preset resolves to
  base name**
- `Application/Calculators/TierOrderInput.cs` + `Infrastructure/Tiers/TierService.cs` — project
  `TierOrderInput` from `answers` + category membership. **`TierCalculator.cs` unchanged.**
- `Infrastructure/OrderDays/OrderDayService.cs` (print projection + base-name resolution),
  `Infrastructure/Orders/OrderService.cs` (Upsert / replace `NormalizeForKind` with
  `AnswerValidator` + `LinePriceCalculator`), `Infrastructure/Orders/PickupService.cs`,
  `Infrastructure/Menu/MenuService.cs`
- `Application/Menu/` — `CreateMenuItemCommand`, `UpdateMenuItemCommand`, `MenuItemDetails`,
  `MenuItemSummary`, `MenuDetails` (drop `Kind`/`PizzaVariantOption`; add category/preset)
- API: `Api/Endpoints/Menu/GetMenu.cs` (new payload §7.1), `Api/Endpoints/Admin/Menu/*`
  (category + preset), `Api/Endpoints/Orders/PutMyOrder.cs` + `OrderDetailsDto.cs` (`answers`)
- `Persistence/Seeding/DatabaseSeeder.cs` (wire `GenericMenuSeeder`),
  `Persistence/Seeding/DevHistorySeeder.cs` (dev-only, rewrite to `answers`)
- `Infrastructure/DependencyInjection.cs` (register new services + seeder)
- Update the many affected tests (Tier, Dashboard, Leaderboard, Menu, Admin/Menu, Orders,
  `SchemaAndSeedTests`, `OrderLabelBuilderTests`) — add the **TierService regression-lock**
  test (answers-fed projection reproduces prior tiers on a fixed history fixture).

### Frontend (`web/src/`)

- **Modify** `features/order/{schemas,types,api,copy}.ts` — replace `MeatType`/`SauceType`/
  pizza-variant schemas with `Category`/`Field`/`FieldOption`/`Menu` + `answers`; dynamic
  validation from field defs.
- **Create** `features/order/components/OrderPage/internal/FieldRenderer.tsx`;
  **modify** `OrderLineCard.tsx`, `ProductGridField.tsx`; **delete** `MeatField.tsx`,
  `SauceField.tsx`, `PizzaVariantField.tsx`, `ExtraField.tsx`.
- **Modify** `features/order/hooks/{use-order-form,use-order-config}.ts`, `order-context.ts`,
  `components/OrderFormProvider.tsx` (fields from selected item's category; live price).
- **Modify** `features/admin/{schemas,types,api,copy}.ts`; extend `MenuItemDialog` (category +
  preset/default-answers editor); **create** `AdminCategoriesPage`, `AdminFieldsPage`;
  **delete** `AdminPizzaVariantsPage` (+ hooks/api) and route `routes/_auth/admin/pizza-variants.tsx`;
  add category/field routes.
- Tests: `FieldRenderer` per type/display, dynamic validation, live price, Danny default seeding.


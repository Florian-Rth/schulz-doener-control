# Schulz Döner Control — Implementation Plan

> Generated from the mock (`mocks/Schulz Döner Control.dc.html`) + `CONTEXT.md` + the
> mandatory `backend-work` / `frontend-work` skills, via a multi-agent planning pass
> (data model · security · API · frontend · tests · roadmap · adversarial critique).
> This is the build contract; the per-feature subagents work from the **Build Roadmap**.

## Goal

Turn the static mock into a real, secure, full-stack app: a German, mobile-first web app
for the office's weekly Döner-Tag — open a day, collect orders, designate the Abholer,
and settle PayPal reimbursements — playful tone ("Chef", Döner-Tiere, absurd synonyms) on
the serious Schulz Machine-Eye design system.

## Resolved decisions (this session)

| Topic | Decision |
|---|---|
| HTTP API | **FastEndpoints** (REPR), per `backend-work`. |
| Persistence | **EF Core + SQLite** (scaffold's Npgsql provider is switched to SQLite in F0). |
| Password storage | **Argon2id + per-user salt + a configurable server-side _pepper_** (from config; never in DB). Passwords are hash-only, never reversible. |
| Auth/session | **JWT access token in a Secure + httpOnly + SameSite cookie + rotating refresh token**; CSRF-protected; all endpoints authenticated except login/refresh. |
| Integration tests | **Real SQLite per test** (fresh temp DB, real migrations, seeded) via WebApplicationFactory. No Testcontainers, no mock-only tests. |
| Backend workflow | **TDD red-green**, real & useful tests only. |
| Frontend | **Compound composition**, strict **Logic / Layout / UI** separation, per `frontend-work`. |
| Build method | Feature-by-feature, each by a **fresh subagent**, orchestrated by an ultracode workflow. |

## Plan updates — decisions resolved & critique fixes (authoritative)

_This section is the final word; where it conflicts with a section body below, this wins.
Per-feature subagents must read it alongside their feature._

### Decisions resolved (this round)

| Topic | Decision | Consequence |
|---|---|---|
| Notifications (v1) | **Real Web Push** (VAPID + service worker) | New `PushSubscription` entity; VAPID keys in config; SW + permission/subscribe flow in `web/`; `OpenDay` sends a web push to all other active users (the mock's in-app toast still renders in-foreground). New roadmap features F19/F20. |
| Day close & debts | **Manual close** — opener/Abholer taps "Tag schließen"; closing creates one `Debt` per non-pickup payer | No background job / auto-close. Debts crystallize at close, not at submit. |
| Multiple Abholer | **One designated collector** — `OrderDay.CollectorUserId`; every debt points to that one collector | Matches "one person pays the shop". If several mark pickup, one is the collector (opener-chosen; default = opener if they pick up, else first pickup). Even-split deferred. |
| Deployment | **Separate origins** (e.g. `api.…` vs `app.…`) | Cookies `SameSite=None; Secure`; **CORS** with `AllowCredentials` + explicit origin allow-list; CSRF double-submit token still required. Overrides the same-origin assumption in the Security section. |

### Technical corrections (override the section bodies below)

1. **Auth ≠ `Result<T>`.** `Result<T>` stays domain-only (`Success/NotFound/Conflict/Validation`). Login credential failure → **401** straight from the endpoint; authorization → **403** via FastEndpoints roles/policies. Do **not** add Unauthorized/Forbidden to `Result`, never use bare `Failure()`.
2. **Auth packages.** Add **`FastEndpoints.Security`** to `Directory.Packages.props` (JWT/cookie helpers are not in core FE 8.1).
3. **Test harness.** On `AppFixture<Program>` override **`ConfigureApp(IWebHostBuilder)` / `ConfigureServices(IServiceCollection)`** (not the non-existent `ConfigureConfiguration`); inject the test SQLite connection, test pepper, and test JWT key there. Seed **one active user with `MustChangePassword=false`** so authenticated tests don't hit the forced-change 403 gate.
4. **Username uniqueness.** Add `NormalizedUserName` (lower-invariant) with the unique index (or `COLLATE NOCASE`); login resolves by normalized name.
5. **History accuracy.** Add `Order.OccurredOn` (business timestamp) distinct from `CreatedAt` (row insert). The 90-day tier window, monthly spend, and streak all key off `OccurredOn`; seed/backfill sets realistic `OccurredOn`s.
6. **Entities in `InitialCreate`.** `RefreshToken`, `Notification`, and `PushSubscription` are part of the data model and the **F1 InitialCreate** migration — not bolted on later.
7. **Success-screen endpoint.** Add **`GET /api/orders/{id}/result`** → `{ productLabel, priceCents, detail, isPickup, abholer{name,initials,colorHex,payPalHandle}, collectCents, collectCount, myPayPalUrl }`. The Success screen is server-driven from the order id.
8. **Dashboard aggregate.** Add **`GET /api/dashboard`** composing stats + tier + leaderboard + open debts (one mobile round-trip). The granular endpoints remain for reuse; `api.ts` hooks target the aggregate.
9. **Frontend↔API contract.** API endpoint names are canonical; frontend hooks align to them (fixes the `/order-days` vs `/orders/mine`, `/debts/open` vs `/debts/mine`, etc. mismatches).
10. **CSRF lifecycle.** Reissue the `dc_xsrf` cookie on **login, refresh, and me**; the client re-reads it after a silent refresh before the next mutation (required under `SameSite=None`).
11. **Material Icons.** Self-host the **Material Symbols/Icons Outlined** font locally in `web/` (no CDN; CSP-safe); `MenuItem.MaterialIcon` strings resolve against it. (Alternative: map the strings → MUI SVG icons.)
12. **`computeTier` port.** Compute `garlic/spicy/kalbR/haehnR/noSauce/allThree` from **enum flags**, not German strings. Canonical fixture: Markus's 12 orders → garlic ≈ 0.92 (≥0.7), spicy ≈ 0.42 (<0.6) ⇒ first match **🐺 Der Knoblauch-Wolf** (pin in the unit test).
13. **PayPal amount.** Always 2 decimals: 800¢ → `8.00`, 1000¢ → `10.00`.

### Defaults applied (not escalated — say so if you disagree)

- **Provisioning:** seed/CLI-only for v1 + an `Admin` role + a seeder; initial password forces a change on first login (`MustChangePassword`); **no self-service reset** (admin re-provision only). In-app admin endpoint deferred (was F18).
- **Counting:** leaderboard (per-year) and "Döner gesamt" (lifetime) **count all orders**.
- **PayPal handle:** **self-entered** via the profile on first use; `PayPalHandle` nullable; PayPal buttons disabled until set.
- **Tokens:** access ~15 min; **refresh 30 days** sliding rotation.
- **Tier window:** rolling **90 days** (inclusive) on `OccurredOn`.
- **Menu:** `GetMenu` also returns the pizza/sauce/meat vocabularies.
- **After close:** orders + pickup are **frozen** (no edits) past cutoff/close.
- **Ad-hoc debts:** keep a manual create-debt path (the mock's "Ayran-Schulden"); `Debt.OrderId/OrderDayId` nullable.
- **Order semantics:** idempotent **upsert** per `(day,user)` until cutoff (PUT).
- **i18n:** German-only — **drop** the `/$lang/` prefix + locale-file machinery; plain German `copy.ts` (overrides the frontend-work i18n rule for this app).

### Roadmap deltas

- **F1** gains `RefreshToken` + `Notification` + `PushSubscription` entities, `Order.OccurredOn`, `NormalizedUserName` — all in `InitialCreate`.
- **F3** gains `FastEndpoints.Security`, separate-origin cookie/CORS/CSRF config, and the verified test-user seed.
- **F9/F10** add `OrderDay.CollectorUserId`; **manual CloseDay creates debts** → the collector; add the ad-hoc create-debt + `GET /orders/{id}/result` endpoints.
- **F11** adds the aggregate `GET /api/dashboard`.
- **New F19 (backend Web Push):** VAPID config, `PushSubscription` endpoints, send-on-`OpenDay`. dependsOn F8.
- **New F20 (frontend Web Push):** service worker, subscribe/permission UI, wired to F19. dependsOn F6, F19.

## Contents

1. [Data model & persistence](#data-model--persistence)
2. [Security & authentication](#security--authentication)
3. [Backend API](#backend-api)
4. [Frontend architecture](#frontend-architecture)
5. [Test strategy](#test-strategy)
6. [Build roadmap](#build-roadmap)
7. [Open decisions & risks](#open-decisions--risks)
8. [Completeness critique](#completeness-critique)


---

## Data model & persistence

## Data-Model & Persistence Architecture

This section specifies the complete domain + EF Core/SQLite persistence model. The guiding principle, taken straight from the mock's `computeTier(MY_HISTORY)` and the dashboard markup: **the Order is the single source of truth.** Tier, stats, leaderboard, and streak are all *derived* by querying `Orders` — nothing aggregate is stored. We persist only the raw facts each Order needs to reproduce the mock's calculations exactly.

### Clean-Architecture placement (per backend-work)

| Layer | Project | What lives here |
|---|---|---|
| POCO entities | `Schulz.DoenerControl.Core` (zero deps) | All entity classes + enums below. `Core/Entities/*.cs`, `Core/Enums/*.cs`. No EF attributes, no navigations marked `virtual`. |
| `AppDbContext` + `IEntityTypeConfiguration<T>` | `Schulz.DoenerControl.Infrastructure/Persistence` | `AppDbContext` (already exists, uses `ApplyConfigurationsFromAssembly`), one config file per entity under `Persistence/Configurations/`, value converters, seed, `AppDbContextFactory`. |
| Migrations | `Infrastructure/Persistence/Migrations` | EF migrations; applied for real in integration tests. |
| Service types (Command/Query/Details/Summary) | `Application` | Never expose entities across this boundary (backend-work). Tier/stats/leaderboard are computed in Application services from entities read via the DbContext. |

Entities are owned by Core and used **only** in Infrastructure (backend-work: "EF Core entities never cross the service boundary"). Navigation properties are nullable and non-virtual.

---

### Entity tables

#### `User`
The employee account. Carries credentials, the PayPal.Me handle, and provisioning flags.

| Field | Type (CLR) | SQLite column | Notes |
|---|---|---|---|
| `Id` | `Guid` | TEXT | PK. Guid (not int) so seed/provisioning and refresh-token references are stable across DBs. |
| `Username` | `string` | TEXT | e.g. `m.wagner`. **Unique index.** Login identifier. |
| `DisplayName` | `string` | TEXT | "Markus Wagner". Greeting + leaderboard + avatars derive first name/initials from this — do **not** store initials/first name separately (mock derives them via `initialsOf`). |
| `PayPalHandle` | `string?` | TEXT | The PayPal.Me handle, e.g. `LukasBrandtHB`. Link built as `https://paypal.me/{handle}/{amount}EUR`. Nullable so a user can be provisioned before they supply it; debts to a user with no handle render without a working button. |
| `PasswordHash` | `byte[]` | BLOB | Argon2id output. Never reversible. |
| `PasswordSalt` | `byte[]` | BLOB | Per-user random salt. The **pepper is NOT a column** — it comes from configuration and is mixed in at hash/verify time. |
| `Role` | `UserRole` (enum) | INTEGER | `Employee` / `Admin`. Drives provisioning/admin tooling. |
| `IsActive` | `bool` | INTEGER | Soft enable/disable for provisioning. Inactive users cannot log in and are excluded from leaderboard/open-day notification targets. |
| `MustChangePassword` | `bool` | INTEGER | Set on seed/provision with an initial password; cleared after first self-set. Handles the "initial-password handling" gap. |
| `AvatarColorHex` | `string` | TEXT | e.g. `#00728E`. Mock assigns each person a fixed avatar color; storing it keeps avatars stable instead of randomizing per render. |
| `CreatedAt` | `DateTimeOffset` | TEXT | UTC. |

Relationships: `User 1—* Order`, `User 1—* RefreshToken`, `User 1—* OrderDay` (as opener), `User 1—* Debt` (as debtor and as creditor — two FKs).

#### `OrderDay`
One Döner-Tag. The "open a day" flow and the Bestellschluss live here.

| Field | Type | SQLite | Notes |
|---|---|---|---|
| `Id` | `Guid` | TEXT | PK. |
| `Date` | `DateOnly` | TEXT | The calendar day (UTC-anchored local business day, see DateTime section). **Unique index** → enforces "one open OrderDay per day". |
| `Status` | `OrderDayStatus` (enum) | INTEGER | `Open` / `Closed`. |
| `Synonym` | `string` | TEXT | The random Döner-Synonym chosen at open time (`Drehspieß-Tasche` …). Stored so the notification-preview text on the home screen is reproducible after a refresh, not re-randomized. |
| `OrderCutoffAt` | `DateTimeOffset` | TEXT | The Bestellschluss instant (mock 11:30). Orders rejected/locked after this; basis for auto-close decision. |
| `OpenedByUserId` | `Guid` | TEXT | FK → `User`. Who pressed "Ich will heute Döner!". |
| `OpenedAt` | `DateTimeOffset` | TEXT | UTC. |
| `ClosedAt` | `DateTimeOffset?` | TEXT | Null while open. |

Relationships: `OrderDay 1—* Order`. `OpenedByUserId` → `User`.

#### `Order`
The atomic, source-of-truth record. **Every input `computeTier` and the dashboard need is captured here.** One row per user per day.

| Field | Type | SQLite | Notes / mock mapping |
|---|---|---|---|
| `Id` | `Guid` | TEXT | PK. |
| `OrderDayId` | `Guid` | TEXT | FK → `OrderDay`. |
| `UserId` | `Guid` | TEXT | FK → `User`. **Composite unique index `(OrderDayId, UserId)`** → "one order per user per day"; supports add/edit (upsert) until cutoff. |
| `ProductId` | `string` | TEXT | FK → `MenuItem.Id` (`doener`/`duerum`/`big`/`box`/`danny`/`pizza`). Mock's `productId` — drives tier product counts (`pizza`, `danny`, `big`, `box`, `duerum`) and `uniq`. |
| `Kind` | `ProductKind` (enum) | INTEGER | `Doener`/`Pizza`. Denormalized copy of the menu item's kind, frozen at order time (mock reads `o.kind`); used for `noSauce` (doener-kind only) and conditional fields. |
| `Meat` | `MeatType?` (enum) | INTEGER null | `Kalb`/`Haehnchen`, **null for pizza**. Tier `kalbR`/`haehnR`/`meated` count only orders where `Meat != null`. |
| `PizzaVariant` | `PizzaVariant?` (enum) | INTEGER null | `Salami`/`Margherita`/`Funghi`/`Tonno`/`Hawaii`, null for doener-kind. |
| `Sauces` | `Sauce` flags enum | INTEGER | Multi-select stored as a **bit-flags int** (see Sauces decision). `Kraeuter`/`Knoblauch`/`Scharf`. Tier `garlic`/`spicy`/`noSauce`/`allThree` derive from this. |
| `PriceCents` | `int` | INTEGER | Editable price as **integer cents** (see Money). Feeds PayPal amount and monthly-spend stat. Prefilled from `MenuItem.DefaultPriceCents`. |
| `Extra` | `string?` | TEXT | Extrawünsche free text ("ohne Zwiebeln…"). |
| `IsPickup` | `bool` | INTEGER | This user is an Abholer for the day. Designed for **>=1 pickup** (CONTEXT.md), not a single FK on OrderDay. |
| `CreatedAt` / `UpdatedAt` | `DateTimeOffset` | TEXT | UTC; `UpdatedAt` bumps on edit. |

> **Why `Kind`, `Meat`, `Sauces`, `PriceCents` are denormalized onto Order and not looked up from MenuItem at read time:** the mock's tier math reads these per-order fields directly, and they are per-order *choices*. Freezing `Kind` and `PriceCents` makes 3-month history immune to future menu/price edits — a key correctness property for the tier and the monthly-spend stat.

#### `Debt`
The cross-day debt ledger ("Offene Zahlungen"). One row per non-pickup participant → pickup person, created when a day's orders are finalized, settled when paid. This is **not derivable** (it has an external lifecycle: PayPal payments happen off-platform and someone marks them settled), so it is stored.

| Field | Type | SQLite | Notes |
|---|---|---|---|
| `Id` | `Guid` | TEXT | PK. |
| `DebtorUserId` | `Guid` | TEXT | FK → `User`. Owes the money. |
| `CreditorUserId` | `Guid` | TEXT | FK → `User`. The Abholer to be reimbursed. |
| `OrderId` | `Guid?` | TEXT | FK → `Order` that generated it (null for ad-hoc debts like the mock's "Ayran-Schulden"). |
| `OrderDayId` | `Guid?` | TEXT | FK → `OrderDay`; lets the row show "Döner-Tag · letzte Woche". |
| `AmountCents` | `int` | INTEGER | What the debtor owes (= their own order price for order-generated debts). |
| `Reason` | `string` | TEXT | "Döner-Tag" / "Ayran-Schulden". |
| `Status` | `PaymentStatus` (enum) | INTEGER | `Open`/`Settled` (+`Cancelled`). The "Offen" stat counts `Open` debts where the current user is debtor; the home total sums their `AmountCents`. |
| `CreatedAt` | `DateTimeOffset` | TEXT | UTC. |
| `SettledAt` | `DateTimeOffset?` | TEXT | Set when marked paid. |

Relationships: two FKs to `User` (debtor/creditor) — configure with `OnDelete(Restrict)` to avoid multiple-cascade-path errors on SQLite.

#### `MenuItem`  — **seeded reference data, NOT an enum** (recommended)

| Field | Type | SQLite | Notes |
|---|---|---|---|
| `Id` | `string` | TEXT | PK = the mock's string id (`doener`…`pizza`). Natural key, referenced by `Order.ProductId`. |
| `Name` | `string` | TEXT | "Döner", "Danny-Box"… |
| `DefaultPriceCents` | `int` | INTEGER | 750, 800, 950, 650, 600, 900. Editable per order — this is only the prefill default. |
| `Kind` | `ProductKind` (enum) | INTEGER | `Doener`/`Pizza`. |
| `MaterialIcon` | `string` | TEXT | `kebab_dining`, `local_pizza`… (frontend renders Material Icons Outlined). |
| `Note` | `string?` | TEXT | "Pommes · Fleisch · Soße" for Danny-Box. |
| `IsInsider` | `bool` | INTEGER | True only for `danny` → drives the "INSIDER" badge. |
| `SortOrder` | `int` | INTEGER | Preserves menu grid order. |

**Recommendation & justification:** seed `MenuItem` as a real table rather than a C# enum. (1) The Order screen renders the menu *with prices, icons, notes, badge* — that is data, not a closed code concept; an enum cannot carry `DefaultPriceCents`/`MaterialIcon`/`Note`. (2) Prices change in the real shop; editing a seeded row + migration beats a code change. (3) `Order.ProductId` is a clean FK with referential integrity. (4) The mock itself models `MENU` as a data array, not a type. `ProductKind` *is* modeled as an enum because it is a genuinely closed set that branches logic (conditional UI, tier math).

#### `RefreshToken`
Backs JWT refresh-with-rotation (session decision #2).

| Field | Type | SQLite | Notes |
|---|---|---|---|
| `Id` | `Guid` | TEXT | PK. |
| `UserId` | `Guid` | TEXT | FK → `User`. |
| `TokenHash` | `byte[]` | BLOB | Store a **hash** of the refresh token, never the raw token. **Unique index.** |
| `ExpiresAt` | `DateTimeOffset` | TEXT | UTC. |
| `CreatedAt` | `DateTimeOffset` | TEXT | UTC. |
| `RevokedAt` | `DateTimeOffset?` | TEXT | Set on rotation/logout. |
| `ReplacedByTokenHash` | `byte[]?` | BLOB | Rotation chain for reuse-detection. |

> No separate `Payment` entity beyond `Debt`. PayPal is fire-and-forget off-platform; we never receive a payment callback. The "payment" concept the UI shows is exactly the debt ledger + its `Settled` transition. A future webhook integration could add a `Payment` table, but it is out of scope and would be speculative now.

---

### STORED vs DERIVED (explicit)

| Concept | Stored / Derived | How |
|---|---|---|
| Order facts (product, kind, meat, sauces, price, extra, pickup, day, user) | **STORED** (`Order`) | The raw substrate everything else reads. |
| Döner-Tier | **DERIVED** | Application service ports `computeTier` over the user's `Orders` from the last 3 months (`CreatedAt >= now-90d`), priority-ordered, first match wins. Inputs: `garlic`/`spicy` (share with Knoblauch/Scharf flag), `kalbR`/`haehnR` (over orders with `Meat != null`, `meated >= 5`), `noSauce` (doener-kind, zero sauce flags), `allThree` (>=3 sauce flags), product counts, `uniq` (distinct `ProductId`), `n`. Tier catalog (15 emoji/name/tagline/tags) lives as a **static readonly** table in code, not the DB — it is presentation copy, not relational data. |
| Dashboard stats — "Döner gesamt", "Diesen Monat €", "Offen", "Streak" | **DERIVED** | gesamt = `COUNT(Orders)` for user; monatlich = `SUM(PriceCents)` for current calendar month; Offen = count/sum of the user's `Open` `Debt`s; Streak = consecutive Döner-weeks the user participated in (see below). |
| Leaderboard ("Bestenliste", per year) | **DERIVED** | `GROUP BY UserId, COUNT(*)` over `Orders` in the given year, `ORDER BY count DESC`; medals top-3; current user highlighted; "Nur noch X bis Platz N" = diff to the next-higher count. |
| Streak | **DERIVED** | Count of consecutive ISO-weeks (ending this week) in which the user has at least one Order. No stored counter. |
| Avatar initials / first name | **DERIVED** from `DisplayName` (mock `initialsOf`). |
| Notification push text | **DERIVED** from `OrderDay.Synonym` via the template. Synonym is stored; the rendered sentence is not. |
| Debt / open payments | **STORED** (`Debt`) | Has an off-platform settlement lifecycle → cannot be derived. |

---

### Enums / value objects (Core/Enums)

| Type | Values | Storage |
|---|---|---|
| `ProductKind` | `Doener=1`, `Pizza=2` | INTEGER. On `MenuItem` and (frozen copy) `Order`. |
| `MeatType` | `Kalb=1`, `Haehnchen=2` | INTEGER, nullable on Order. |
| `PizzaVariant` | `Salami=1`, `Margherita=2`, `Funghi=3`, `Tonno=4`, `Hawaii=5` | INTEGER, nullable on Order. |
| `Sauce` (**[Flags]**) | `None=0`, `Kraeuter=1`, `Knoblauch=2`, `Scharf=4` | INTEGER. |
| `OrderDayStatus` | `Open=1`, `Closed=2` | INTEGER. |
| `PaymentStatus` | `Open=1`, `Settled=2`, `Cancelled=3` | INTEGER. |
| `UserRole` | `Employee=1`, `Admin=2` | INTEGER. |

**Sauces (multi-select) — recommendation: a `[Flags]` int column.** Only three sauces, fixed forever, always queried as "does this order contain X" — a flags int makes the tier math (`(o.Sauces & Sauce.Knoblauch) != 0`, `popcount >= 3` for `allThree`) trivial and index-free, with no join. A child table is over-engineering for a closed 3-element set; a serialized JSON/CSV column is queryable on SQLite but loses type safety and clean predicates. Map with `HasConversion<int>()`. Use explicit numeric backing values so reordering the enum never silently rewrites stored data.

> Enums are persisted as INTEGER with explicit values. Never reorder/renumber after the first migration — values are now data.

---

### Money on SQLite — recommendation: **integer cents (`int`)**

SQLite has no native `decimal`; EF maps `decimal` to TEXT or REAL and REAL is lossy. Store all money as **`int` cents** (`PriceCents`, `DefaultPriceCents`, `AmountCents`). Rationale: exact arithmetic, sortable/summable in SQL for the monthly-spend stat and debt totals, no rounding drift. Conversions at the boundaries:
- German display: cents → `8,50 €` in the Application/UI layer.
- PayPal amount: cents → dot-decimal string `8.50` for `https://paypal.me/{handle}/8.50EUR` (build in a service; never store the URL).

This keeps the DB free of any decimal/converter ambiguity and guarantees the price the user edits is the exact price PayPal receives.

---

### DateTime on SQLite

SQLite has no native date type; EF stores `DateTimeOffset`/`DateTime` as ISO-8601 TEXT.
- All instants (`CreatedAt`, `OpenedAt`, `OrderCutoffAt`, `ExpiresAt`, `SettledAt`) are **`DateTimeOffset` in UTC**. Use `DateTimeOffset` (not `DateTime`) so offset is unambiguous on round-trip; inject a clock abstraction (e.g. `TimeProvider`) so tests are deterministic.
- `OrderDay.Date` is a **`DateOnly`** for the "one day = one OrderDay" unique constraint and clean equality (`EF.Functions` not needed). Map `DateOnly` → TEXT (`yyyy-MM-dd`). The business "today" is the local Bremen day; compute the day boundary in the Application layer from local time, then anchor everything else to UTC instants.
- **Bestellschluss** = `OrderDay.OrderCutoffAt` (UTC `DateTimeOffset`). The cutoff time-of-day default (11:30 local) is config; the stored value is the resolved absolute instant for that day. Ordering past it is rejected; a background/auto-close (open product gap) flips `Status` to `Closed`.

---

### Provider switch: Npgsql → Microsoft.EntityFrameworkCore.Sqlite

Concrete edits:

1. **`server/Directory.Packages.props`** — remove `Npgsql.EntityFrameworkCore.PostgreSQL`; add `<PackageVersion Include="Microsoft.EntityFrameworkCore.Sqlite" Version="9.0.17" />` (match the pinned EF 9.0.17). Keep `Microsoft.EntityFrameworkCore` + `.Design`. Add `Konscious.Security.Cryptography.Argon2` (Argon2id) for the password-hash service (Infrastructure).
2. **`Infrastructure/Schulz.DoenerControl.Infrastructure.csproj`** — replace `<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" />` with `<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" />`.
3. **`Infrastructure/DependencyInjection.cs`** — `options.UseNpgsql(...)` → `options.UseSqlite(configuration.GetConnectionString("AppDb"))`.
4. **`Infrastructure/Persistence/AppDbContextFactory.cs`** — `DesignTimeConnectionString` → `"Data Source=doenercontrol.db"`; `optionsBuilder.UseNpgsql(...)` → `UseSqlite(...)`.
5. **`Api/appsettings.json` + `appsettings.Development.json`** — `ConnectionStrings:AppDb` → `"Data Source=doenercontrol.db"` (a file path; relative resolves to the Api content root).
6. **Migrations** — delete any Npgsql-generated migration (none exist yet) and generate the first SQLite migration after entities/configs land: `dotnet ef migrations add InitialCreate -p ...Infrastructure -s ...Api`. `Program.cs` needs no provider change.

> Pepper/JWT secret live in configuration (user-secrets in dev, env in prod) — `Auth:PasswordPepper`, `Auth:JwtSigningKey`, `Auth:OrderCutoffLocalTime`. Never in the DB, never in `appsettings.json` committed to git.

---

### Migration + Seed strategy

- **Single `InitialCreate` migration** creating all tables, indexes, FKs. Integration tests apply real migrations to a fresh temp-file SQLite DB per test/collection (session decision #3), then seed — no `EnsureCreated`, so the migration itself is exercised.
- **Static reference seed (`HasData` in configurations):** the 6 `MenuItem` rows (ids/prices/icons/notes/insider/sort exactly from the mock `MENU`). Deterministic, ships in the migration. (Note: `HasData` requires hardcoded keys — fine here since MenuItem ids are stable strings.)
- **The 13 employees:** seed via an idempotent **seeder run at startup / a provisioning admin tool**, not `HasData` (passwords need runtime Argon2id hashing + per-user salt + the configured pepper, which `HasData` cannot do). Seed `DisplayName`, `Username`, `AvatarColorHex`, a generated initial password with `MustChangePassword=true`, `Role`, and PayPal handles for the known users (`LukasBrandtHB`, `SaraYHB`, …). Markus Wagner (`m.wagner`) is the demo "Chef".
- **Optional dev history seed (behind a Development guard):** generate ~3 months of `OrderDay` + `Order` rows so tiers, stats, leaderboard, and streak render with realistic non-empty data. Reproduce Markus's exact 12-order `MY_HISTORY` so his computed tier matches the mock (🐺 Der Knoblauch-Wolf), giving a known fixture for the tier integration test. Never seed history in test/prod environments — tests build their own minimal fixtures.

---

### Concurrency / uniqueness constraints

| Rule | Implementation |
|---|---|
| One Order per user per day | Composite **unique index** on `Order(OrderDayId, UserId)`. Add/edit = upsert; a duplicate insert hits the constraint → map to `Result.Conflict()`. |
| One OrderDay per calendar day | **Unique index** on `OrderDay(Date)`. Two simultaneous "open day" presses → the loser's insert fails on the unique index → return the existing open day instead of erroring. |
| RefreshToken uniqueness | Unique index on `RefreshToken.TokenHash`. |
| Username uniqueness | Unique index on `User.Username`. |
| Cutoff race (order vs. close) | App-level check `OrderDay.Status == Open && now <= OrderCutoffAt` inside the mutation; rely on the unique-order index + a re-read for the narrow race. SQLite is single-writer (serialized writes), so write-write races resolve at the file lock — no optimistic-concurrency token needed for v1; add a `rowversion`-style `xmin` equivalent only if contention appears (it won't for 13 users). |
| Multiple-cascade-path (SQLite limitation) | `Debt`'s two `User` FKs and `Order`'s `User`/`OrderDay` FKs configured `OnDelete(Restrict)`/`NoAction` to avoid EF's "multiple cascade paths" failure; users are deactivated (`IsActive=false`), not hard-deleted. |

---

## Security & authentication

## Security & Auth Architecture

End-to-end design for secure login + authorization for Schulz Doener Control. Grounded in the existing scaffold (FastEndpoints 8.1, EF Core, Clean Architecture, `Result<T>`) and the session decisions (Argon2id + pepper, JWT-in-cookie + rotating refresh, real-SQLite integration tests). Every rule in `backend-work` applies to the code this produces.

### TL;DR of the decisions

| Concern | Decision |
|---|---|
| Password hashing | **Argon2id** via `Konscious.Security.Cryptography.Argon2`. Per-user 16-byte random salt, 32-byte hash. Params: memory 19 MiB, iterations 2, parallelism 1 (OWASP minimum), stored as PHC-style string. |
| Pepper | Configurable server-side secret, **applied as the Argon2id `KnownSecret`** (the keyed-hash "secret" input), bound via `IOptions`, validated non-empty at startup, never in DB. This IS the user's "configurable encryption key". |
| Passwords decryptable? | **No.** Hash-only, one-way. Pepper does not make them reversible. |
| Access token | JWT, ~15 min, signed (HMAC-SHA256 via configured signing key), delivered in `Secure; HttpOnly; SameSite=Strict` cookie. |
| Refresh token | Opaque 32-byte random, stored **hashed (SHA-256)** in a `RefreshTokens` table, rotated on every use, family-revoked on reuse, ~14 days. Delivered in its own httpOnly cookie scoped to the refresh path. |
| CSRF | Double-submit token (non-httpOnly XSRF cookie + `X-XSRF-TOKEN` header), in addition to SameSite=Strict. Required on all state-changing requests. |
| Endpoint security | Secured-by-default (FastEndpoints behavior). Only `Login` and `Refresh` carry `AllowAnonymous()`. |
| Roles | `employee` (everyone) + `admin` (provisioning). v1 admin is seed-only unless an admin UI is confirmed. |
| Brute force | Per-account lockout (5 fails → 15 min) + FastEndpoints `Throttle()` per-IP on login. |

---

### 1. Password hashing — Argon2id

**Library:** `Konscious.Security.Cryptography.Argon2` (added to `Directory.Packages.props`). It is the most widely used pure-.NET Argon2 implementation, supports Argon2id specifically, and exposes the `KnownSecret` (pepper) input — which `Isopoh.Cryptography.Argon2` also does, but Konscious has the cleaner keyed-hash API. Pick Konscious.

**Parameters (production, OWASP "second" recommended profile for Argon2id):**

| Param | Value | Rationale |
|---|---|---|
| `MemorySize` | 19456 (19 MiB) | OWASP min for Argon2id; comfortable on a small server for 13 users. |
| `Iterations` | 2 | OWASP min at that memory. |
| `DegreeOfParallelism` | 1 | Single lane; deterministic, avoids thread contention. |
| Salt length | 16 bytes | From `RandomNumberGenerator.GetBytes(16)`, **per user**, regenerated on every password set. |
| Hash length | 32 bytes | Standard. |

These live in a `PasswordHashingOptions` record bound from config so they can be tuned without a recompile (and so tests can use a deliberately weak profile — see §11).

**Storage format (PHC string in `Users.PasswordHash`):**
```
$argon2id$v=19$m=19456,t=2,p=1$<base64-salt>$<base64-hash>
```
Encoding the salt + params alongside the hash means the verifier is self-describing and we can raise parameters later (verify with the stored params, then re-hash with current params on successful login if they differ — opportunistic upgrade).

**The PEPPER (`KnownSecret`):**
- A high-entropy secret (≥32 random bytes, base64) loaded into `PasswordHashingOptions.Pepper` from configuration — env var `DOENER_AUTH__PEPPER` / `Auth:Pepper` — **never** in `appsettings.json` committed to git, **never** stored in the DB.
- Applied as the Argon2id **`KnownSecret`** input: `new Argon2id(passwordBytes) { Salt = salt, KnownSecret = pepperBytes, MemorySize=…, Iterations=…, DegreeOfParallelism=… }`. This keys the hash function itself, so a DB-only breach (hashes + salts, pepper absent) cannot be cracked offline at all — the attacker is missing a function input, not just doing a slower dictionary attack.
- Why `KnownSecret` rather than `HMAC-SHA256(password, pepper)` fed into Argon2: both are valid, but `KnownSecret` is the purpose-built Argon2 "secret" parameter (RFC 9106 §3.1 `K`), avoids an extra construction we'd have to get exactly right, and keeps a single, auditable hashing call. (HMAC-pre-hash is the fallback if we ever switch to a hasher that lacks a secret input.)
- **Startup validation:** `PasswordHashingOptions` uses `.ValidateDataAnnotations().ValidateOnStart()`; the validator fails fast if `Pepper` is null/empty/whitespace or shorter than the minimum length. The app refuses to boot without a real pepper.

**Pepper rotation:** the pepper is global, so rotating it invalidates every hash at once (the old `KnownSecret` is gone). Plan for it with a `PepperVersion` byte stored per user and a small ordered set of peppers in config (`current` + `previous[]`); verify against the user's recorded version, and on successful login re-hash with the current pepper + bump the version. Without this column a rotation = forced reset for all users (acceptable fallback for 13 people, but the column is cheap insurance — recommend including it from day one).

**Mapping the user's phrase:** the user asked for a "configurable encryption key for the encrypted password." Stated plainly for the record: **passwords are not encrypted and cannot be decrypted.** They are one-way Argon2id hashes. The "configurable encryption key" is realized as the **configurable pepper** (`KnownSecret`) — a secret known only to the server that is mixed into every hash, so leaked hashes are uncrackable without it.

---

### 2. Domain & persistence (Core entities, Infrastructure config)

New EF entities (Core; configured + used in Infrastructure only — never cross the service boundary):

- **`User`**: `Id` (Guid), `Username` (unique, lowercased, e.g. `m.wagner`), `DisplayName`, `PasswordHash` (PHC string), `PepperVersion`, `PayPalHandle` (nullable), `Roles` (e.g. `"employee"` / `"employee,admin"`), `MustChangePassword` (bool), `FailedLoginCount`, `LockoutEndsUtc` (nullable), `CreatedUtc`. Unique index on `Username`.
- **`RefreshToken`**: `Id`, `UserId` (FK), `TokenHash` (SHA-256 of the opaque token, base64 — **the raw token is never stored**), `FamilyId` (Guid, groups a rotation chain), `ExpiresUtc`, `CreatedUtc`, `RevokedUtc` (nullable), `ReplacedByTokenHash` (nullable). Index on `TokenHash` and on `(UserId, FamilyId)`.

Navigation props nullable, not virtual, per `backend-work`. Two `IEntityTypeConfiguration<>` files. SQLite stores `Guid` as TEXT and `DateTimeOffset` as TEXT — fine; just be consistent and store UTC.

---

### 3. Login flow

`POST /api/auth/login` — `AllowAnonymous()`, `Throttle(hitLimit: 10, durationSeconds: 60)`.

1. Request `{ username, password }`. Validator: both non-empty, username max length, trimmed/lowercased.
2. `IAuthService.LoginAsync(LoginCommand, ct)` → `Result<AuthenticatedUserDetails>`:
   - Load user by username. **If not found, still run a dummy Argon2id verify** against a constant fake hash to keep timing constant (no user-enumeration via response time).
   - If `LockoutEndsUtc > now` → `Result.Validation("…")` mapped to a generic "Anmeldung fehlgeschlagen" (don't reveal lockout vs bad-password to the client; log the distinction server-side).
   - Verify password: re-hash supplied password with stored salt+params+pepper, constant-time compare. On failure: increment `FailedLoginCount`; at 5 set `LockoutEndsUtc = now + 15 min`; return generic failure.
   - On success: reset `FailedLoginCount`/lockout; if stored params or pepper version are stale, re-hash and persist (opportunistic upgrade).
3. Endpoint issues tokens (§4–5), sets cookies (§6), and returns a small `LoginResponse` body: `{ displayName, mustChangePassword, payPalHandleSet }` — **no token in the body** (it's in the cookie). The SPA uses `mustChangePassword` to route to a forced-change screen.

Note: this is `Result.Validation` for bad creds rather than a 401 in the service layer; the endpoint maps a failed login to **HTTP 401** explicitly (don't leak which factor failed). All genuinely-unauthenticated access to *protected* endpoints is 401 from the auth middleware automatically.

---

### 4. Access token (JWT)

- Created with FastEndpoints `JwtBearer.CreateToken` (HMAC-SHA256, signing key from `Auth:JwtSigningKey` config, ≥32 bytes, validated at startup).
- **Lifetime ~15 min.**
- **Claims:** `sub` = user Id (Guid), `name` = username, `display_name`, `role` (employee / admin), `token_version` (an int on the user, bumped to force-invalidate all existing access tokens, e.g. after password change). Keep it minimal — no PayPal handle or PII beyond display name.
- Standard validation: issuer, audience (both from config), lifetime, signature; **`ClockSkew = TimeSpan.FromSeconds(30)`** (default 5 min is too lax for 15-min tokens).

---

### 5. Refresh token (rotation + reuse detection)

- **Opaque**, not a JWT: `RandomNumberGenerator.GetBytes(32)` → base64url. Only its **SHA-256 hash** is persisted (`RefreshToken.TokenHash`). The raw value lives only in the cookie.
- **~14 days** validity (confirm; see open questions — internal weekly-use app argues for longer).
- **Rotation:** every call to refresh consumes the presented token (sets `RevokedUtc`, `ReplacedByTokenHash`) and issues a brand-new refresh token in the **same `FamilyId`**.
- **Reuse detection:** if a refresh token that is already `Revoked` is presented again, that means a stolen/replayed token → **revoke the entire family** (all tokens with that `FamilyId`) and force re-login. This must be hand-written and explicitly tested; FastEndpoints' `RefreshTokenService` gives the persistence hooks but not the family-revocation policy.

**Implementation choice:** rather than FastEndpoints' built-in `RefreshTokenService<>` endpoint (which couples token shape to its `TokenRequest/TokenResponse` and expects the token in the body), implement a plain `POST /api/auth/refresh` endpoint backed by `IAuthService.RefreshAsync(rawRefreshToken, ct)`. This keeps tokens in httpOnly cookies (not request/response bodies), keeps the layering clean (`Result<T>` from the service, manual mapping), and keeps reuse-detection in our own tested code. `AllowAnonymous()` + `Throttle(hitLimit: 20, durationSeconds: 60)`.

---

### 6. Cookie design + how the SPA sends it

Three cookies, all set by the server:

| Cookie | Contents | HttpOnly | Secure | SameSite | Path |
|---|---|---|---|---|---|
| `dc_access` | access JWT | yes | yes | Strict | `/` |
| `dc_refresh` | opaque refresh token | yes | yes | Strict | `/api/auth` |
| `dc_xsrf` | random CSRF token | **no** | yes | Strict | `/` |

- `Secure` always (prod is HTTPS). In local dev over http, gate `Secure` behind environment so dev still works; never disable HttpOnly/SameSite.
- `SameSite=Strict` is the recommendation **for a same-origin SPA+API deployment** (one origin / one reverse proxy). It is the strongest CSRF mitigation and the app has no legitimate cross-site GET that needs the cookie. If the API and web app end up on different origins, downgrade to `Lax` + enable CORS `AllowCredentials` with an explicit origin allow-list (see open questions — topology must be pinned).
- **SPA sends it** by issuing all API calls with `credentials: 'include'` (configure once on the TanStack Query / fetch wrapper). The browser attaches the httpOnly cookies automatically; JS never sees the JWT.
- **FastEndpoints reads the JWT from the cookie**, not the Authorization header: register JWT bearer and add a `JwtBearerEvents.OnMessageReceived` that copies `context.Request.Cookies["dc_access"]` into `context.Token`. (Default FE behavior only reads the `Authorization` header, so this wiring is mandatory — and the integration test must prove a cookie-only request authenticates.)

**CSRF strategy — recommendation: double-submit token in addition to SameSite=Strict.** SameSite=Strict already blocks classic CSRF, but defense-in-depth is cheap: on login the server sets the non-httpOnly `dc_xsrf` cookie; the SPA reads it and echoes it in an `X-XSRF-TOKEN` header on every mutating request; a small FastEndpoints pre-processor (global, applied to non-GET, non-anonymous endpoints) compares header vs cookie and rejects mismatches with 403. This protects even if a future deployment is forced to `Lax`.

---

### 7. FastEndpoints configuration (Program.cs)

```
builder.Services
   .AddAuthenticationJwtBearer(s =>
   {
       s.SigningKey = cfg["Auth:JwtSigningKey"];
       s.BearerEvents = new JwtBearerEvents { OnMessageReceived = ctx => { ctx.Token = ctx.Request.Cookies["dc_access"]; return Task.CompletedTask; } };
       // + ValidIssuer/ValidAudience, ClockSkew 30s
   })
   .AddAuthorization()
   .AddFastEndpoints();
```
- **Secured by default:** FastEndpoints requires authentication on every endpoint unless it calls `AllowAnonymous()`. We do NOT need a global "require auth" filter — it is the default. We only annotate `Login` and `Refresh` with `AllowAnonymous()`. (The existing `GetHealth` already uses `AllowAnonymous()` — keep it, or move it behind auth if health must be private; recommend leaving it anonymous for liveness probes.)
- **Pipeline order:** `app.UseAuthentication().UseAuthorization().UseFastEndpoints();`
- **Roles/policies:** use `Roles("admin")` on provisioning endpoints; everything else just requires authentication (any logged-in employee). If finer control is wanted later, add named policies, but for 13 employees role-on-endpoint is sufficient.
- **Reading the current user** inside endpoints/services: `User.ClaimValue("sub")` (or the FE `User` claims principal) for the Guid; do NOT trust any user id from the request body. Wrap it in a tiny `ICurrentUser` accessor (registered scoped, reads `IHttpContextAccessor`) so the Application layer gets the caller identity without touching `HttpContext` directly — keeps services framework-agnostic and easy to fake in unit tests.

---

### 8. Logout & token-change endpoints

- `POST /api/auth/logout` (authenticated): revoke the presented refresh token's **entire family**, bump the user's `token_version` (invalidates outstanding access JWTs early), and clear all three cookies (set expired). Returns 204.
- `POST /api/auth/change-password` (authenticated; the only endpoint reachable when `MustChangePassword` is true — enforce via a pre-processor/policy that 403s every other endpoint until the flag clears): verify current password, set new hash with current params+pepper, clear `MustChangePassword`, bump `token_version`, revoke all refresh families (force re-login on other devices). 
- **Forced-change gate:** a global pre-processor checks the `must_change_password` claim (or re-reads the flag) and short-circuits to 403 on everything except change-password + logout.

---

### 9. Account provisioning

- **v1: seed-based** (no admin UI in the mock). An idempotent `DbSeeder` (run on startup in non-prod, or via a one-shot CLI/`dotnet run -- seed`) creates the ~13 `User` rows with `m.wagner`-style usernames, `MustChangePassword = true`, and a **per-user generated random temp password** (12+ chars, printed once to the seeding console / handed out by the admin). PayPal handles seeded if known, else null and captured on first profile edit.
- **Admin role** exists in the schema and on the (future) `POST /api/users` + `PUT /api/users/{id}` endpoints (`Roles("admin")`) for when an in-app provisioning screen is built. Until confirmed, those endpoints can be omitted and provisioning stays seed-only.
- **Initial password handling — recommended:** generated temp password + forced change on first login (the `MustChangePassword` gate). This avoids the admin ever knowing the user's lasting password.

---

### 10. Brute-force, lockout, rate-limiting

- **Per-account lockout:** `FailedLoginCount` → at 5 consecutive failures set `LockoutEndsUtc = now + 15 min`; reset on success. Return a generic failure either way (no lockout disclosure to the client). Note the SQLite concurrency caveat in Risks — for 13 users a non-atomic counter is acceptable; if hardened, use a conditional `UPDATE`.
- **Per-IP throttle:** FastEndpoints `Throttle(hitLimit, durationSeconds, headerName: "X-Forwarded-For")` on `login` (10/min) and `refresh` (20/min). Behind a reverse proxy, ensure `ForwardedHeaders` middleware is configured so the real client IP (not the proxy) is throttled.
- **Generic timing:** dummy-verify on unknown usernames (§3) defeats user enumeration.

---

### 11. Integration testing (real SQLite, TDD red-green)

Per the session rules and `backend-work`: every endpoint is built test-first against a **real SQLite DB** via `WebApplicationFactory`/`AppFixture<Program>` + `FastEndpoints.Testing` (already the pattern in `DoenerControlApp` / `GetHealthTests`). Switch the existing `AddInfrastructure` from Npgsql to `UseSqlite`, and the test fixture points at a **fresh temp-file SQLite DB per collection**, applies real EF migrations, and seeds known users.

Required first-failing tests (one file per endpoint, `Should_X_When_Y`):
- `LoginTests`: success sets cookies + returns displayName; wrong password → 401; unknown user → 401; locked account after 5 fails; `mustChangePassword` surfaced.
- `RefreshTests`: valid refresh rotates token (old hash revoked, new cookie set); **reused/revoked token → family revoked + 401** (the security-critical one); expired → 401.
- `LogoutTests`: clears cookies, revokes family, subsequent refresh fails.
- `ChangePasswordTests`: wrong current → 401; success clears flag, invalidates old access token (token_version bump), can log in with new password / cannot with old.
- **Auth-gate test:** a protected sample endpoint returns 401 with no cookie, and **200 when ONLY the `dc_access` cookie is present (no Authorization header)** — this proves the cookie→token wiring (§6) actually works.
- **CSRF test:** a mutating request without/with-wrong `X-XSRF-TOKEN` → 403; matching → passes.

**Test performance:** bind a deliberately weak `PasswordHashingOptions` in the test host (memory 8 MiB, iterations 1) so real Argon2id runs (not mocked) but the red-green loop stays fast; production config carries the §1 hardened values. Never assert against mocked repositories — exercise the real DB and real hashing path.

---

### 12. Packages to add (Central Package Management)

Add to `Directory.Packages.props`:
- `Konscious.Security.Cryptography.Argon2` (latest 1.3.x)
- `Microsoft.EntityFrameworkCore.Sqlite` (9.0.17, replacing the Npgsql dependency project-wide — this is the mandated provider switch)
- FastEndpoints security comes in the existing `FastEndpoints` 8.1 package (`FastEndpoints.Security` namespace) + `Microsoft.AspNetCore.Authentication.JwtBearer` (matched to net9.0) for `JwtBearerEvents`.

The Npgsql `PackageVersion` and `UseNpgsql` call in `Infrastructure/DependencyInjection.cs` + the `AppDbContextFactory` design-time connection string must be migrated to SQLite as part of this work (coordinate with the persistence/infra agent so the switch happens once).

---

## Backend API

## Backend HTTP API — FastEndpoints REPR plan

The complete vertical-slice HTTP surface for Schulz Döner Control, grounded in the agreed Data-Model + Security foundations, the `backend-work` skill (REPR, one file per endpoint, three non-leaking type layers, `Result<T>`, `Send.*`, explicit `ct`, validator on every request-bearing endpoint), and the mock's exact logic (`computeTier`, `MENU`, `TIER_CATALOG`, PayPal.Me link shape, synonym push, leaderboard, stats).

### Cross-cutting conventions (apply to every slice below)

- **Route base** `/api`. All endpoints **secured by default** (FastEndpoints behaviour). Only `Login` and `Refresh` carry `AllowAnonymous()`. `GetHealth` stays anonymous.
- **Auth read inside endpoints**: never trust a user id from a request body. Resolve the caller via a scoped `ICurrentUser` (wraps `IHttpContextAccessor`, reads `sub`/`role` claims) so Application services stay framework-agnostic. The Application `*Command`/`*Query` carry an explicit `CallerUserId` (Guid) set by the endpoint from `ICurrentUser` — endpoints map it in, services never touch `HttpContext`.
- **Type layers** (never leak): Endpoint owns `XxxRequest` / `XxxResponse` / `XxxDataDto`; Application owns `XxxCommand` / `XxxQuery` / `XxxDetails` / `XxxSummaryDto`; Core owns entities (Infrastructure-only).
- **Result→HTTP mapping** (a tiny shared `ResultExtensions` helper, NOT a leaked type): `Success`→200/201/204; `NotFound`→404 (`Send.NotFoundAsync`); `Conflict`→409; `Validation`→400 (`Send.ErrorsAsync`) — **except** `Login`/`Refresh`/`ChangePassword` which deliberately map every auth failure to **401** to avoid leaking which factor failed.
- **Mutations require CSRF** (double-submit `X-XSRF-TOKEN` header vs `dc_xsrf` cookie, enforced by a global pre-processor on non-GET non-anonymous endpoints) on top of `SameSite=Strict` cookies + cookie-borne JWT (read via `JwtBearerEvents.OnMessageReceived`).
- **Clock**: services take `TimeProvider`; "today" = local Bremen business day resolved in Application, anchored to UTC instants.
- **Money**: services work in `int` cents; endpoints expose **both** a cents int (`amountCents`) and a German display string (`amountLabel` = `8,50 €`) where the UI renders money, and the PayPal link (`paypalUrl`) is built server-side as `https://paypal.me/{handle}/8.50EUR` (dot decimal). The frontend never builds the link itself.
- **Forced-change gate**: a global pre-processor 403s every authenticated endpoint except `ChangePassword` and `Logout` while the caller's `must_change_password` claim is set.

---

### ENDPOINT INVENTORY

| # | Verb | Route | Auth | Request | Response | Service method (→ `Result<T>`) |
|---|------|-------|------|---------|----------|-------------------------------|
| **Auth** |||||||
| 1 | POST | `/api/auth/login` | Anonymous + `Throttle(10,60)` | `LoginRequest` | `LoginResponse` | `IAuthService.LoginAsync(LoginCommand, ct)` → `AuthenticatedUserDetails` |
| 2 | POST | `/api/auth/refresh` | Anonymous + `Throttle(20,60)` | none (cookie) `EndpointWithoutRequest` | `RefreshResponse` | `IAuthService.RefreshAsync(string rawToken, ct)` → `AuthenticatedUserDetails` |
| 3 | POST | `/api/auth/logout` | Authenticated | none `EndpointWithoutRequest` | 204 | `IAuthService.LogoutAsync(LogoutCommand, ct)` → `Result` |
| 4 | POST | `/api/auth/change-password` | Authenticated (reachable while MustChange) | `ChangePasswordRequest` | 204 | `IAuthService.ChangePasswordAsync(ChangePasswordCommand, ct)` → `Result` |
| 5 | GET | `/api/auth/me` | Authenticated | none `EndpointWithoutRequest` | `GetMeResponse` | `IUserService.GetMeAsync(Guid callerId, ct)` → `CurrentUserDetails` |
| **Profile** |||||||
| 6 | PUT | `/api/profile/paypal-handle` | Authenticated | `PutPayPalHandleRequest` | `PutPayPalHandleResponse` | `IProfileService.UpdatePayPalHandleAsync(UpdatePayPalHandleCommand, ct)` → `ProfileDetails` |
| **Menu** |||||||
| 7 | GET | `/api/menu` | Authenticated | none `EndpointWithoutRequest` | `GetMenuResponse` (list of `MenuItemSummaryDto`) | `IMenuService.GetMenuAsync(ct)` → `IReadOnlyList<MenuItemSummary>` |
| **OrderDay** |||||||
| 8 | GET | `/api/order-days/today` | Authenticated | none `EndpointWithoutRequest` | `GetTodayOrderDayResponse` | `IOrderDayService.GetTodayAsync(Guid callerId, ct)` → `OrderDayDetails?` |
| 9 | POST | `/api/order-days/open` | Authenticated | none `EndpointWithoutRequest` (idempotent) | `OpenDayResponse` | `IOrderDayService.OpenTodayAsync(OpenDayCommand, ct)` → `OrderDayDetails` |
| 10 | POST | `/api/order-days/{id}/close` | Authenticated | `CloseDayRequest` (route id) | `CloseDayResponse` | `IOrderDayService.CloseAsync(CloseDayCommand, ct)` → `OrderDayDetails` |
| 11 | GET | `/api/order-days/{id}` | Authenticated | `GetOrderDayByIdRequest` (route id) | `GetOrderDayByIdResponse` | `IOrderDayService.GetByIdAsync(GetOrderDayQuery, ct)` → `OrderDayDetails` |
| **Orders** |||||||
| 12 | PUT | `/api/order-days/{dayId}/orders/mine` | Authenticated | `PutMyOrderRequest` | `PutMyOrderResponse` | `IOrderService.UpsertMineAsync(UpsertOrderCommand, ct)` → `OrderDetails` |
| 13 | GET | `/api/order-days/{dayId}/orders/mine` | Authenticated | `GetMyOrderRequest` (route) | `GetMyOrderResponse` | `IOrderService.GetMineAsync(GetMyOrderQuery, ct)` → `OrderDetails?` |
| 14 | DELETE | `/api/order-days/{dayId}/orders/mine` | Authenticated | `DeleteMyOrderRequest` (route) | 204 | `IOrderService.DeleteMineAsync(DeleteOrderCommand, ct)` → `Result` |
| **Pickup** |||||||
| 15 | POST | `/api/order-days/{dayId}/pickup/claim` | Authenticated | `ClaimPickupRequest` (route) | `ClaimPickupResponse` | `IPickupService.ClaimAsync(ClaimPickupCommand, ct)` → `OrderDetails` |
| 16 | POST | `/api/order-days/{dayId}/pickup/release` | Authenticated | `ReleasePickupRequest` (route) | `ReleasePickupResponse` | `IPickupService.ReleaseAsync(ReleasePickupCommand, ct)` → `OrderDetails` |
| **Payments / Debts** |||||||
| 17 | GET | `/api/debts/mine` | Authenticated | none `EndpointWithoutRequest` | `GetMyDebtsResponse` (list of `DebtSummaryDto` + totals) | `IDebtService.GetOpenForDebtorAsync(Guid callerId, ct)` → `OpenDebtsDetails` |
| 18 | GET | `/api/debts/owed-to-me` | Authenticated | none `EndpointWithoutRequest` | `GetDebtsOwedToMeResponse` | `IDebtService.GetForCreditorAsync(Guid callerId, ct)` → `CreditorDebtsDetails` |
| 19 | POST | `/api/debts/{id}/settle` | Authenticated | `SettleDebtRequest` (route id) | `SettleDebtResponse` | `IDebtService.SettleAsync(SettleDebtCommand, ct)` → `DebtDetails` |
| 20 | POST | `/api/debts` | Authenticated | `PostDebtRequest` | `PostDebtResponse` | `IDebtService.CreateAdHocAsync(CreateAdHocDebtCommand, ct)` → `DebtDetails` |
| **Stats** |||||||
| 21 | GET | `/api/stats/dashboard` | Authenticated | none `EndpointWithoutRequest` | `GetDashboardStatsResponse` | `IStatsService.GetDashboardAsync(Guid callerId, ct)` → `DashboardStatsDetails` |
| **Leaderboard** |||||||
| 22 | GET | `/api/leaderboard` | Authenticated | `GetLeaderboardRequest` (query `year?`) | `GetLeaderboardResponse` (list of `LeaderboardEntrySummaryDto`) | `ILeaderboardService.GetForYearAsync(GetLeaderboardQuery, ct)` → `LeaderboardDetails` |
| **Tiere** |||||||
| 23 | GET | `/api/tiere/mine` | Authenticated | none `EndpointWithoutRequest` | `GetMyTierResponse` | `ITierService.GetMineAsync(Guid callerId, ct)` → `TierDetails` |
| 24 | GET | `/api/tiere` | Authenticated | none `EndpointWithoutRequest` | `GetTierCatalogResponse` (list of `TierCatalogEntrySummaryDto`) | `ITierService.GetCatalogAsync(Guid callerId, ct)` → `TierCatalogDetails` |
| **Notifications** |||||||
| 25 | GET | `/api/notifications` | Authenticated | `GetNotificationsRequest` (query `unreadOnly?`) | `GetNotificationsResponse` (list of `NotificationSummaryDto`) | `INotificationService.GetFeedAsync(GetNotificationsQuery, ct)` → `NotificationFeedDetails` |
| 26 | POST | `/api/notifications/{id}/read` | Authenticated | `MarkNotificationReadRequest` (route id) | 204 | `INotificationService.MarkReadAsync(MarkReadCommand, ct)` → `Result` |
| 27 (opt) | POST | `/api/admin/users` | `Roles("admin")` | `PostUserRequest` | `PostUserResponse` | `IUserAdminService.ProvisionAsync(ProvisionUserCommand, ct)` → `UserDetails` |

> Endpoints 9, 15/16, 19 are **action endpoints** → drop the HTTP prefix (`OpenDay`, `ClaimPickup`, `ReleasePickup`, `SettleDebt`, `Login`, `Refresh`, `Logout`, `ChangePassword`). CRUD-shaped ones keep the `Get/Put/Post/Delete…ById` prefix per the skill.

---

### SLICE: Auth (1–5)

**1 — `Login` · `POST /api/auth/login`**
- *Purpose*: authenticate, set the three cookies, surface routing hints.
- *Request* `LoginRequest`: `string Username`, `string Password`.
- *Validator* `LoginRequestValidator`: `Username` NotEmpty, MaxLength(64), trimmed+lowercased; `Password` NotEmpty, MaxLength(256).
- *Response* `LoginResponse`: `string DisplayName`, `bool MustChangePassword`, `bool PayPalHandleSet` — **no token in body** (cookie-only).
- *Service*: `LoginCommand(string Username, string Password)` → `Result<AuthenticatedUserDetails>` (`UserId`, `Username`, `DisplayName`, `Role`, `MustChangePassword`, `PayPalHandleSet`, `TokenVersion`). Endpoint then mints JWT + refresh, sets cookies (§Security), maps to response.
- *Rules*: load by username; **dummy Argon2id verify on unknown user** (constant timing, no enumeration); lockout check (`LockoutEndsUtc>now` → generic fail); verify with stored salt+params+pepper; on fail bump `FailedLoginCount`, lock at 5 for 15 min; on success reset counters + opportunistic re-hash if params/pepper stale. Bad creds → `Result.Validation` → endpoint maps to **401**.

**2 — `Refresh` · `POST /api/auth/refresh`**
- *Purpose*: rotate refresh token, issue new access+refresh cookies.
- *Request*: none (`EndpointWithoutRequest`) — raw refresh token read from `dc_refresh` cookie inside the endpoint and passed to the service.
- *Validator*: n/a (no request type); endpoint guards the cookie's presence and 401s if absent.
- *Response* `RefreshResponse`: `string DisplayName`, `bool MustChangePassword`.
- *Service*: `RefreshAsync(string rawRefreshToken, ct)` → `Result<AuthenticatedUserDetails>`.
- *Rules (security-critical)*: SHA-256 the raw token, look up by `TokenHash`; if not found/expired → 401; if already revoked → **reuse detected → revoke entire `FamilyId`** → 401; else rotate (set `RevokedUtc`+`ReplacedByTokenHash`, issue new token same family). Hand-written + explicitly tested.

**3 — `Logout` · `POST /api/auth/logout`**
- *Purpose*: revoke refresh family, bump `token_version`, clear cookies.
- *Request*: none. *Validator*: n/a.
- *Response*: 204.
- *Service*: `LogoutCommand(Guid CallerUserId, string? RawRefreshToken)` → `Result`. Revokes the presented token's whole family, bumps `TokenVersion`. Endpoint expires all three cookies.

**4 — `ChangePassword` · `POST /api/auth/change-password`**
- *Purpose*: self-set new password; the only authenticated endpoint allowed while `MustChangePassword`.
- *Request* `ChangePasswordRequest`: `string CurrentPassword`, `string NewPassword`.
- *Validator*: both NotEmpty; `NewPassword` MinLength(10), MaxLength(256), must differ from current, complexity rule (≥1 letter + ≥1 digit).
- *Response*: 204.
- *Service*: `ChangePasswordCommand(Guid CallerUserId, string Current, string New)` → `Result`. Verify current; set new hash (current params+pepper); clear `MustChangePassword`; bump `TokenVersion`; revoke all refresh families (force re-login elsewhere). Wrong current → 401.

**5 — `GetMe` · `GET /api/auth/me`**
- *Purpose*: hydrate the SPA after refresh/reload (greeting name, role, paypal flag, must-change).
- *Request*: none. *Validator*: n/a.
- *Response* `GetMeResponse`: `Guid UserId`, `string DisplayName`, `string FirstName` (derived), `string Initials` (derived `initialsOf`), `string AvatarColorHex`, `string Role`, `bool PayPalHandleSet`, `string? PayPalHandle`, `bool MustChangePassword`.
- *Service*: `GetMeAsync(Guid callerId, ct)` → `Result<CurrentUserDetails>`. `FirstName`/`Initials` derived from `DisplayName` (never stored).

---

### SLICE: Profile (6)

**6 — `PutPayPalHandle` · `PUT /api/profile/paypal-handle`**
- *Purpose*: capture/update the caller's PayPal.Me handle (the product gap — drives every payment link).
- *Request* `PutPayPalHandleRequest`: `string? PayPalHandle` (null clears it).
- *Validator*: when present — MaxLength(40), regex `^[A-Za-z0-9]+$` (PayPal.Me handle charset; no spaces/slashes so the URL stays valid).
- *Response* `PutPayPalHandleResponse`: `string? PayPalHandle`, `bool PayPalHandleSet`.
- *Service*: `UpdatePayPalHandleCommand(Guid CallerUserId, string? Handle)` → `Result<ProfileDetails>`.

---

### SLICE: Menu (7)

**7 — `GetMenu` · `GET /api/menu`**
- *Purpose*: the Order screen product grid (icon, name, price/note, INSIDER badge, sort).
- *Request*: none. *Validator*: n/a.
- *Response* `GetMenuResponse`: `IReadOnlyList<MenuItemSummaryDto>` — `string Id`, `string Name`, `int DefaultPriceCents`, `string DefaultPriceLabel` (`7,50 €`), `string Kind` (`doener`/`pizza`), `string MaterialIcon`, `string? Note`, `bool IsInsider`, `int SortOrder`.
- *Service*: `GetMenuAsync(ct)` → `Result<IReadOnlyList<MenuItemSummary>>`. Reads the 6 seeded `MenuItem` rows ordered by `SortOrder`.
- *Note*: also exposes the static `PIZZAS` / `SAUCES` / `MEAT` choice vocabularies — recommend appending them to this response (`IReadOnlyList<string> PizzaVariants`, `SauceOptions`, `MeatOptions`) so the SPA gets the whole order vocabulary in one call rather than hardcoding enum strings.

---

### SLICE: OrderDay (8–11)

**8 — `GetTodayOrderDay` · `GET /api/order-days/today`**
- *Purpose*: the dashboard's central Döner-Tag section (closed vs open state).
- *Request*: none. *Validator*: n/a.
- *Response* `GetTodayOrderDayResponse`: `bool IsOpen`; when open → `OrderDayDetailsDto` (`Guid Id`, `DateOnly Date`, `string Status`, `string Synonym`, `string PushText` (rendered template), `DateTimeOffset OrderCutoffAt`, `string CutoffLabel` (`11:30 Uhr`), `bool IsPastCutoff`, `int ParticipantCount`, `IReadOnlyList<string> PickupNames`, `IReadOnlyList<OrderRowSummaryDto> Orders`, `bool ICanStillOrder`, `Guid? MyOrderId`). `OrderRowSummaryDto`: `Guid OrderId`, `string PersonName`, `string Initials`, `string AvatarColorHex`, `string ProductLabel` (e.g. `Dürüm Kalb`/`Pizza Salami`), `string Description` (sauces/extra or `ohne Soße`/`Standard`), `int PriceCents`, `string PriceLabel`, `bool IsMine`, `bool IsPickup`.
- *Service*: `GetTodayAsync(Guid callerId, ct)` → `Result<OrderDayDetails?>` (null → IsOpen=false). `PushText` derived from stored `Synonym`; product/description labels assembled server-side mirroring the mock's `productLabel`/`detail` builders.

**9 — `OpenDay` · `POST /api/order-days/open`**
- *Purpose*: the "Ich will heute Döner!" flow.
- *Request*: none (`EndpointWithoutRequest`) — server resolves "today" + cutoff from config.
- *Validator*: n/a.
- *Response* `OpenDayResponse`: `OrderDayDetailsDto` (same shape as #8) + `string PushText`, `int NotifiedColleagueCount`.
- *Service*: `OpenDayCommand(Guid CallerUserId)` → `Result<OrderDayDetails>`.
- *Rules*: pick a **random synonym** server-side; compute `OrderCutoffAt` from `Auth:OrderCutoffLocalTime` (default 11:30 local) for today; insert `OrderDay(Date=today, Status=Open, OpenedByUserId=caller)`; **fire the push** to all OTHER active users (notification slice #25/§Notifications); **idempotent** — if a day already exists for today (unique `Date` index), return the existing open day instead of erroring (handles the simultaneous-press race; loser's insert hits the index → re-read + return existing).

**10 — `CloseDay` · `POST /api/order-days/{id}/close`**
- *Purpose*: finalize a day (manual close; also the auto-close path's underlying op).
- *Request* `CloseDayRequest`: `Guid Id` (route).
- *Validator* `CloseDayRequestValidator`: `Id` NotEmpty (Guid).
- *Response* `CloseDayResponse`: `OrderDayDetailsDto` + `int DebtsCreated`.
- *Service*: `CloseDayCommand(Guid CallerUserId, Guid OrderDayId)` → `Result<OrderDayDetails>`.
- *Rules*: load day; if already `Closed` → `Conflict`; flip `Status=Closed`, set `ClosedAt`; **on close, create `Debt` rows**: for each pickup person, each non-pickup participant owes them their own order price (split decision below). Day not found → `NotFound`.

**11 — `GetOrderDayById` · `GET /api/order-days/{id}`**
- *Purpose*: direct day view / deep link / history.
- *Request* `GetOrderDayByIdRequest`: `Guid Id` (route). *Validator*: `Id` NotEmpty.
- *Response* `GetOrderDayByIdResponse`: `OrderDayDetailsDto` (same shape as #8).
- *Service*: `GetOrderDayQuery(Guid CallerUserId, Guid OrderDayId)` → `Result<OrderDayDetails>`. Not found → `NotFound`.

---

### SLICE: Orders (12–14)

**12 — `PutMyOrder` · `PUT /api/order-days/{dayId}/orders/mine`** (upsert = add OR edit)
- *Purpose*: the Order screen "Bestellung abgeben" + later edits (one order per user per day, edit until cutoff).
- *Request* `PutMyOrderRequest`: `Guid DayId` (route), `string ProductId`, `string? Meat` (`Kalb`/`Haehnchen`), `string? PizzaVariant`, `IReadOnlyList<string> Sauces`, `int PriceCents`, `string? Extra`, `bool IsPickup`.
- *Validator* `PutMyOrderRequestValidator`: `DayId` NotEmpty; `ProductId` NotEmpty; `PriceCents` in 0..100000 (0,01–1000 €); `Extra` MaxLength(300); `Sauces` each ∈ {Kraeuter,Knoblauch,Scharf}, distinct; **cross-field**: `Meat` required & in {Kalb,Haehnchen} when product is döner-kind; `Meat`/`Sauces` must be empty when pizza; `PizzaVariant` required & ∈ {Salami,Margherita,Funghi,Tonno,Hawaii} when pizza, empty otherwise. (Kind looked up against the seeded menu — validator does shape checks; the service is authoritative on kind.)
- *Response* `PutMyOrderResponse`: `OrderDetailsDto` (`Guid Id`, `Guid OrderDayId`, `string ProductId`, `string ProductLabel`, `string Kind`, `string? Meat`, `string? PizzaVariant`, `IReadOnlyList<string> Sauces`, `int PriceCents`, `string PriceLabel`, `string? Extra`, `bool IsPickup`, `string Detail`).
- *Service*: `UpsertOrderCommand(Guid CallerUserId, Guid OrderDayId, string ProductId, MeatType? Meat, PizzaVariant? Pizza, Sauce Sauces, int PriceCents, string? Extra, bool IsPickup)` → `Result<OrderDetails>`.
- *Rules*: day must be `Open` AND `now <= OrderCutoffAt` else `Validation("Bestellschluss vorbei")`/`Conflict`; freeze `Kind` from the menu item at write time; **upsert on composite unique `(OrderDayId,UserId)`** (insert or update existing = add/edit); bump `UpdatedAt` on edit. ProductId not in menu → `NotFound`. Pizza orders force `Meat=null`/`Sauces=None`.

**13 — `GetMyOrder` · `GET /api/order-days/{dayId}/orders/mine`**
- *Purpose*: prefill the Order screen when editing.
- *Request* `GetMyOrderRequest`: `Guid DayId` (route). *Validator*: `DayId` NotEmpty.
- *Response* `GetMyOrderResponse`: `bool HasOrder`, `OrderDetailsDto? Order`.
- *Service*: `GetMyOrderQuery(Guid CallerUserId, Guid OrderDayId)` → `Result<OrderDetails?>`.

**14 — `DeleteMyOrderById` (mine) · `DELETE /api/order-days/{dayId}/orders/mine`**
- *Purpose*: withdraw from the day before cutoff.
- *Request* `DeleteMyOrderRequest`: `Guid DayId` (route). *Validator*: `DayId` NotEmpty.
- *Response*: 204.
- *Service*: `DeleteOrderCommand(Guid CallerUserId, Guid OrderDayId)` → `Result`. Only before cutoff while `Open`; no order → `NotFound`.

---

### SLICE: Pickup (15–16)

**15 — `ClaimPickup` · `POST /api/order-days/{dayId}/pickup/claim`**
- *Purpose*: "Ich hole heute ab 🚗" — designed for **≥1 pickup** (a per-Order `IsPickup` flag, not a single FK on the day).
- *Request* `ClaimPickupRequest`: `Guid DayId` (route). *Validator*: `DayId` NotEmpty.
- *Response* `ClaimPickupResponse`: `OrderDetailsDto` (the caller's order with `IsPickup=true`) + `IReadOnlyList<string> AllPickupNames`.
- *Service*: `ClaimPickupCommand(Guid CallerUserId, Guid OrderDayId)` → `Result<OrderDetails>`.
- *Rules*: caller must already have an order on the day (claim only sets the flag) → else `Validation("Erst bestellen, dann abholen")`; day `Open`; sets `IsPickup=true`. (The Order screen toggle uses #12's `IsPickup`; this standalone endpoint supports toggling from the dashboard after ordering.)

**16 — `ReleasePickup` · `POST /api/order-days/{dayId}/pickup/release`**
- *Purpose*: stop being a pickup.
- *Request* `ReleasePickupRequest`: `Guid DayId` (route). *Validator*: `DayId` NotEmpty.
- *Response* `ReleasePickupResponse`: `OrderDetailsDto` + `IReadOnlyList<string> AllPickupNames`.
- *Service*: `ReleasePickupCommand(Guid CallerUserId, Guid OrderDayId)` → `Result<OrderDetails>`. Sets `IsPickup=false` while `Open`.

---

### SLICE: Payments / Debts (17–20)

**17 — `GetMyDebts` · `GET /api/debts/mine`** (what I owe = "Offene Zahlungen")
- *Purpose*: the dashboard "Offene Zahlungen" card.
- *Request*: none. *Validator*: n/a.
- *Response* `GetMyDebtsResponse`: `int OpenCount`, `int TotalCents`, `string TotalLabel` (`11,50 €`), `IReadOnlyList<DebtSummaryDto>`. `DebtSummaryDto`: `Guid Id`, `string CreditorName`, `string CreditorInitials`, `string CreditorAvatarColorHex`, `string Reason` (`Döner-Tag` / `Ayran-Schulden`), `string? DayLabel` (`letzte Woche` / `Donnerstag`), `int AmountCents`, `string AmountLabel`, `string? PaypalUrl` (null when creditor has no handle → UI renders disabled button), `DateTimeOffset CreatedAt`.
- *Service*: `GetOpenForDebtorAsync(Guid callerId, ct)` → `Result<OpenDebtsDetails>`. Builds `PaypalUrl` = `https://paypal.me/{creditorHandle}/{amountDot}EUR`. Only `Status=Open`.

**18 — `GetDebtsOwedToMe` · `GET /api/debts/owed-to-me`** (what others owe me)
- *Purpose*: the Abholer's "you collect X from N colleagues" view.
- *Request*: none. *Validator*: n/a.
- *Response* `GetDebtsOwedToMeResponse`: `int OpenCount`, `int TotalCents`, `string TotalLabel`, `IReadOnlyList<DebtSummaryDto>` (here `DebtorName`/initials/color instead of creditor).
- *Service*: `GetForCreditorAsync(Guid callerId, ct)` → `Result<CreditorDebtsDetails>`.

**19 — `SettleDebt` · `POST /api/debts/{id}/settle`**
- *Purpose*: mark a debt paid (off-platform PayPal settlement → in-app confirm).
- *Request* `SettleDebtRequest`: `Guid Id` (route). *Validator*: `Id` NotEmpty.
- *Response* `SettleDebtResponse`: `DebtDetailsDto` (`Guid Id`, `string Status`, `DateTimeOffset? SettledAt`, `int AmountCents`).
- *Service*: `SettleDebtCommand(Guid CallerUserId, Guid DebtId)` → `Result<DebtDetails>`.
- *Rules*: caller must be the **debtor OR the creditor** of that debt else `NotFound` (don't leak existence); already `Settled` → `Conflict`; set `Status=Settled`, `SettledAt=now`.

**20 — `PostDebt` · `POST /api/debts`** (ad-hoc debt, e.g. "Ayran-Schulden")
- *Purpose*: create a manual debt not tied to an order (the mock's Sara "Ayran-Schulden").
- *Request* `PostDebtRequest`: `Guid CreditorUserId`, `int AmountCents`, `string Reason`.
- *Validator*: `CreditorUserId` NotEmpty & ≠ caller; `AmountCents` 1..100000; `Reason` NotEmpty MaxLength(80).
- *Response* `PostDebtResponse`: `DebtDetailsDto`.
- *Service*: `CreateAdHocDebtCommand(Guid CallerUserId/*debtor*/, Guid CreditorUserId, int AmountCents, string Reason)` → `Result<DebtDetails>`. `OrderId`/`OrderDayId` null; `Status=Open`. Creditor inactive/unknown → `NotFound`.

---

### SLICE: Stats (21)

**21 — `GetDashboardStats` · `GET /api/stats/dashboard`**
- *Purpose*: the 4 stat cards (Döner gesamt, Diesen Monat €, Offen, Streak).
- *Request*: none. *Validator*: n/a.
- *Response* `GetDashboardStatsResponse`: `int TotalOrders` (`Döner gesamt`), `int MonthSpendCents`, `string MonthSpendLabel` (`312,50 €`), `int OpenPaymentsCount`, `int OpenPaymentsTotalCents`, `string OpenPaymentsTotalLabel`, `int StreakWeeks`.
- *Service*: `GetDashboardAsync(Guid callerId, ct)` → `Result<DashboardStatsDetails>`. All **derived** via SQL over `Orders`/`Debts`: total = `COUNT(Orders WHERE UserId=caller)`; month = `SUM(PriceCents)` current calendar month; open = caller's `Open` debts count+sum; streak = consecutive ISO-weeks (ending current week) with ≥1 order.

---

### SLICE: Leaderboard (22)

**22 — `GetLeaderboard` · `GET /api/leaderboard?year=2026`**
- *Purpose*: the Döner-Bestenliste (medals, current-user highlight, "Nur noch X bis Platz N").
- *Request* `GetLeaderboardRequest`: `int? Year` (query; defaults to current year server-side).
- *Validator* `GetLeaderboardRequestValidator`: when present, `Year` in 2020..2100.
- *Response* `GetLeaderboardResponse`: `int Year`, `IReadOnlyList<LeaderboardEntrySummaryDto>`, `int? DoenerToNextRank` (the "Nur noch X" delta), `int? NextRank`. `LeaderboardEntrySummaryDto`: `int Rank`, `Guid UserId`, `string DisplayName`, `string Initials`, `string AvatarColorHex`, `int Count`, `bool IsMe`, `string? Medal` (`🥇/🥈/🥉` for top 3).
- *Service*: `GetForYearAsync(GetLeaderboardQuery(int Year, Guid CallerUserId), ct)` → `Result<LeaderboardDetails>`. `GROUP BY UserId, COUNT(*)` over `Orders` in the year, `ORDER BY count DESC`; medals top-3; `DoenerToNextRank` = diff to next-higher count above the caller.

---

### SLICE: Tiere (23–24)

**23 — `GetMyTier` · `GET /api/tiere/mine`**
- *Purpose*: the navy Döner-Tier dashboard card.
- *Request*: none. *Validator*: n/a.
- *Response* `GetMyTierResponse`: `string Emoji`, `string Name`, `string Tagline`, `IReadOnlyList<string> Tags`, `int OrderCount` (the "Aus N Bestellungen" number = orders in window).
- *Service*: `GetMineAsync(Guid callerId, ct)` → `Result<TierDetails>`. **Ports `computeTier` exactly** over the caller's `Orders` with `CreatedAt >= now-90d`, priority-ordered, first match wins; inputs `garlic`/`spicy`/`kalbR`/`haehnR`/`noSauce`/`allThree`/product counts/`uniq`/`n`/`meated` computed per the mock; the 15 emoji/name/tagline/tags live as a `static readonly` catalog in code (presentation copy, not DB). `n=0` → fallback tier `🌯 Der solide Döner-Bürger`, `OrderCount=0`.

**24 — `GetTierCatalog` · `GET /api/tiere`**
- *Purpose*: the Döner-Tiere catalog screen (all 15, caller's own badged).
- *Request*: none. *Validator*: n/a.
- *Response* `GetTierCatalogResponse`: `IReadOnlyList<TierCatalogEntrySummaryDto>` — `string Emoji`, `string Name`, `string Tagline`, `bool IsMine`. (Order preserved = priority order.)
- *Service*: `GetCatalogAsync(Guid callerId, ct)` → `Result<TierCatalogDetails>`. Computes the caller's tier once to set `IsMine` on the matching catalog row (mirrors the mock's `mine: t.name === tier.name`).

---

### SLICE: Notifications (25–26)

Design decision for v1: **in-app notification feed** (a `Notification` entity + this feed), not browser Web Push. Rationale below in Open Questions. The "push" the mock shows is the open-day broadcast persisted as feed rows + the navy dashboard toast.

> **Schema addition required** (coordinate with the persistence agent — it is not in the agreed Data-Model yet): a `Notification` entity — `Id` (Guid PK), `RecipientUserId` (FK→User), `OrderDayId` (FK→OrderDay, nullable), `Kind` (enum `DayOpened`=1), `Title`, `Body` (the rendered synonym push text), `CreatedAt`, `ReadAt` (nullable). One row per OTHER active user when a day opens.

**25 — `GetNotifications` · `GET /api/notifications?unreadOnly=true`**
- *Purpose*: the in-app feed + the dashboard "a day opened" toast source.
- *Request* `GetNotificationsRequest`: `bool? UnreadOnly` (query). *Validator*: n/a beyond optional bool (a validator class still present with a no-op/`When` rule per the skill for request-bearing endpoints).
- *Response* `GetNotificationsResponse`: `int UnreadCount`, `IReadOnlyList<NotificationSummaryDto>` — `Guid Id`, `string Kind`, `string Title`, `string Body`, `Guid? OrderDayId`, `DateTimeOffset CreatedAt`, `bool IsRead`.
- *Service*: `GetFeedAsync(GetNotificationsQuery(Guid CallerUserId, bool UnreadOnly), ct)` → `Result<NotificationFeedDetails>`. Newest first.

**26 — `MarkNotificationRead` · `POST /api/notifications/{id}/read`**
- *Purpose*: dismiss/read a feed item (and the toast).
- *Request* `MarkNotificationReadRequest`: `Guid Id` (route). *Validator*: `Id` NotEmpty.
- *Response*: 204.
- *Service*: `MarkReadCommand(Guid CallerUserId, Guid NotificationId)` → `Result`. Recipient must be caller else `NotFound`; sets `ReadAt`.

> **`OpenDay` (#9) emits notifications** via `INotificationService.BroadcastDayOpenedAsync(Guid orderDayId, string pushText, Guid openerId, ct)` called inside the OrderDay service (Application→Application composition, same transaction) — inserts one `Notification` per OTHER active user. `NotifiedColleagueCount` on `OpenDayResponse` = that count (mirrors the mock's "Push an 8 Kollegen").

---

### SLICE: Admin provisioning (27 — optional, schema-ready)

**27 — `PostUser` · `POST /api/admin/users`** · `Roles("admin")`
- *Purpose*: in-app provisioning of the 13 employees (the registration gap). v1 may ship seed-only and omit this; the role + service stay schema-ready.
- *Request* `PostUserRequest`: `string Username`, `string DisplayName`, `string AvatarColorHex`, `string? PayPalHandle`, `string Role`.
- *Validator*: `Username` regex `^[a-z]\.[a-z]+$`-ish / NotEmpty MaxLength(64); `DisplayName` NotEmpty MaxLength(80); `AvatarColorHex` hex regex; `Role` ∈ {employee,admin}; handle as #6.
- *Response* `PostUserResponse`: `Guid UserId`, `string Username`, `string InitialPassword` (generated, returned **once**), `bool MustChangePassword=true`.
- *Service*: `ProvisionUserCommand(...)` → `Result<UserDetails>`. Generates a random temp password, Argon2id-hashes it with per-user salt + pepper, `MustChangePassword=true`. Duplicate username → `Conflict`.

---

### TDD note (drives the build order)

Per session rules + skill, **every endpoint is built test-first against a real temp-file SQLite DB** (`AppFixture<Program>` switched to `UseSqlite`, real migrations applied + seed). One `Should_X_When_Y` test file per endpoint mirroring its name. The security-critical first-failing tests (`Refresh` reuse→family-revoke→401; cookie-only request authenticates with no Authorization header; CSRF mismatch→403; `PutMyOrder` after cutoff→reject; one-order-per-user upsert; `OpenDay` idempotency on double-press; `computeTier` matches the mock for Markus's seeded 12-order history → `🐺 Der Knoblauch-Wolf`) are the highest-value reds to write first.

---

## Frontend architecture

## Frontend Architecture — Schulz Döner Control (React 19 + TS + MUI + TanStack)

Mobile-first PWA. **German-only — no `/$lang/` prefix** (the `frontend-work` i18n route rule is explicitly overridden for this single-locale product; German strings live as plain constants/`copy.ts` per feature, not in a locale switcher). Strict three-layer split per node: **Layout** (slot/shell components, zero logic), **Logic** (custom hooks + one React context per feature/screen, no JSX beyond a Provider), **UI** (presentational `FC<Props>`, no data fetching, no apiClient). React Compiler is on → no `useMemo`/`useCallback`/`memo` anywhere. Named exports + `FC<Props>` everywhere. Default MUI imports, `Stack` over `Box`+flex, theme tokens only.

---

### 1. Route map (TanStack Router, flat, file-based)

The mock is a single `screen` state machine. We translate the 5 states into 5 flat routes. `routeTree.gen.ts` is generated by `@tanstack/router-plugin` (already a dep).

| Route file | URL | Screen | Guard |
|---|---|---|---|
| `routes/__root.tsx` | — | Root shell: `<AppProviders>` (Theme + QueryClient + AuthProvider) + `<Outlet/>` + devtools. Already exists; extend. | — |
| `routes/_auth.tsx` (pathless layout route) | — | **Auth guard.** `beforeLoad` reads session from `AuthContext` via `router.context`; if unauthenticated → `redirect({ to: '/login', search: { redirect: location.href } })`. Renders `<Outlet/>` only. | gate |
| `routes/login.tsx` | `/login` | LOGIN. `beforeLoad`: if already authed → redirect to `/`. | anon |
| `routes/_auth/index.tsx` | `/` | HOME / DASHBOARD | authed |
| `routes/_auth/tiere.tsx` | `/tiere` | DÖNER-TIERE catalog | authed |
| `routes/_auth/order.tsx` | `/order` | ORDER (one order per user per open day) | authed |
| `routes/_auth/erledigt.tsx` | `/erledigt` | SUCCESS | authed |
| `routes/_auth/passwort-aendern.tsx` | `/passwort-aendern` | Forced password change (backend `mustChangePassword` gate) | authed |

**Router context for the guard** (the clean, no-flicker way): `createRouter({ routeTree, context: { auth: undefined!, queryClient } })`; in `main.tsx` wrap with an `<InnerApp>` that reads `useAuth()` and passes it to `<RouterProvider router={router} context={{ auth }} />`. `_auth.beforeLoad` checks `context.auth.status`. This runs the guard before the route renders — no `useEffect` redirect, no flash of protected content.

**order → success flow carries state via TanStack Router `search` params, NOT React state.** The success screen must survive a refresh and back/forward. After `submitOrder` mutation resolves, navigate: `navigate({ to: '/erledigt', search: { orderId } })`. `/erledigt` reads `orderId` from validated search (Zod `validateSearch`) and fetches the finalized order + payment summary via `useOrderResult(orderId)`. This makes success a real, refetchable view of server truth (the mock kept it all in `lastOrder` state — we replace that with `orderId` in the URL + a query). If `orderId` is absent/invalid → redirect to `/`.

`login` keeps an optional `redirect` search param so a deep link that hit the guard returns the user to where they were after login.

---

### 2. Cross-cutting lib (`src/lib/`)

| File | Responsibility |
|---|---|
| `lib/api/apiClient.ts` | Thin `fetch` wrapper. **`credentials: 'include'`** on every call (cookies carry the JWT/refresh per the security design — JS never sees the token). Reads the non-httpOnly `dc_xsrf` cookie and sets the **`X-XSRF-TOKEN`** header on every non-GET. Base URL from `import.meta.env.VITE_API_BASE`. Throws a typed `ApiError { status, problem }` (parses RFC7807 `ProblemDetails`). **Never imported by components** — only by feature `api.ts`. |
| `lib/api/refresh-link.ts` | 401 handler. On a 401 from any non-auth call: call `POST /api/auth/refresh` **once** (single-flight: a module-level in-flight promise dedupes concurrent 401s), then retry the original request. If refresh fails → clear `AuthContext`, `router.navigate({ to: '/login', search:{ redirect } })`. Reuse-detection family-revoke (security design §5) surfaces here as a hard logout. |
| `lib/query-client.ts` | **Exists** — keep `staleTime 60s`, `retry: 1`, `refetchOnWindowFocus:false`. Add a global `QueryCache` `onError` that funnels uncaught 401→ the refresh-link logout, and a `MutationCache` default. |
| `lib/router.ts` | **Exists** — extend `createRouter` with `context: { auth, queryClient }` and `defaultPreload:'intent'` (kept). |
| `lib/format/money.ts` | `formatEur(cents): "8,50 €"` (German display) and `toPayPalAmount(cents): "8.50"` (dot-decimal for the link). Ports the mock `eur()` but **operates on integer cents** (data-model decision). |
| `lib/format/initials.ts` | `initialsOf(displayName): "MW"` and `firstNameOf(displayName)`. Ports mock `initialsOf`/`firstName` split. |
| `lib/paypal/buildPayPalMeUrl.ts` | `({ handle, cents }) => https://paypal.me/{handle}/{toPayPalAmount(cents)}EUR`. Returns `null` if handle missing → buttons render disabled. |
| `lib/format/queryKeys.ts` | Optional root for shared keys; each feature owns its own key object (below). |

**Auth itself is the `auth` feature** (context lives there, §3), but the router context wiring lives in `main.tsx`/`lib/router.ts`.

---

### 3. Feature modules (`src/features/<name>/`)

Each: `index.ts` (barrel — the ONLY external import surface) · `schemas.ts` (Zod, every response validated with `.parse`) · `types.ts` (`z.infer<>` only, plus `...Form` form types) · `api.ts` (TanStack Query hooks + a `camelCase` query-key object) · `components/` (Layout/UI; main components in own folder + `.test.tsx`) · `hooks/` (Logic: `use-*-operations.ts`, mutations wrappers, form hooks) · `*-context.ts` (one per compound group, hook throws outside provider) · `copy.ts` (German strings). **Features never import each other**; routes compose them.

| Feature | api.ts query hooks + keys | Zod boundary schemas | Notable hooks / context |
|---|---|---|---|
| **auth** | `useLogin()` (mutation), `useLogout()`, `useChangePassword()`, `useSession()` (`GET /api/auth/me` → current user). Keys: `authKeys.session`. | `LoginResponseSchema { displayName, mustChangePassword, payPalHandleSet }`, `SessionSchema { id, displayName, role, payPalHandle:null }`, `LoginFormSchema { username, password }`. | `AuthProvider` + `useAuth()` (`auth-context.ts`): holds `status: 'authenticated'|'anonymous'|'loading'`, `user`. Fed to router context. `useLoginForm()` (RHF + zodResolver). |
| **dashboard** | `useDashboard()` → one aggregate call `GET /api/dashboard` (greeting name, stats, tier, leaderboard, today's day summary, open debts) OR composed (`useStats`,`useMyTier`,`useLeaderboard`). Recommend **one `GET /api/dashboard`** to avoid waterfall on a mobile screen. Keys: `dashboardKeys.all`. | `DashboardSchema` composing `StatsSchema { totalDoener, monthCents, openCount, streakWeeks }`, `TierSchema`, `LeaderboardSchema`, `OrderDaySummarySchema`, `OpenDebtsSchema`. | `use-dashboard-data.ts` exposes typed slices to the dashboard context. |
| **order-day** | `useTodayOrderDay()` → `GET /api/order-days/today` (status open/closed, synonym, cutoff, participants, abholer list, notification text). `useOpenDay()` (mutation, `POST /api/order-days`). Keys: `orderDayKeys.today`. | `OrderDaySchema { id, status, synonym, orderCutoffAt, notificationText, participants[], pickups[] }`, `ParticipantSchema { displayName, initials, avatarColorHex, product, desc, priceCents }`. | `use-open-day.ts`: opens day, then **invalidates `dashboardKeys` + `orderDayKeys`** and fires the local push-toast. |
| **order** | `useMenu()` → `GET /api/menu` (6 items, prices, icons, note, insider, sort). `useMyOrder(orderDayId)` → `GET .../my-order` (prefill on edit). `useSubmitOrder()` (mutation, upsert `PUT /api/order-days/{id}/my-order`). Keys: `orderKeys.menu`, `orderKeys.myOrder(dayId)`. | `MenuItemSchema { id, name, defaultPriceCents, kind, materialIcon, note:null, isInsider, sortOrder }`, `OrderResultSchema` (success view), `OrderFormSchema` (below). | `use-order-form.ts` (RHF + zodResolver, default values from menu+existing order), `use-order-config.ts` (derives `meatVisible`/`pizzaVisible` from selected product kind — the mock's `isDoener`/`isPizza`), `use-submit-order.ts`. |
| **success** | reuses `order.useOrderResult(orderId)` → `GET /api/orders/{id}/result` (product label, priceCents, detail, isPickup, abholer{name,initials,color,handle}, collectCents, collectCount, myPayPalUrl). Keys: `orderKeys.result(id)`. | `OrderResultSchema`. | `use-order-result.ts`. No mutation — pure read + PayPal action. |
| **payments** | `useOpenDebts()` → `GET /api/debts/open` (the home "Offene Zahlungen" ledger, cross-day). `useSettleDebt()` (optional mutation `POST /api/debts/{id}/settle`). Keys: `paymentKeys.open`. | `DebtSchema { id, creditorName, creditorInitials, avatarColorHex, reason, amountCents, payPalHandle:null }`. | `use-pay-debt.ts`: builds PayPal URL via lib, `window.open(url,'_blank')`, optimistic settle. |
| **leaderboard** | folded into `dashboard.useDashboard()` (year leaderboard ships in the dashboard payload). Standalone `useLeaderboard(year)` only if a full-screen view is added later. | `LeaderboardSchema { year, rows[], me{rank,count}, untilNext{ count, rank } }`, `LeaderboardRowSchema { rank, displayName, initials, avatarColorHex, count, isMe }`. | — |
| **tiere** | `useTierCatalog()` → `GET /api/tiere` (15 tiers + which is `mine`) OR keep the static `TIER_CATALOG` copy client-side and only fetch `useMyTier()` for the `mine` flag. Recommend **server returns catalog + mine flag** so tier copy stays single-sourced with the backend tier service. Keys: `tiereKeys.catalog`. | `TierCatalogSchema [{ emoji, name, tagline, tags[], isMine }]`, `MyTierSchema { emoji, name, tagline, tags[], orderCount }`. | `use-tier-catalog.ts`. |
| **profile** | `useProfile()`, `useUpdatePayPalHandle()` (capture the PayPal.Me handle — the known product gap). Keys: `profileKeys.me`. | `ProfileSchema`, `PayPalHandleFormSchema { handle }`. | minimal; surfaced from the avatar menu. |

**Shared notification feature (cross-cutting UI state, allowed in context):** `notifications` — `useToast()` context drives the navy `PushToast`. The "day opened" push is, for v1, an **in-app toast** (the mock's `toast` state) surfaced after `useOpenDay` succeeds; real Web Push + service worker is a flagged product gap (see risks), the UI component is identical either way.

---

### 4. Shared design-system UI components (`src/components/`)

These are the reusable Machine-Eye primitives extracted from the mock. They live in `src/components/` (the lib→features→routes flow allows features to consume them). All are **pure UI** (`FC<Props>`), positioning controlled by parent `sx`, all colors/radii from theme tokens.

| Component | Folder | Role | Notes from mock |
|---|---|---|---|
| `RedChromeSurface` | `components/RedChromeSurface/` | **Layout** (slot shell) | The red `#C90023` card with the **Schräge bevel** overlay (`clip-path:polygon(82% 0,100% 0,100% 100%,75% 100%)`, `rgba(0,0,0,.18)`). Slots: `start` (icon box / back button), `children` (title block), `end` (LIVE pill / count). Bevel is a themed pseudo-overlay (`theme.schraege`, §5). Used by Home header, Tiere header, Order header, the open-day sub-header (which uses an inner variant). |
| `Schraege` | inside RedChromeSurface (`internal/`) | UI | The absolutely-positioned bevel div; also reusable on the navy TierCard (`polygon(78% 0,...)`) and open-day sub-header. Exposed via a `clipVariant` prop. |
| `LiveDot` | `components/LiveDot/` | UI | Pulsing dot (`pulseDot` keyframe). Color prop (green `#7CFFA0` on red, success `#2E7D32` on login). Keyframe registered once in theme `GlobalStyles`. |
| `StatCard` | `components/StatCard/` | UI | White card: tinted icon chip + label + value (+ optional unit suffix). Tint/icon-color props (pink/green/orange). Drives the 4 dashboard stats. |
| `Avatar` | `components/Avatar/` | UI | Round initials avatar; `colorHex` + `displayName` → `initialsOf`. Sizes (34/36/38/44/60). Replaces the inline `avatarStyle`. |
| `TierCard` | `components/TierCard/` | UI | Navy surface with Schräge, emoji tile, eyebrow, name, tagline, "Aus N Bestellungen…", tag chips, "Alle Tiere ansehen" link slot. Used on Home. |
| `TierRow` | `components/TierRow/` | UI | Catalog row: emoji tile + name + optional "DEIN TIER" badge + tagline; `isMine` toggles pink tint + red border. |
| `PayPalButton` | `components/PayPalButton/` | UI | Blue `#0070BA` button; `href` (PayPal.Me URL) opens new tab; disabled state when handle missing. Two sizes (inline ledger pill + full success CTA). |
| `SegmentedControl` | `components/SegmentedControl/` | UI | Two-option segmented (Kalb/Hähnchen). Generic `options[]` + `value` + `onChange`. |
| `MultiSelectChips` | `components/MultiSelectChips/` | UI | Multi-select sauce chips (emoji + label, pink-tint when active). Generic `options[] value[] onToggle`. |
| `SelectChips` | `components/SelectChips/` | UI | Single-select chip row (pizza variants; red-fill when active). |
| `Toggle` | `components/Toggle/` | UI | The Abholer switch (track+knob, red when on). Wrap MUI `Switch` styled to the mock, or hand-built per the inline track/knob styles. |
| `PushToast` | `components/PushToast/` | Layout+UI | Sticky navy toast: red icon tile + "Schulz Döner Control · jetzt" + message; `onDismiss`. `slideDown` keyframe. Driven by `notifications` context. |
| `MedalRow` | `components/MedalRow/` | UI | Leaderboard row: medal/rank slot + Avatar + name + count; `isMe` → red highlight + "· du". |
| `ProductCard` | `components/ProductCard/` | UI | Order grid card: icon, name, sub (price or note), INSIDER badge, selected→red/pink. |
| `IconChipBox` | `components/IconChipBox/` | UI | The tinted rounded icon tile reused across header/stat/abholer rows. |
| `PrimaryButton` / `GhostButton` | `components/buttons/` | UI | Red CTA (with shadow + disabled `#d8a3ac` state from mock) and the outlined red "Zurück zur Übersicht". Thin wrappers over MUI `Button` so disabled/shadow states match. |

Page-shell **Layout** components live in `src/components/PageLayout/` (per skill): `PageLayout` + `PageLayout.Header` + `PageLayout.Content` (mobile column, top safe-area spacer `height:54/64px`, `bg` token prop login/app). The 4 content screens compose `PageLayout` with a `RedChromeSurface` header slot.

---

### 5. Theme extension (`web/src/styles/theme.ts`)

**Extend, never replace.** Current theme has red primary, navy custom palette, Open Sans, flat Paper. Add via module augmentation + `createTheme` merge:

- **Palette additions** (all as proper palette colors so `color="teal"` etc. type-check): `teal #00728E`, `muted #8898a6`, `label #4a6573`, `success #2E7D32` (set `palette.success.main`), `warning/orange #ED701C`, `gold #FAB014`, `paypal #0070BA`, `pinkTint #FCE9EC`, `subtle #F4F6F8`, plus background variants `login #FBF7F6` / `app #ECEAEA`. Augment `Palette`/`PaletteOptions` like the existing `navy` block; add `ButtonPropsColorOverrides` entries for `paypal`/`navy`.
- **`theme.schraege`** — a custom theme field (module-augment `Theme`/`ThemeOptions`) carrying the bevel recipe: `{ clip: 'polygon(82% 0,100% 0,100% 100%,75% 100%)', clipDeep: 'polygon(78% 0,...)', overlay: 'rgba(0,0,0,.18)', overlayLight: 'rgba(255,255,255,.04)' }`. `RedChromeSurface`/`Schraege` read `theme.schraege` instead of hardcoding the polygon → the bevel is themed and single-sourced.
- **`shape.borderRadius`** stays small for inputs, but card radii (12–16px) are exposed as `theme.shape` custom keys or a `radii` field (`sm:11, md:12, lg:14, xl:16, pill:20`) — components read `theme.radii.lg`, never literal px.
- **Keyframes** via a single `<GlobalStyles>` (in `AppProviders`): `pulseDot`, `slideDown`, `spin360`. Components reference by name (`animation: theme.keyframes.pulseDot` helper or the literal name string from a token).
- **Component defaults**: keep `MuiButton disableElevation`, flat `MuiPaper`. Add `MuiTextField`/`MuiOutlinedInput` defaults to match the mock inputs (1.5px border `rgba(0,34,48,.14)`, 12px radius, white bg). **No gradients** (already enforced).
- **Typography**: register the eyebrow/label variants used everywhere (uppercase 10–11px, `letterSpacing .1em`, color `muted`) as custom `typography.eyebrow` so screens don't restate it.

Rule held: **zero hardcoded hex/px in any component** — everything reads `theme.palette.*`, `theme.radii.*`, `theme.schraege`, `theme.spacing()`.

---

### 6. Data fetching, Zod boundary, forms

- **Every** `api.ts` hook validates the response with `Schema.parse(await res.json())` — never `as`/`as unknown as`. Types are `z.infer<typeof Schema>` in `types.ts`. Backend `...Dto` → frontend type without suffix.
- Money crosses the wire as **integer cents** (matches the data model); `formatEur`/`toPayPalAmount` convert at the UI boundary only.
- **Forms** = React Hook Form + `@hookform/resolvers` zodResolver:
  - **Login** (`auth`): `LoginFormSchema { username: z.string().trim().toLowerCase().min(1), password: z.string().min(1) }`. `useLoginForm()` returns `{ form, onSubmit }`; submit calls `useLogin()`, on `mustChangePassword` navigate to `/passwort-aendern`, else to `redirect ?? '/'`.
  - **Order** (`order`): `OrderFormSchema` cross-field validated with `superRefine` — `{ productId: z.string(), kind: z.enum(['doener','pizza']), meat: z.enum(['Kalb','Haehnchen']).nullable(), sauces: z.array(z.enum(['Kraeuter','Knoblauch','Scharf'])), pizzaVariant: z.enum([...]).nullable(), extra: z.string().max(200).optional(), priceCents: z.number().int().positive(), isPickup: z.boolean() }`. Refine: doener-kind ⇒ `meat` required & `pizzaVariant` null; pizza-kind ⇒ `pizzaVariant` required & `meat`/`sauces` empty. Submit disabled until a product is chosen (mock parity). The € input shows German `8,50`, parsed to cents on change. `use-order-config.ts` watches `productId`→derives `kind`/`meatVisible`/`pizzaVisible` (the mock's conditional sections).
- **Optimistic + invalidation**: `useSubmitOrder` invalidates `orderDayKeys.today` + `dashboardKeys.all` on success then navigates to `/erledigt?orderId=…`. `useOpenDay` invalidates the same + triggers the toast. `useSettleDebt` optimistically removes the row from `paymentKeys.open`.

---

## Component trees per screen (every node labelled Layout / Logic / UI)

### Screen 1 — LOGIN (`routes/login.tsx`)

```
LoginRoute (route)                                         [Logic — composes the feature]
└─ LoginPage                                               [Layout — bg #FBF7F6 column shell]
   ├─ useLoginForm()  (RHF + zodResolver + useLogin)       [Logic — hook]
   ├─ Brand / logo + eyebrow "Betriebs-Kantinen-System"    [UI]
   ├─ Headings "Mitarbeiter-Login" + subcopy               [UI]
   ├─ <form onSubmit>                                       [Layout]
   │  ├─ TextField username (RHF Controller)                [UI]
   │  ├─ TextField password type=password (RHF Controller)  [UI]
   │  └─ PrimaryButton "Anmelden" (loading/disabled)         [UI]
   └─ ServerStatusLine                                       [Layout]
      ├─ LiveDot (success green, pulseDot)                   [UI]
      └─ text "Döner-Server erreichbar · Werk HB-01 · v3.0"  [UI]
```
No feature context needed (single form) — RHF + the `useLoginForm` hook is the Logic layer; no prop drilling.

---

### Screen 2 — HOME / DASHBOARD (`routes/_auth/index.tsx`)

```
HomeRoute (route)                                          [Logic — composes features]
└─ DashboardProvider  (dashboard-context.ts)               [Logic — context, throws outside]
   ├─ useDashboard() + useTodayOrderDay() + useOpenDebts() + useAuth()   [Logic — hooks feeding context]
   └─ DashboardPage                                        [Layout — bg #ECEAEA column shell + safe-area spacer]
      ├─ PushToast (from notifications/useToast)            [Layout+UI — sticky navy toast, onDismiss]
      ├─ PageLayout.Header → RedChromeSurface               [Layout — Schräge bevel]
      │  ├─ slot start: IconChipBox kebab_dining            [UI]
      │  ├─ slot children: "Döner Control" / "WERKS-KANTINE · HB-01"  [UI]
      │  └─ slot end: LivePill (LiveDot + "LIVE")            [UI]
      ├─ GreetingBar                                         [Layout]
      │  ├─ "Moin, {firstName} 🥙" / "Donnerstag · die heilige Döner-Schicht"  [UI]
      │  └─ AvatarMenu (Avatar → profile/logout)            [UI] (consumes useAuth via context)
      ├─ TierCard (consumes dashboard ctx .tier)            [UI]
      │  └─ onClick "Alle Tiere ansehen" → navigate /tiere  [UI link]
      ├─ StatsGrid                                          [Layout — 2×2 grid]
      │  └─ StatCard ×4 (gesamt / Monat € / Offen / Streak) [UI]
      ├─ DoenerTagSection  (use-day-state from ctx)         [Logic+Layout — picks Closed|Open]
      │  ├─ DayClosedCard                                   [UI]
      │  │  └─ PrimaryButton "Ich will heute Döner!" (useOpenDay)  [UI]
      │  └─ DayOpenCard                                     [Layout]
      │     ├─ RedChromeSurface (inner sub-header)          [Layout — Schräge]
      │     │  └─ LiveDot + "Döner-Tag läuft / Bestellschluss 11:30" + "{n} dabei"  [UI]
      │     ├─ NotificationPreview (notifText)              [UI]
      │     ├─ AbholerLine (Avatar/pickups list)            [UI]
      │     ├─ OrderRow ×N (Avatar + product + person·desc + price)  [UI]
      │     └─ PrimaryButton "Meine Bestellung abgeben" → /order  [UI]
      ├─ LeaderboardCard  (ctx .leaderboard)                [Layout]
      │  ├─ header (emoji_events + "Döner-Bestenliste" + year)  [UI]
      │  ├─ MedalRow ×3 (top 3)                             [UI]
      │  ├─ MedalRow (current user, isMe highlight)         [UI]
      │  └─ footer "Nur noch X Döner bis Platz N 🌯"        [UI]
      └─ OpenPaymentsCard  (payments via ctx or own hook)   [Layout]
         ├─ header ("Offene Zahlungen" + count badge + total)  [UI]
         └─ DebtRow ×N → Avatar + name + reason + amount + PayPalButton  [UI]
```
**Prop-drilling removal:** `DashboardProvider` exposes `{ greeting, stats, tier, leaderboard, day, debts, isLoading }`. Children (`TierCard`, `StatsGrid`, `DoenerTagSection`, `LeaderboardCard`, `OpenPaymentsCard`) call `useDashboardContext()` instead of threading 6+ props. `DashboardPage` is a pure slot shell; the action callbacks (`openDay`, `pay`) come from operations hooks held in context.

---

### Screen 3 — DÖNER-TIERE (`routes/_auth/tiere.tsx`)

```
TiereRoute (route)                                         [Logic]
└─ TierePage                                               [Layout — bg #ECEAEA shell]
   ├─ useTierCatalog()  (catalog + isMine flag)            [Logic — hook]
   ├─ PageLayout.Header → RedChromeSurface                 [Layout — Schräge]
   │  ├─ slot start: BackButton → /  (navigate)            [UI]
   │  └─ slot children: "Döner-Tiere / Alle 15 erfassten Exemplare"  [UI]
   ├─ explainer paragraph                                   [UI]
   ├─ TierList                                              [Layout — column]
   │  └─ TierRow ×15 (emoji, name, "DEIN TIER" badge if isMine, tagline)  [UI]
   └─ GhostButton "Zurück zur Übersicht" → /                [UI]
```
Simple read screen — a single hook is the Logic layer; no context needed (list passed once to `TierList`, not drilled).

---

### Screen 4 — ORDER (`routes/_auth/order.tsx`)

```
OrderRoute (route)                                         [Logic]
└─ OrderFormProvider  (order-context.ts)                   [Logic — context]
   ├─ useMenu() + useMyOrder(dayId) + use-order-form()      [Logic — hooks]
   ├─ use-order-config()  (derives kind/meatVisible/pizzaVisible from watched productId)  [Logic]
   └─ OrderPage                                            [Layout — bg #ECEAEA shell]
      ├─ PageLayout.Header → RedChromeSurface               [Layout — Schräge]
      │  ├─ slot start: BackButton → /                      [UI]
      │  └─ slot children: "Bestellung, Chef / Döner-Tag · Donnerstag"  [UI]
      ├─ <form onSubmit={submitOrder}>                      [Layout]
      │  ├─ SectionLabel "Was darf's sein, Chef?"           [UI]
      │  ├─ ProductGrid                                     [Layout — 2-col grid]
      │  │  └─ ProductCard ×6 (RHF controlled select; INSIDER badge; red when selected)  [UI]
      │  ├─ PizzaVariantField  (render iff pizzaVisible)    [Logic-gated Layout]
      │  │  └─ SelectChips (variants)                       [UI]
      │  ├─ MeatField         (render iff meatVisible)      [Logic-gated Layout]
      │  │  └─ SegmentedControl (Kalb | Hähnchen)           [UI]
      │  ├─ SauceField        (render iff meatVisible)      [Logic-gated Layout]
      │  │  └─ MultiSelectChips (Kräuter/Knoblauch/Scharf)  [UI]
      │  ├─ ExtraField → TextField multiline                [UI]
      │  ├─ PriceField → money input (cents⇄"8,50", € suffix)  [UI]
      │  ├─ PickupToggleCard                                [Layout]
      │  │  └─ Toggle "Ich hole heute ab 🚗" + subcopy      [UI]
      │  └─ PrimaryButton "Bestellung abgeben" (disabled until product chosen)  [UI]
```
**Context/hook removes drilling:** `OrderFormProvider` exposes the RHF `control`, the derived `{ meatVisible, pizzaVisible, kind }`, and `submit`. Conditional fields read `useOrderFormContext()` to decide render + bind to RHF — no passing of `productId`/`watch` down through 3 levels (the mock recomputed `isDoener`/`isPizza` inline; we centralize it in `use-order-config`). Each `*Field` is a thin Logic-gated Layout wrapper that mounts its UI chip/control only when visible (render-phase conditional, no `useEffect`).

---

### Screen 5 — SUCCESS (`routes/_auth/erledigt.tsx`)

```
ErledigtRoute (route — validateSearch { orderId })         [Logic — reads URL state]
└─ SuccessPage                                             [Layout — bg #ECEAEA shell]
   ├─ useOrderResult(orderId)  (redirects to / if missing)  [Logic — hook]
   ├─ use-pay-abholer()  (builds PayPal URL, opens tab)      [Logic]
   ├─ SuccessHeader (green check tile + "Erledigt, Chef" + subline)  [UI]
   ├─ OrderSummaryCard (product, big red price, detail)     [UI]
   ├─ PaymentSection  (picks one card by result.isPickup)   [Logic-gated Layout]
   │  ├─ OwesAbholerCard   (if NOT pickup)                  [UI]
   │  │  ├─ Avatar + abholer name                           [UI]
   │  │  ├─ big amount                                       [UI]
   │  │  ├─ PayPalButton "Jetzt {X} per PayPal senden"      [UI]
   │  │  └─ caption "Öffnet PayPal.Me · Betrag voreingestellt"  [UI]
   │  └─ PickupCollectCard (if pickup — navy)               [UI]
   │     └─ "Du holst heute ab, Chef! / Du sammelst {X} von {N} Kollegen ein / Links automatisch verschickt 📲"  [UI]
   └─ GhostButton "Zurück zur Übersicht" → /                [UI]
```
Success state is **URL-driven** (`orderId` search param) + server-fetched, replacing the mock's transient `lastOrder` state. `PaymentSection` is a Logic-gated Layout that mounts exactly one of the two UI cards from `result.isPickup`.

---

### How the three layers stay clean (rules honored)

- **Layout** components (`PageLayout`, `RedChromeSurface`, `*Page`, `StatsGrid`, `DoenerTagSection`, `PaymentSection`, `OrderFormProvider`-page) only arrange slots/children; they never fetch or hold business state and never set their own margin/padding for positioning (parent controls via `sx`).
- **Logic** lives in `hooks/` + one `*-context.ts` per compound group; context hook **throws outside provider**; `use-*-operations.ts` wraps mutations; `Object.assign(PageLayout, { Header, Content })` builds the compound namespace.
- **UI** components are `FC<Props>` presentational, consume context where 3+ props would otherwise drill, use MUI `Stack` (not `Box`+flex), default MUI imports, theme tokens only, no `useMemo/useCallback/memo`.
- **Tests**: main components (`LoginPage`, `DashboardPage`, `OrderPage`, `SuccessPage`, `TierePage`, `RedChromeSurface`, `PayPalButton`, `StatCard`, `MedalRow`) get co-located `.test.tsx` with Vitest + Testing Library; internal-only chips/rows skipped where they'd only assert mocks.

---

## Test strategy

## Test Strategy — Schulz Döner Control

How we test the whole stack. Grounded in the existing scaffold: `AppFixture<Program>` + `TestBase<TFixture>` from `FastEndpoints.Testing` (see `server/tests/Schulz.DoenerControl.Api.Tests/DoenerControlApp.cs` and `GetHealthTests.cs`), the `Result<T>` pattern in `server/src/Schulz.DoenerControl.Core/Result.cs`, and Vitest + jsdom on the frontend (`web/vite.config.ts`, `web/src/test/setup.ts`). All backend code is built **TDD red-green**; every test exercises real behavior against a real SQLite DB or pure logic — never a mock asserting on itself.

### Guiding principles (non-negotiable)

1. **TDD red-green per feature.** No production line is written before a failing test that pins the behavior. Each fresh implementation subagent writes the failing integration/unit test first, watches it fail for the *right* reason, then makes it pass.
2. **Two test tiers, deliberately split.** Pure deterministic algorithms → **fast unit tests** (no DB, no host). Anything touching HTTP, auth, EF, or persistence invariants → **integration tests through the real API + real SQLite DB**.
3. **Real DB, no Testcontainers.** SQLite is embedded; each test class gets a fresh temp-file DB, real EF migrations applied, then seeded. No `EnsureCreated` — the migration itself must be exercised.
4. **No mock-only tests.** A test that stands up a mock repository and then asserts the mock returned what it was told to return is banned. See the checklist below.
5. **Backend test conventions** (from `backend-work`): xUnit v3 `Assert.*` only (FluentAssertions banned), naming `Should_Expected_When_Scenario`, **one test file per endpoint** mirroring the endpoint name, never `Task.Delay` — poll for the expected condition with a timeout.

---

## 1. Integration-test harness design

### 1.1 The fixture — `DoenerApp : AppFixture<Program>`

The scaffold already has the skeleton (`DoenerControlApp : AppFixture<Program>`). We extend it into the real harness. `AppFixture<T>` is a `WebApplicationFactory` wrapper; FastEndpoints.Testing gives one instance **per test class** (xUnit v3 class fixture semantics), and `TestBase<TFixture>` injects it. We exploit that: **one isolated SQLite file per fixture instance ⇒ one per test class**, which is the isolation boundary.

```
public sealed class DoenerApp : AppFixture<Program>
{
    private string dbFilePath = string.Empty;

    // unique temp file per fixture instance => per test class => parallel-safe
    protected override void ConfigureApp(IWebHostBuilder b)
    {
        dbFilePath = Path.Combine(Path.GetTempPath(),
            $"doener-test-{Guid.NewGuid():N}.db");
        b.UseEnvironment("Testing");
    }

    protected override void ConfigureServices(IServiceCollection s)
    {
        // strip the real AppDbContext registration, re-add pointed at our temp file
        s.RemoveAll<DbContextOptions<AppDbContext>>();
        s.AddDbContext<AppDbContext>(o =>
            o.UseSqlite($"Data Source={dbFilePath}"));
    }

    // override the host config so prod secrets are never needed/used
    protected override void ConfigureConfiguration(IConfigurationBuilder c) =>
        c.AddInMemoryCollection(TestConfig.Values);  // see 1.3

    protected override async ValueTask SetupAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();          // REAL migrations, not EnsureCreated
        await TestSeed.SeedAsync(scope.ServiceProvider); // menu + known users
    }

    protected override async ValueTask TearDownAsync()
    {
        SqliteConnection.ClearAllPools();   // release the file handle on Windows/macOS
        if (File.Exists(dbFilePath)) File.Delete(dbFilePath);
    }
}
```

Key points:
- **`MigrateAsync`, not `EnsureCreated`** — proves the `InitialCreate` migration and `HasData` menu seed are correct, per the foundation decision.
- **Temp *file*, not `:memory:`.** A SQLite in-memory DB is torn down when its single connection closes; EF + a pooled connection make that fragile across the request scopes a `WebApplicationFactory` opens. A throwaway file is unambiguous and still ~instant for 13 users. (If a future feature proves file I/O is the bottleneck, the alternative is a shared-cache in-memory connection kept open for the fixture lifetime — documented as the fallback, not the default.)
- **Disposal** clears the SQLite connection pool then deletes the file; leaked files are harmless (`doener-test-*.db` under temp) but we clean up.

### 1.2 Isolation & parallelism

- **Isolation unit = test class.** Each test class gets its own `DoenerApp` instance ⇒ its own DB file ⇒ no cross-class state bleed. Tests within a class share one DB and run sequentially (xUnit default within a class), so they may rely on the seed but **must not depend on ordering or on each other's writes**; a test that needs a specific row creates it (via API or a seeded fixture helper), it does not assume a previous test left it.
- **Parallel classes are safe** because the DB files are disjoint (`Guid` in the name). xUnit v3 runs collections in parallel by default; we keep classes in separate collections (the default) so the per-class fixtures parallelize.
- **Mutation tests that would collide with the seed** (e.g. "open day" when the seed has no open day) start from a clean, known seed each fixture; if a single test needs to mutate seeded users, it operates on a user it provisions itself (`TestSeed.CreateUserAsync`) rather than the shared demo users, to keep sibling tests in the same class deterministic.

### 1.3 Config override (test pepper + test JWT key + weak hashing)

`TestConfig.Values` (in-memory config) supplies everything `appsettings` would in prod, but with test values so no real secret is needed and the red-green loop stays fast:

| Key | Test value | Why |
|---|---|---|
| `ConnectionStrings:AppDb` | (unused — fixture overrides DbContext directly) | DbContext is re-registered in `ConfigureServices`. |
| `Auth:Pepper` | a fixed ≥32-byte base64 test secret | Real Argon2id `KnownSecret` path runs; deterministic across runs. |
| `Auth:JwtSigningKey` | a fixed ≥32-byte test key | Tokens validate against the same key the host signs with. |
| `Auth:JwtIssuer` / `Auth:JwtAudience` | `doener-test` | Issuer/audience validation exercised. |
| `Auth:OrderCutoffLocalTime` | `11:30` | Default cutoff; individual tests override per-day cutoff via the open-day command/clock. |
| `PasswordHashing:MemorySize` | `8192` (8 MiB) | **Deliberately weak** Argon2id — real hashing, fast loop. |
| `PasswordHashing:Iterations` | `1` | Same. Production keeps the OWASP-hardened 19 MiB / t=2. |

**Determinism of time:** the host binds `TimeProvider` (per the foundation). The fixture exposes a `FakeTimeProvider` (`Microsoft.Extensions.TimeProvider.Testing`) registered in `ConfigureServices`, so cutoff/edit-window/streak/"diesen Monat" tests **set the clock** rather than waiting. This is how we obey "never `Task.Delay`" for time-dependent behavior — we advance the fake clock, we don't sleep.

### 1.4 Authenticating in a test (cookie capture & reuse)

Auth is cookie-based (httpOnly `dc_access` + `dc_refresh`, non-httpOnly `dc_xsrf`), so tests must drive the **real login endpoint** and reuse the cookies the server sets — never hand-mint a JWT (that would skip the very wiring we need to prove).

A shared helper on the fixture:

```
public async Task<AuthedClient> LoginAsync(string username = "m.wagner",
                                           string password = TestSeed.DemoPassword)
{
    var raw = Fixture.CreateClient(); // no auto-redirect; raw HttpClient
    var resp = await raw.PostAsJsonAsync("/api/auth/login",
        new { username, password });
    // capture Set-Cookie headers; build a cookie-bearing client + the xsrf token
    return AuthedClient.From(resp, raw);
}
```

`AuthedClient` carries a `CookieContainer` (or replays the `Set-Cookie` values on each request) **plus** reads the `dc_xsrf` value and attaches it as the `X-XSRF-TOKEN` header on every mutating call. Authenticated tests do `var client = await App.LoginAsync(); ... client.POSTAsync<...>(...)`. The cookies are httpOnly so the test treats `dc_access`/`dc_refresh` as opaque — it never parses the JWT, it just replays the cookie, exactly like the browser.

### 1.5 Asserting on Set-Cookie / auth

We assert on observable HTTP, not internals:
- **Login sets cookies:** parse `response.Headers.GetValues("Set-Cookie")`; assert a `dc_access` cookie exists with `HttpOnly`, `Secure` (in non-dev), `SameSite=Strict`; a `dc_refresh` scoped to `Path=/api/auth`; a `dc_xsrf` that is **not** HttpOnly.
- **Cookie-only auth works:** the security-critical wiring test — issue a request with **only** the `dc_access` cookie and **no `Authorization` header**, assert `200`. This proves the `JwtBearerEvents.OnMessageReceived` cookie→token copy is real.
- **Unauthenticated → 401:** any protected endpoint with no cookie returns `401` (FastEndpoints secured-by-default).
- **Forbidden → 403:** an `employee` hitting a `Roles("admin")` endpoint returns `403`.
- **Refresh rotation:** capture the `dc_refresh` cookie value before and after `/api/auth/refresh`; assert it changed and the old one no longer works (reuse → family revoked → 401). We read the new cookie from `Set-Cookie`, not the DB, then prove the old token is dead by replaying it.
- **Logout:** assert all three cookies come back expired (`Max-Age=0` / past `Expires`) and a subsequent refresh with the old cookie 401s.

---

## 2. Red-green loop expectation (per feature)

Every feature subagent follows this loop, and the orchestrator should reject a feature PR that shows production code without a prior failing test:

1. **Pick the thinnest vertical slice** (one endpoint, or one pure function).
2. **Write the failing test first.** For an endpoint: the integration test in its own file `<EndpointName>Tests.cs`, calling the real route through `App.Client` / `AuthedClient`, asserting the real DB effect. Run it — it must fail because the endpoint/route doesn't exist or returns the wrong thing (a 404/compile error is an acceptable first red; prefer a red on the *assertion* once the endpoint stub exists).
3. **Write the minimum production code** (entity/config/migration → service with `Result<T>` → endpoint with Request+Validator+Response) to go green.
4. **Refactor** under green; run `dotnet csharpier format .`.
5. **Repeat** for the next behavior (edit, cutoff rejection, conflict, auth gate…), each as its own failing test first.

For **pure algorithms** (tier, leaderboard, streak, PayPal link, money), the loop is the same but lighter: failing unit test for one branch/boundary → implement → next branch. The tier algorithm is built branch-by-branch (15 reds), not all at once.

---

## 3. Pure unit tests vs integration tests — the split

**FAST PURE UNIT (no DB, no host, no HTTP).** These are deterministic functions in the **Application/Core** layer that take values and return values. They are the cheapest place to get exhaustive boundary coverage, so they own the algorithmic risk.

| Logic | Lives in | Why pure |
|---|---|---|
| **Döner-Tier `computeTier`** | Application service (e.g. `TierCalculator`) over a list of order facts | Pure function of order history. All 15 priority branches + thresholds tested exhaustively here — NOT through the DB. |
| **Leaderboard ranking** | `LeaderboardCalculator` | Group+count+sort+medal+"Nur noch X bis Platz N" is pure given the per-user counts. |
| **Streak calc** | `StreakCalculator` | Consecutive ISO-weeks with an order — pure given the set of order dates + "today". |
| **PayPal.Me link builder** | `PayPalLinkBuilder` | `cents → https://paypal.me/{handle}/8.50EUR` is a pure string/format function. |
| **Bestellschluss / edit-window rule** | `OrderWindow` policy (pure predicate) | "may order/edit?" = `day.Status == Open && now <= cutoff` — a pure predicate of (status, cutoff, now). The *enforcement* is integration; the *rule* is unit. |
| **Money / cents formatting** | `MoneyFormatter` | `750 → "7,50 €"` (German) and `750 → "7.50"` (PayPal) are pure. |
| **Avatar initials / first name** | `NameFormatter` (mock `initialsOf`) | Pure string derivation from `DisplayName`. |
| **Push text builder** | `NotificationText` | Pure template fill from a synonym. |

**INTEGRATION through the real API + real SQLite DB.** Anything whose correctness *is* the wiring, persistence, or an invariant the DB enforces:

| Behavior | Why integration |
|---|---|
| Login / refresh / logout / change-password + cookie behavior | The value is the HTTP + cookie + token + DB round-trip. |
| Authorization-by-default (401 unauth, 403 forbidden, cookie-only 200) | Proves middleware + FastEndpoints config, not a unit. |
| Open day → synonym chosen → one-open-day-per-date invariant | Unique index on `OrderDay(Date)` + concurrency are DB facts. |
| Order create/edit (upsert) + one-order-per-user-per-day | Composite unique index `(OrderDayId, UserId)` is a DB invariant. |
| Order rejected after cutoff / when day closed | End-to-end: clock + persisted cutoff + endpoint rejection mapped to the right HTTP. |
| Debt creation on finalize + settlement transition | Cross-day stored ledger lifecycle. |
| Dashboard aggregates (gesamt / diesen Monat / offen / streak) **as served by the endpoint** | The endpoint composes the pure calculators over real persisted orders — we verify the SQL projection + composition, having already unit-tested the math. |
| Tier **endpoint** for a seeded user | One integration test that seeds Markus's exact 12-order history and asserts the endpoint returns 🐺 Knoblauch-Wolf — proves the calculator runs over real EF reads. The exhaustive branch coverage stays in unit tests. |

**The seam:** the pure calculators are unit-tested exhaustively; the integration tests assert that the endpoint *uses* them over real data for a couple of representative cases. We do **not** re-test all 15 tier branches through the DB (slow, redundant) — only that the wiring delivers the right answer end-to-end.

---

## 4. "Real & useful" vs "mock test that just tests the mock/seed" — checklist

A test earns its place only if it could **fail when the production code is wrong**. Use this when reviewing any test.

### DO (real & useful)
- **DO** drive behavior through the real surface: call the HTTP endpoint via `App.Client`/`AuthedClient`, or call the pure function with real inputs.
- **DO** assert on an **observable outcome the code computes**: HTTP status, response body, a row actually written/changed in the real SQLite DB (re-read it), a `Set-Cookie` header, a `Result` status the *service logic* produced.
- **DO** seed only the *inputs/preconditions*, then assert the *transformation*. Example: seed 6 doener orders with Knoblauch, assert the tier endpoint returns 🐺 — the seed is the input, the tier is the computed output.
- **DO** test invariants by trying to violate them: insert a second order for the same `(day,user)` and assert `Conflict`/`409` — proving the unique index + mapping, not the seed.
- **DO** test boundaries exactly: `garlic == 0.7` (tier flips) vs `0.699…`; `now == cutoff` (still allowed) vs `cutoff + 1s` (rejected); month boundary for "diesen Monat".
- **DO** advance the `FakeTimeProvider` to test time-dependent behavior; poll (with timeout) for any genuinely async/background effect.

### DON'T (mock-test / seed-test smells — reject these)
- **DON'T** assert that a **mocked repository returned what you told it to**: `repo.Setup(x => x.Get(id)).Returns(user); ... Assert.Equal(user, result)` tests Moq, not us. Backend rule: no mock-only tests. Use the real DB.
- **DON'T** assert the **seed equals itself**: `Assert.Equal(6, seededMenuItems.Count)` where the test seeded 6 — that asserts the test's own arrange. Instead assert a behavior that *consumes* the menu (the order endpoint accepts `danny` and marks it INSIDER).
- **DON'T** assert on hardcoded mock/demo numbers from the HTML mock (1.337 Döner, €312,50). Those are prototype literals. Assert the **aggregate computed from orders you seeded** (seed 3 orders this month at known prices → assert the exact summed cents).
- **DON'T** hand-mint a JWT in a test to "skip login" — that bypasses the cookie wiring under test. Always go through `/api/auth/login`.
- **DON'T** call the EF DbContext to write a row and then read it back asserting EF works — that tests EF, not our logic. Write through the **service/endpoint**, read back to confirm *our* behavior.
- **DON'T** snapshot rendered React mock data (see §5).

**One-line litmus test:** *"If I introduce a realistic bug in the production code, does this test go red?"* If no → it's a mock/seed test; delete or rewrite it.

---

## 5. Frontend testing (Vitest + Testing Library)

Setup is already in place: `jsdom`, `globals: true`, `@testing-library/jest-dom` (`web/src/test/setup.ts`). No MSW yet — **add `msw` as a dev dependency** for the network boundary (see below). Tests co-locate with source (`Component.test.tsx`), per `frontend-work`.

### What we test (meaningful behavior, not snapshots)
Per the layer split in `frontend-work` (Logic = hooks/context, Layout = slots, UI = presentational):

1. **Logic hooks** (`use-*`) — the bulk of value. Render the hook (`renderHook`) and assert its state machine:
   - Order form hook: selecting a product enables submit; selecting a pizza reveals the pizza-variant row and hides meat/sauce; selecting a doener-kind reveals meat + sauce; multi-select sauce toggles accumulate (Knoblauch + Scharf both on); price prefills from the product default and is editable; "Abholer" toggle flips pickup. These are **conditional-section + derived-state rules** — exactly the high-value logic.
   - Tier/stats/leaderboard presentation hooks if any client-side derivation exists (prefer server-derived; if the client only formats, test the formatter).
2. **Meaningful component behavior** — drive the component with `userEvent`, assert what the user sees/can do:
   - **Submit disabled until a product is chosen**, then enabled (assert `button` `disabled` toggles).
   - **Sauce multi-select**: click Kräuter + Knoblauch → both chips show selected state; the submitted payload (captured at the network boundary) contains both.
   - **Conditional rows**: pizza selected → "Welche Pizza?" appears, meat/sauce gone; doener selected → meat segmented control + sauce chips appear.
   - **Pickup toggle** changes the success-screen branch (collect vs pay).
   - **PayPal button** builds the right `paypal.me/{handle}/{amount}EUR` href (assert the anchor `href`, since the builder feeds the UI).
3. **Compound composition contracts**: a context hook used outside its provider throws (assert it throws) — that's a real behavioral guarantee from `frontend-work`.

### What we do NOT test
- No DOM snapshots of seed/mock data (brittle, asserts the fixture not behavior).
- No re-testing MUI internals or theme tokens.
- Skip a component test entirely when it would only validate a mock (e.g. a pure presentational `<Avatar color>` with no logic) — `frontend-work` explicitly allows skipping when tests would just validate mocks.

### Mocking only the network boundary (MSW) — why it's still a real test
The frontend's only legitimate mock is the **HTTP boundary**, via **MSW** intercepting `fetch`. We mock *the server's responses*, then test that the **component/hook reacts correctly**: shows loading, parses the response **through the real Zod schema** (`schemas.ts` `.parse()`), renders the parsed data, sends the correct request body/headers (incl. `credentials: 'include'` + `X-XSRF-TOKEN`) on submit. This is a real test because:
- the code path under test (hook state, Zod validation, rendering, request shaping) is the **real production code**, not a stub;
- MSW replaces *only* the network — the thing we cannot and should not run in a unit test — and lets us assert the request the component *actually* sent and how it handles real/edge responses (200, 401, 409, validation errors);
- crucially, the **Zod boundary parse runs for real**, so a schema/contract mismatch fails the test.

We do **not** mock our own hooks/components to test other hooks/components — that would be a mock-testing-a-mock. MSW is the single allowed seam.

---

## 6. Per-feature test inventory

Backend tests obey: xUnit v3 `Assert.*`, `Should_Expected_When_Scenario`, **one file per endpoint** named after the endpoint, poll-not-`Task.Delay`. Frontend tests co-located.

### Auth & security (integration, real DB + real Argon2id)
- **`LoginTests.cs`**: `Should_SetAuthCookies_When_CredentialsValid`; `Should_Return401_When_PasswordWrong`; `Should_Return401_When_UserUnknown` (and timing-constant via dummy verify); `Should_LockAccount_When_FiveConsecutiveFailures`; `Should_SurfaceMustChangePassword_When_FlagSet`; `Should_NotLeakLockoutVsBadPassword_When_Failing`.
- **`RefreshTests.cs`**: `Should_RotateToken_When_RefreshValid` (old hash revoked, new cookie set); `Should_RevokeFamilyAndReturn401_When_RevokedTokenReused` (security-critical); `Should_Return401_When_RefreshExpired` (advance FakeClock).
- **`LogoutTests.cs`**: `Should_ClearCookiesAndRevokeFamily_When_LoggedOut`; `Should_Return401_When_RefreshAfterLogout`.
- **`ChangePasswordTests.cs`**: `Should_Return401_When_CurrentPasswordWrong`; `Should_ClearFlagAndInvalidateOldToken_When_Changed`; `Should_LoginWithNewPassword_When_Changed`; `Should_RejectOldPassword_When_Changed`.
- **`AuthGateTests.cs`** (uses a protected sample endpoint): `Should_Return401_When_NoCookie`; `Should_Return200_When_OnlyAccessCookiePresent` (proves cookie→token wiring); `Should_Return403_When_EmployeeHitsAdminEndpoint`.
- **`CsrfTests.cs`**: `Should_Return403_When_XsrfHeaderMissing`; `Should_Return403_When_XsrfHeaderMismatch`; `Should_Pass_When_XsrfHeaderMatchesCookie`.

### Tier (pure unit — exhaustive — `TierCalculatorTests.cs`)
One `[Fact]`/`[Theory]` per priority branch + boundary, **first-match-wins** verified by ordering. Branch thresholds taken verbatim from the mock `computeTier` (`mocks/Schulz Döner Control.dc.html` lines 440-468):
- `Should_ReturnBuerowaffe_When_GarlicAtLeast06AndSpicyAtLeast06` (+ boundary `garlic=0.6,spicy=0.6` flips; `0.6/0.59` does not).
- `Should_ReturnKnoblauchWolf_When_GarlicAtLeast07AndNotBuerowaffe` (boundary 0.7; and proves priority — high garlic+low spicy does NOT become Bürowaffe).
- `Should_ReturnSchaerfeDrache_When_SpicyAtLeast07`.
- `Should_ReturnPizzaVerraeter_When_PizzaCountAtLeast2`.
- `Should_ReturnDannyJuenger_When_DannyCountAtLeast2`.
- `Should_ReturnBigWildsau_When_BigAtLeastMax2AndPointFourN` (test both arms of `Math.max(2, n*0.4)`: small-n uses 2; large-n uses 0.4·n).
- `Should_ReturnKalbRex_When_AllMeatedKalbAndMeatedAtLeast5` (and NOT when meated=4).
- `Should_ReturnAngstHaehnchen_When_AllMeatedHaehnchenAndMeatedAtLeast5`.
- `Should_ReturnSossenMessie_When_AtLeastHalfHaveThreeSauces`.
- `Should_ReturnTrockenmaus_When_AtLeastHalfDoenerKindHaveNoSauce`.
- `Should_ReturnDuerumAdler_When_DuerumAtLeastMax2AndPointFiveN`.
- `Should_ReturnPommesBiber_When_BoxAtLeastMax2AndPointFourN`.
- `Should_ReturnChaosAeffchen_When_DistinctProductsAtLeast5`.
- `Should_ReturnFaultier_When_OneDistinctProductAndAtLeast5Orders`.
- `Should_ReturnSoliderBuerger_When_NoOtherBranchMatches` (fallback, incl. empty/`n=0` → `n=1` guard).
- `Should_PreferEarlierBranch_When_MultipleMatch` (e.g. a history matching both Bürowaffe and Knoblauch-Wolf returns Bürowaffe).
- `Should_ReturnKnoblauchWolf_When_MarkusExactHistory` (the canonical 12-order fixture from mock `MY_HISTORY` — also the integration fixture).
- Plus the integration cross-check: **`GetMyTierTests.cs`** `Should_ReturnKnoblauchWolf_When_MarkusHistorySeeded` and `Should_RespectThreeMonthWindow_When_OrdersOlderThan90Days` (orders >90d excluded).

### Other pure calculators (unit)
- **`LeaderboardCalculatorTests.cs`**: `Should_RankByOrderCountDescending`; `Should_AssignMedals_When_TopThree`; `Should_HighlightCurrentUser`; `Should_ReportNurNochXBisPlatzN_When_BelowTop` (diff to next-higher count, matches mock wording); `Should_FilterByYear`.
- **`StreakCalculatorTests.cs`**: `Should_CountConsecutiveWeeks_When_Participated`; `Should_BreakStreak_When_WeekMissed`; `Should_ReturnZero_When_NoOrdersThisWeek`; ISO-week boundary cases.
- **`PayPalLinkBuilderTests.cs`**: `Should_BuildDotDecimalLink_When_GivenCentsAndHandle` (`850 → https://paypal.me/LukasBrandtHB/8.50EUR`, always 2 decimals — matches mock `toFixed(2)`); `Should_ReturnNoLink_When_HandleMissing`.
- **`OrderWindowTests.cs`** (pure predicate): `Should_AllowOrder_When_OpenAndBeforeOrAtCutoff`; `Should_RejectOrder_When_AfterCutoff` (boundary: `now==cutoff` allowed, `cutoff+1` rejected); `Should_RejectOrder_When_DayClosed`.
- **`MoneyFormatterTests.cs`**: `Should_FormatGerman_When_GivenCents` (`750 → "7,50 €"`); `Should_FormatPayPalAmount_When_GivenCents` (`750 → "7.50"`).
- **`NameFormatterTests.cs`**: initials + first name from `DisplayName`. **`NotificationTextTests.cs`**: push template fill.

### Döner-Tag lifecycle (integration)
- **`PostOrderDayTests.cs`** (open a day): `Should_OpenDayWithRandomSynonym_When_NoneOpen`; `Should_ReturnExistingOpenDay_When_AlreadyOpen` (unique-index race → no error, returns existing); `Should_PersistCutoff_When_Opened`; `Should_Return401_When_Unauthenticated`.
- **`PostCloseDayTests.cs`** (or auto-close path): `Should_CloseDay_When_Requested`; `Should_RejectNewOrders_When_Closed`.

### Orders (integration)
- **`PostOrderTests.cs`**: `Should_CreateOrder_When_DayOpenAndBeforeCutoff`; `Should_Return409_When_SecondOrderForSameUserDay` (or upsert-edits depending on chosen semantics — pin in red test); `Should_Return422_When_NoProduct`; `Should_RejectOrder_When_AfterCutoff` (advance FakeClock); `Should_StorePickupFlag_When_AbholerSelected`; `Should_FreezeKindAndPrice_When_Created`.
- **`PutOrderTests.cs`**: `Should_UpdateOrder_When_BeforeCutoff`; `Should_BumpUpdatedAt_When_Edited`; `Should_RejectEdit_When_AfterCutoff`; `Should_Return403Or404_When_EditingAnotherUsersOrder`.

### Debts / payments (integration)
- **`GetDebtsTests.cs`**: `Should_ReturnOpenDebtsForCurrentUser_When_Requested` (sum + count, debtor = current user); `Should_ExcludeSettledDebts`.
- **`PostSettleDebtTests.cs`**: `Should_MarkSettledAndSetSettledAt_When_Settled`; `Should_Return404_When_DebtNotFound`; `Should_Return403_When_NotTheDebtor`.
- Debt creation is exercised via the day-finalize flow: `Should_CreateDebtPerNonPickupParticipant_When_DayFinalized` (creditor = pickup user, amount = own order price).

### Dashboard aggregates (integration)
- **`GetDashboardTests.cs`** (or per-endpoint files): `Should_ReturnTotalOrderCount_When_Requested` (seed N orders → assert N, NOT the mock's 1.337); `Should_SumCurrentMonthSpend_When_Requested` (seed known prices this month + one last month → assert exact cents); `Should_ReturnOpenDebtTotal_When_Requested`; `Should_ReturnStreak_When_Requested`; `Should_ReturnTier_When_Requested`. Each asserts the **computed-from-seeded-orders** value.

### Provisioning / seed (integration)
- **`DbSeederTests.cs`**: `Should_SeedSixMenuItems_When_MigrationsApplied` (asserts behavior: order endpoint accepts each id, `danny` flagged INSIDER); `Should_HashPasswordsWithArgon2id_When_UsersSeeded` (a seeded user can log in via the real login endpoint — proves hashing, not the seed literal); `Should_SetMustChangePassword_When_Provisioned`; `Should_BeIdempotent_When_RunTwice`.

### Frontend (Vitest + Testing Library, co-located)
- **Order form** (`OrderForm.test.tsx` / `use-order-form.test.ts`): `submit disabled until product chosen`; `selecting doener reveals meat + sauce, hides pizza variant`; `selecting pizza reveals variant, hides meat/sauce`; `sauce multi-select accumulates Kräuter+Knoblauch+Scharf`; `price prefills from product default and is editable`; `Abholer toggle sets pickup`; `submit sends correct payload incl. sauces + price` (MSW captures the request).
- **Success screen** (`SuccessCard.test.tsx`): `shows pay-to-abholer branch with correct PayPal href when not pickup`; `shows collect branch when pickup`.
- **Login** (`LoginForm.test.tsx`): `submit posts credentials with credentials:'include'`; `shows error on 401` (MSW returns 401); `routes to change-password when mustChangePassword` (MSW returns the flag).
- **Dashboard pieces**: `stat cards render server-computed values from a mocked API response parsed through Zod` (MSW + real schema parse — fails on contract drift); `leaderboard highlights current user row`.
- **Compound contracts**: `order-context hook throws when used outside provider`.

---

## Build roadmap

## Schulz Döner Control — Build Roadmap

A dependency-ordered sequence of 18 small, self-standing features. Each is sized for one fresh subagent in a single focused TDD red-green pass. Foundational chores first (F0–F1), then the auth/user foundation (F2–F4), then backend slices each followed (where applicable) by their frontend counterpart, then the screen-assembly features.

Grounded in the actual scaffold: `Result<T>` + `ResultStatus` in `Core/Result.cs`, FastEndpoints REPR with `Send.*` and `EndpointWithoutRequest` (see `Endpoints/Health/GetHealth.cs`), `AppFixture<Program>` + `TestBase<TFixture>` (see `tests/.../DoenerControlApp.cs`, `GetHealthTests.cs`), Central Package Management in `Directory.Packages.props`, the three-layer frontend with TanStack Router/Query and the existing MUI theme in `web/src/styles/theme.ts`.

### Suggested build order (dependency overview)

```
F0  Provider switch Npgsql→SQLite + test harness base        [chore]      (no deps)
        │
F1  Core entities + enums + EF configs + InitialCreate + menu seed   [backend]   (F0)
        │
F2  Password hashing (Argon2id+pepper) + options validation  [backend]   (F1)
        │
F3  Auth backend: login/refresh/logout/change-pw + cookies + CSRF + gate + seeder   [backend] (F1,F2)
        │
   ┌────┴───────────────────────────────────────────────┐
F4 Theme extension + DS primitives (frontend)   F5 Pure calculators (tier/leaderboard/streak/money/paypal/names/notif text)  [backend]
   [frontend] (none — uses existing theme)          (F1)
   │                                                    │
F6 Frontend foundation: apiClient + auth ctx + router guard + login screen  [frontend] (F4) [+contract on F3]
   │
   │   backend slices (all depend on F3; many run in PARALLEL):
   │   F7 Menu endpoint ─┐
   │   F8 OrderDay open/close/today + notifications ─┐ (F5 for push text)
   │   F9 Orders upsert/get/delete + pickup claim/release ─┐ (F8)
   │   F10 Debts (create/list/settle) + close-day debt creation ─┐ (F9)
   │   F11 Stats dashboard endpoint ─┐ (F5,F9,F10)
   │   F12 Leaderboard endpoint ─┐ (F5,F9)
   │   F13 Tier endpoints (mine + catalog) ─┐ (F5,F9)
   │   F14 Profile PayPal-handle endpoint ─┘ (F3)
   │
   │   frontend slices (each depends on F6 + its backend slice):
   │   F15 Order screen + success screen      (F6,F7,F9,F10)
   │   F16 Dashboard screen (stats/tier/leaderboard/day/debts/toast)  (F6,F8,F11,F12,F13,F10)
   │   F17 Tiere catalog screen + profile PayPal-handle UI   (F6,F13,F14)
   │
F18 Optional admin provisioning endpoint + dev history seed  [backend] (F3,F1)
```

### Parallelization callouts

- **F4 and F5** run fully in parallel (one frontend, one backend, no shared files) once F1 lands.
- **F7, F8, F14** are independent backend slices that can all start once F3 lands (different feature folders / endpoint files). F9→F10 are a chain. F11/F12/F13 depend on F5+F9 (read-only over orders) and can run in parallel with each other once F9 lands.
- **F15, F16, F17** are independent frontend screens (separate `features/` folders) and parallelize once F6 + their respective backend slices exist.
- The natural critical path is `F0 → F1 → F2 → F3 → F8 → F9 → F10 → F16`. Everything else hangs off it in parallel.

### Conventions every feature inherits (from the skills + session decisions)

- **TDD red-green:** write the named failing test first, watch it fail for the right reason, then minimum production code to green. No mock-only tests; integration tests hit a real temp-file SQLite DB via the F0 harness with real migrations + seed; pure algorithms get exhaustive unit tests.
- **Backend:** FastEndpoints REPR, one file per endpoint named after it, three non-leaking type layers (Endpoint `Request/Response/Dto` · Application `Command/Query/Details/Summary` · Core entities Infrastructure-only), `Result<T>`→HTTP via a shared `ResultExtensions` helper, validator on every request-bearing endpoint, explicit `ct`, `TimeProvider` injected, money in `int` cents. xUnit v3 `Assert.*` only, `Should_X_When_Y`, never `Task.Delay` (advance `FakeTimeProvider`).
- **Frontend:** strict Layout/Logic/UI split, compound composition, React Compiler on (no `useMemo`/`useCallback`/`memo`), named exports + `FC<Props>`, German strings in `copy.ts`, every API response `.parse`d through Zod, theme tokens only (no hardcoded hex/px), `credentials:'include'` + `X-XSRF-TOKEN` in the apiClient.
- **DoD (all features):** all real tests green; zero build warnings; `dotnet csharpier format .` clean (backend) / `biome check .` + `tsc -b` clean (frontend); no skipped/ignored tests; no entity leakage across the service boundary (backend) / no apiClient import in components (frontend).

### Feature dependency table

| ID | Feature | Layer | Depends on | Delivers |
|---|---|---|---|---|
| F0 | Provider switch Npgsql→SQLite + integration test harness base | chore | — | Switches the whole scaffold from Npgsql to Microsoft.EntityFrameworkCore.Sqlite and builds the reusable integration-test foundation everything else tests against. Edits Directory.Packages.props (drop Npgsql.EntityFrameworkCore.PostgreSQL; add Microsoft.EntityFrameworkCore.Sqlite 9.0.17), Infrastructure.csproj (PackageReference swap), Infrastructure/DependencyInjection.cs (UseNpgsql→UseSqlite on connection string 'AppDb'), AppDbContextFactory.cs (design-time conn → 'Data Source=doenercontrol.db', UseSqlite), Api/appsettings.json + appsettings.Development.json (AppDb → 'Data Source=doenercontrol.db'). Extends DoenerControlApp into the real harness: unique temp-file SQLite DB per fixture instance, ConfigureServices removes the real DbContextOptions and re-adds UseSqlite pointed at the temp file, ConfigureConfiguration injects an in-memory TestConfig (test pepper, JWT key, issuer/audience, cutoff 11:30, deliberately-weak Argon2 params), registers a FakeTimeProvider, SetupAsync runs db.Database.MigrateAsync() (NOT EnsureCreated) then a seed hook, TearDownAsync clears SQLite pools + deletes the file. Adds a shared ResultExtensions helper mapping Result/Result<T> status → HTTP (200/201/204/400/404/409) used by all later endpoints. |
| F1 | Core entities, enums, EF configurations, InitialCreate migration, menu seed | backend | F0 | All POCO entities in Core/Entities (User, OrderDay, Order, Debt, MenuItem, RefreshToken, Notification) with zero EF attributes and nullable non-virtual navigations, plus Core/Enums (ProductKind, MeatType, PizzaVariant, Sauce [Flags], OrderDayStatus, PaymentStatus, UserRole, NotificationKind) with explicit numeric backing values. One IEntityTypeConfiguration<T> per entity in Infrastructure/Persistence/Configurations with value converters (Sauce→int, DateOnly→TEXT yyyy-MM-dd, enums→INTEGER), all unique indexes (User.Username; OrderDay.Date; Order composite (OrderDayId,UserId); RefreshToken.TokenHash) and OnDelete(Restrict) on the multi-FK relationships (Debt debtor/creditor, Order user/day) to avoid SQLite multiple-cascade-path errors. Money stored as int cents throughout. Adds DbSet<>s to AppDbContext, HasData seed of the 6 MenuItem rows (exact ids/prices/icons/notes/insider/sort from the mock MENU), and generates the single InitialCreate SQLite migration. |
| F2 | Password hashing service: Argon2id + per-user salt + configurable pepper | backend | F1 | An IPasswordHasher abstraction (Application) + Argon2id implementation (Infrastructure) using Konscious.Security.Cryptography.Argon2 (added to Directory.Packages.props) with the pepper applied as the Argon2id KnownSecret. Produces and verifies the PHC-style string ($argon2id$v=19$m=..,t=..,p=..$salt$hash) with a per-user 16-byte random salt and 32-byte output. A PasswordHashingOptions record (memory/iterations/parallelism/pepper) bound from config with ValidateDataAnnotations().ValidateOnStart() so the app refuses to boot on a missing/short pepper. Constant-time verify; supports opportunistic re-hash when stored params differ. No DB, no HTTP — pure hashing service. |
| F3 | Auth backend: login/refresh/logout/change-password endpoints, JWT-in-cookie, CSRF, secured-by-default, forced-change gate, user seeder | backend | F1, F2 | The full auth HTTP surface and security wiring. Endpoints: Login (POST /api/auth/login, AllowAnonymous, Throttle 10/60), Refresh (POST /api/auth/refresh, AllowAnonymous, Throttle 20/60), Logout (POST /api/auth/logout), ChangePassword (POST /api/auth/change-password), GetMe (GET /api/auth/me) — each its own file with Request/Validator/Response and an IAuthService/IUserService returning Result<T>. Program.cs: AddAuthenticationJwtBearer with JwtBearerEvents.OnMessageReceived copying the dc_access cookie into the token, ValidIssuer/Audience, ClockSkew 30s; UseAuthentication/UseAuthorization before UseFastEndpoints; secured-by-default. Cookie design (dc_access httpOnly/Secure/SameSite=Strict, dc_refresh scoped to /api/auth, dc_xsrf non-httpOnly). Refresh-token rotation with SHA-256 hashing, FamilyId, and reuse→family-revoke. A global CSRF pre-processor (double-submit X-XSRF-TOKEN vs dc_xsrf on non-GET non-anonymous) and a forced-change pre-processor (403s everything except change-password/logout while MustChangePassword). Per-account lockout (5 fails→15 min) + dummy-verify on unknown user. An idempotent DbSeeder provisioning the ~13 employees (usernames, DisplayName, AvatarColorHex, PayPal handles where known, MustChangePassword=true, generated temp password hashed via F2). A scoped ICurrentUser accessor. |
| F4 | Frontend theme extension + Machine-Eye design-system primitives | frontend | — | Extends (never replaces) web/src/styles/theme.ts via module augmentation + createTheme merge: palette additions (teal, muted, label, success, warning/orange, gold, paypal, pinkTint, subtle, background login #FBF7F6 / app #ECEAEA) with ButtonPropsColorOverrides for paypal/navy; a theme.schraege field carrying the bevel recipe (clip polygons + overlay rgba); a radii field (sm/md/lg/xl/pill); a single GlobalStyles registering pulseDot/slideDown/spin360 keyframes; MuiTextField/MuiOutlinedInput defaults matching the mock; an eyebrow typography variant. Plus the pure-UI shared primitives in web/src/components/: RedChromeSurface (slot shell with Schräge), Schraege, LiveDot, StatCard, Avatar, TierCard, TierRow, PayPalButton, SegmentedControl, MultiSelectChips, SelectChips, Toggle, PushToast, MedalRow, ProductCard, IconChipBox, PrimaryButton/GhostButton, and PageLayout (compound Header/Content). All FC<Props>, theme tokens only, positioning via parent sx, no useMemo/useCallback/memo. |
| F5 | Pure backend calculators: tier, leaderboard, streak, money, PayPal link, name formatter, push text | backend | F1 | Application-layer pure functions (value-in/value-out, no DB, no HTTP) that own the algorithmic risk: TierCalculator (ports computeTier exactly — 15 priority branches, first-match-wins, inputs garlic/spicy/kalbR/haehnR/noSauce/allThree/product counts/uniq/n/meated over a list of order-fact value objects; the 15 emoji/name/tagline/tags as a static readonly catalog), LeaderboardCalculator (group+count+sort+medals+'Nur noch X bis Platz N'), StreakCalculator (consecutive ISO-weeks with an order vs a 'today'), MoneyFormatter (cents→'7,50 €' German + cents→'7.50' PayPal), PayPalLinkBuilder (cents+handle→https://paypal.me/{handle}/8.50EUR, null when handle missing), NameFormatter (DisplayName→initials/first name), NotificationText (synonym→push template). These are consumed by F8/F11/F12/F13 but built and tested standalone here. |
| F6 | Frontend foundation: apiClient, auth feature (context + router guard), login screen | frontend | F4 | The cross-cutting lib and the auth feature wiring the SPA together. lib/api/apiClient.ts (fetch wrapper, credentials:'include', reads dc_xsrf cookie → X-XSRF-TOKEN on non-GET, typed ApiError parsing ProblemDetails, never imported by components), lib/api/refresh-link.ts (single-flight 401→/api/auth/refresh→retry, hard-logout on failure), lib/format/money.ts, lib/format/initials.ts, lib/paypal/buildPayPalMeUrl.ts, extended lib/router.ts (context {auth,queryClient}) + lib/query-client.ts (QueryCache onError→logout). The auth feature: schemas.ts (LoginResponse/Session/LoginForm Zod), api.ts (useLogin/useLogout/useChangePassword/useSession), auth-context.ts (AuthProvider + useAuth with status machine, throws outside provider), use-login-form.ts (RHF+zodResolver). Routes: __root extended with AppProviders, _auth.tsx pathless guard (beforeLoad reads router context.auth, redirects to /login with redirect search param), login.tsx (LOGIN screen composing F4 primitives — logo, eyebrow, fields, Anmelden button, ServerStatusLine with LiveDot), passwort-aendern.tsx (forced-change). main.tsx InnerApp passes useAuth() into RouterProvider context. |
| F7 | Menu endpoint (backend) | backend | F3, F5 | GET /api/menu (authenticated, EndpointWithoutRequest) returning the 6 seeded MenuItem rows as MenuItemSummaryDto (id, name, defaultPriceCents, defaultPriceLabel German, kind string, materialIcon, note, isInsider, sortOrder) ordered by SortOrder, plus the static order-vocabulary lists (PizzaVariants, SauceOptions, MeatOptions) so the SPA gets the whole order vocabulary in one call. IMenuService.GetMenuAsync over the DbContext; uses MoneyFormatter from F5 for the label. |
| F8 | OrderDay backend: open/close/today + in-app notification broadcast | backend | F3, F5 | The Döner-Tag lifecycle. Endpoints: OpenDay (POST /api/order-days/open, idempotent — picks a random synonym, computes OrderCutoffAt from config for today via TimeProvider, inserts OrderDay; on the unique-Date race re-reads and returns the existing open day; broadcasts a Notification to every OTHER active user with the rendered push text), GetTodayOrderDay (GET /api/order-days/today → IsOpen + OrderDayDetailsDto with synonym, rendered PushText, cutoff label, IsPastCutoff, participant count, pickup names, order rows with assembled product/description labels, ICanStillOrder, MyOrderId), CloseDay (POST /api/order-days/{id}/close → flips to Closed, sets ClosedAt; the debt-creation hook is added in F10), GetOrderDayById (GET /api/order-days/{id}). Plus the Notification feed endpoints GetNotifications + MarkNotificationRead and INotificationService.BroadcastDayOpenedAsync. Uses F5 NotificationText/NameFormatter/MoneyFormatter. |
| F9 | Orders backend: upsert/get/delete mine + pickup claim/release | backend | F8 | One order per user per day with edit-until-cutoff. Endpoints: PutMyOrder (PUT /api/order-days/{dayId}/orders/mine — upsert on composite unique (OrderDayId,UserId); validator does shape + cross-field checks, meat required for doener-kind & null for pizza, pizzaVariant required for pizza & null otherwise, sauces empty for pizza; service is authoritative on kind, freezes Kind + PriceCents from the menu item at write time, rejects after cutoff or when closed via the OrderWindow predicate from F5, bumps UpdatedAt on edit), GetMyOrder (prefill on edit), DeleteMyOrderById/mine (withdraw before cutoff), ClaimPickup (POST .../pickup/claim — requires an existing order, sets IsPickup=true, returns all pickup names), ReleasePickup (sets IsPickup=false). Designed for ≥1 pickup via the per-Order IsPickup flag. |
| F10 | Debts backend: create ad-hoc/list mine/owed-to-me/settle + close-day debt generation | backend | F9 | The cross-day debt ledger. Endpoints: GetMyDebts (GET /api/debts/mine → OpenCount, TotalCents, German TotalLabel, rows with creditor name/initials/color, reason, day label, amount, server-built PaypalUrl via F5 builder — null when creditor handle missing — only Status=Open), GetDebtsOwedToMe (GET /api/debts/owed-to-me), SettleDebt (POST /api/debts/{id}/settle — caller must be debtor or creditor else NotFound, already-settled→Conflict), PostDebt (POST /api/debts — ad-hoc like Ayran-Schulden). Wires the close-day debt-creation hook into the F8 CloseDay flow: on close, for each pickup person, each non-pickup participant gets a Debt owing their own order price. |
| F11 | Dashboard stats endpoint (backend) | backend | F5, F9, F10 | GET /api/stats/dashboard (authenticated) returning the 4 stat-card values all DERIVED via SQL over Orders/Debts: TotalOrders (count for caller), MonthSpendCents + German label (sum of PriceCents in the current calendar month), OpenPaymentsCount + total + label (caller's Open debts), StreakWeeks (consecutive ISO-weeks ending this week with ≥1 order). Composes the F5 StreakCalculator + MoneyFormatter over real EF reads; IStatsService.GetDashboardAsync. |
| F12 | Leaderboard endpoint (backend) | backend | F5, F9 | GET /api/leaderboard?year= (authenticated, optional year defaulting to current via TimeProvider) returning Year, ranked entries (rank, userId, displayName, initials, avatarColorHex, count, isMe, medal 🥇/🥈/🥉 for top 3) and DoenerToNextRank/NextRank — all DERIVED via GROUP BY UserId COUNT(*) over Orders in the year, ordered desc, composing the F5 LeaderboardCalculator over real EF reads. ILeaderboardService.GetForYearAsync. |
| F13 | Tier endpoints (backend): mine + catalog | backend | F5, F9 | GET /api/tiere/mine (emoji, name, tagline, tags, OrderCount in window) and GET /api/tiere (all 15 catalog entries with IsMine on the caller's match), both DERIVED by running the F5 TierCalculator over the caller's Orders with CreatedAt >= now-90d. ITierService.GetMineAsync/GetCatalogAsync read real EF order facts and feed the pure calculator; n=0 → fallback 🌯 Der solide Döner-Bürger with OrderCount=0. |
| F14 | Profile PayPal-handle endpoint (backend) | backend | F3 | PUT /api/profile/paypal-handle (authenticated) capturing/updating/clearing the caller's PayPal.Me handle (validator: when present MaxLength 40 + ^[A-Za-z0-9]+$ so the URL stays valid; null clears). Returns the handle + PayPalHandleSet flag. IProfileService.UpdatePayPalHandleAsync. This closes the product gap that drives every payment link. |
| F15 | Frontend: Order screen + Success screen | frontend | F6, F7, F9, F10 | The order feature (features/order): useMenu/useMyOrder/useSubmitOrder hooks + Zod schemas, OrderFormProvider context + use-order-form (RHF+zodResolver, defaults from menu+existing order) + use-order-config (watches productId→derives kind/meatVisible/pizzaVisible), and the OrderPage composing F4 primitives — ProductGrid of ProductCard ×6 (INSIDER badge, red-when-selected, submit disabled until a product is chosen), conditional PizzaVariantField/MeatField/SauceField (render-phase gated), ExtraField, money PriceField (cents⇄'8,50'), PickupToggleCard. On submit it upserts then navigates to /erledigt?orderId=… The success feature (features/success): useOrderResult(orderId) reading the validated search param, SuccessPage with OrderSummaryCard and a PaymentSection that mounts one of OwesAbholerCard (PayPalButton with the prefilled paypal.me href) or PickupCollectCard by result.isPickup; GhostButton back to /. Routes order.tsx + erledigt.tsx (validateSearch). |
| F16 | Frontend: Dashboard / Home screen | frontend | F6, F8, F10, F11, F12, F13 | The dashboard feature (features/dashboard) plus the order-day, payments, leaderboard, tiere-card, and notifications slices it composes. DashboardProvider context fed by useDashboard/useTodayOrderDay/useOpenDebts/useAuth (exposes greeting/stats/tier/leaderboard/day/debts/operations, throws outside provider). DashboardPage (Layout slot shell, bg app) composing F4 primitives: PushToast (notifications/useToast, fired after useOpenDay succeeds), PageLayout.Header→RedChromeSurface with LivePill, GreetingBar with AvatarMenu, TierCard (→/tiere), StatsGrid of StatCard ×4, DoenerTagSection switching DayClosedCard (Ich will heute Döner!→useOpenDay) vs DayOpenCard (sub-header, NotificationPreview, AbholerLine, OrderRow ×N, →/order), LeaderboardCard with MedalRow ×N + footer, OpenPaymentsCard with DebtRow ×N + PayPalButton. useOpenDay invalidates dashboard+order-day keys and triggers the toast. Route _auth/index.tsx. |
| F17 | Frontend: Döner-Tiere catalog screen + profile PayPal-handle UI | frontend | F6, F13, F14 | The tiere feature (features/tiere): useTierCatalog hook + Zod schema, TierePage composing F4 primitives — RedChromeSurface header with BackButton, explainer, TierList of TierRow ×15 (emoji, name, 'DEIN TIER' badge + pink/red highlight when isMine, tagline), GhostButton back to /. Route _auth/tiere.tsx. Plus the profile feature (features/profile): useProfile/useUpdatePayPalHandle + PayPalHandleForm (RHF+zodResolver), surfaced from the AvatarMenu, so a user can supply/edit the handle that drives every payment link. |
| F18 | Optional: admin provisioning endpoint + dev history seed | backend | F3, F1 | Schema-ready admin provisioning closing the registration gap: POST /api/admin/users (Roles('admin')) generating a random temp password (Argon2id-hashed via F2 with per-user salt+pepper, MustChangePassword=true), returning the initial password once; duplicate username→Conflict; IUserAdminService.ProvisionAsync. Plus an optional Development-only history seed generating ~3 months of OrderDay+Order rows (including Markus's exact 12-order history so his computed tier renders 🐺 in the running app), guarded so it never runs in test/prod. |


---

## Open decisions & risks

### Open product/technical decisions

- [dataModel] With one or more Abholer, which pickup person does each non-pickup debtor owe — split evenly, assigned round-robin, or does the order-finalizer pick one designated collector? This determines whether Debt.CreditorUserId can be set deterministically.
- [dataModel] What triggers a day to close and thereby crystallize debts — an auto-close job at OrderCutoffAt, or a manual action by the opener/pickup? The Debt-creation code path depends on this.
- [dataModel] Is the 3-month tier window exactly 90 days, or 'last 3 calendar months', and is the boundary inclusive? The mock just passes a fixed array; the real query needs a precise predicate to match expectations.
- [dataModel] Do PayPal handles for all 13 employees exist for seeding, or should users self-enter them via a profile screen on first login (gating the PayPal button until set)? Affects whether PayPalHandle can be NOT NULL.
- [dataModel] Should the leaderboard count ALL orders ever or only Doener-kind orders (the label says 'Döner-Bestenliste' but the mock counts 142/119/97 without specifying)? This changes the COUNT predicate and the 'Döner gesamt' stat.
- [dataModel] Are ad-hoc / non-order debts (the mock's 'Ayran-Schulden') a real feature requiring a create-debt endpoint, or just mock decoration? Determines whether Debt.OrderId/OrderDayId nullability and a manual-debt path are needed in v1.
- [security] Deployment topology: will the .NET API and the React app be served from the SAME origin (e.g. API mounted under the same host, or behind one reverse proxy) or split (api.doener.schulz.st vs app.doener.schulz.st)? This decides SameSite=Strict (same-origin, recommended) vs SameSite=Lax + explicit CORS-with-credentials (split). Everything in the cookie/CSRF section assumes same-origin unless told otherwise.
- [security] Provisioning UI scope: is there an in-app admin screen for creating the 13 employees + setting their PayPal.Me handle, or is provisioning purely a seed/CLI step for v1? This determines whether we need an 'admin' role + secured POST /users endpoints now, or just a seeder. The mock shows no admin screen, so I assume seed-only for v1 with a forced-password-change-on-first-login flow.
- [security] Initial password handling: admin-set known password (told to each colleague verbally) vs system-generated random temp password shown once at provisioning? Recommendation is a generated temp password + MustChangePassword flag forcing a change before any other endpoint is usable. Confirm the office is OK with a forced first-login password change.
- [security] Is a 'forgot password' / self-service reset needed for v1, or is admin re-provisioning (reset to a new temp password) acceptable for a 13-person office? Recommendation: skip self-service reset for v1 (no email infra implied anywhere in the spec); admin reset only.
- [security] Token lifetimes: proposed access token 15 min, refresh token 14 days with sliding rotation. For an internal once-a-week-usage app a longer-lived refresh (so people aren't re-logging-in every Thursday) is friendlier. Confirm 14 days is acceptable, or extend to 30.
- [api] With one-or-more Abholer, what is the exact debt-assignment rule on close? Single pickup collects from everyone (assumed), or debtors distributed across multiple pickups, or each non-pickup owes a share of the total shop bill rather than their own item price?
- [api] When is a Debt created — at order submit (so the success-screen PayPal link is backed by a real debt), at Bestellschluss, or at explicit CloseDay? The mock implies 'immediately at submit'; the data-model narrative says 'when a day's orders are finalized'. Which wins?
- [api] Notifications: in-app feed only for v1 (my recommendation), or must it be real browser Web Push with a service worker + VAPID keys + PushSubscription storage?
- [api] Day auto-close: should a background hosted service close the day at OrderCutoffAt (and create debts), or is closing always manual via #10, or lazy-close on the next read after cutoff?
- [api] Is the optional admin provisioning endpoint (#27) in scope for v1, or is provisioning strictly seed/CLI-only (in which case #27 is omitted and only the Admin role + seeder ship)?
- [api] Should GetMenu (#7) also return the PIZZAS/SAUCES/MEAT vocabularies (my recommendation, one round-trip), or should the SPA hardcode those closed enums client-side?
- [api] Can a user still EDIT or claim/release pickup after the day is Closed (e.g. fixing a price the Abholer disputes), or is everything frozen at cutoff/close? Affects #12/#14/#15/#16 guard conditions.
- [frontend] German-only: confirm we drop the /$lang/ route prefix and i18n locale-file machinery entirely (plain German copy.ts), overriding the frontend-work i18n rule — yes/no?
- [frontend] Dashboard data: one aggregate GET /api/dashboard (recommended, avoids mobile waterfall) vs. separate /stats /tier /leaderboard /debts endpoints — which contract should the api.ts hooks target?
- [frontend] Tier catalog source: does the backend return the 15-tier catalog + isMine flag (single-sourced with the backend tier service, recommended), or does the frontend keep TIER_CATALOG copy and only fetch the user's computed tier?
- [frontend] Success contract: confirm GET /api/orders/{id}/result returns { productLabel, priceCents, detail, isPickup, abholer{name,initials,colorHex,payPalHandle}, collectCents, collectCount } so the success screen is fully server-driven from orderId.
- [frontend] Multiple pickups (CONTEXT says ≥1): when there are several Abholer, who does a non-pickup user owe? The home/success UI needs a rule (e.g. assigned creditor per debt from the backend). Frontend renders whatever creditor the Debt carries — confirm the backend resolves the split so the UI just shows one PayPalButton per debt.
- [frontend] v1 notification mechanism: in-app PushToast only (recommended) vs. real Web Push + service worker — which for the first release?
- [frontend] Avatar colors: AvatarColorHex comes from the User record (data model) — confirm the dashboard/leaderboard/order payloads include each referenced user's colorHex + displayName so Avatar/initials render without an extra lookup.
- [tests] Order create-vs-edit semantics: is a second POST for the same (day,user) a 409 Conflict, or an idempotent upsert that edits the existing order? The data-model says 'add/edit (upsert) until cutoff' but also maps a duplicate insert to Conflict. The red test that pins this must be told which — affects PostOrderTests vs PutOrderTests.
- [tests] Who/what closes a day (auto-close at cutoff via background job vs manual close endpoint)? This determines whether we need a background-service integration test (poll for Status flip after advancing the clock) or just a manual PostCloseDay endpoint test.
- [tests] When exactly are Debts created — at cutoff/auto-close, on a manual 'finalize day', or incrementally per order? The debt-creation integration test's trigger depends on this.
- [tests] Multiple Abholer (>=1 pickup) debt-split rule: when there are 2+ pickup users, who owes whom (split evenly? each non-pickup assigned to one pickup?)? Needed before writing the multi-pickup debt test; the mock only shows a single Abholer.
- [tests] Web-push delivery for v1: real Web Push + service worker, or an in-app notification feed? This decides whether there is any notification-delivery integration test at all, or only the pure NotificationText builder test (synonym → push string).
- [tests] Deployment topology (same-origin SPA+API behind one proxy vs separate origins): drives whether cookies are SameSite=Strict with no CORS, or SameSite=Lax + CORS AllowCredentials with an origin allow-list. The CSRF/cookie integration tests assert different things depending on this; the security foundation flags it as must-pin.
- [tests] Refresh token lifetime (~14 days vs longer for a weekly-use internal app): only affects the exact clock advance in the refresh-expiry test, but should be confirmed so the test encodes the real policy boundary.

### Risks flagged

- [dataModel] Tier-math fidelity is exact-equality-sensitive: the mock uses strict `kalbR === 1` and `haehnR === 1` with JS floating-point division. Porting to C# must replicate the same fractions and the `>= Math.max(2, n*0.4)` thresholds precisely, and the 90-day window boundary (inclusive vs exclusive) must be pinned by a test against the seeded MY_HISTORY fixture, or computed tiers will diverge from the mock.
- [dataModel] Multiple-pickup debt splitting is under-specified (CONTEXT.md says >=1 Abholer; mock shows one). The model assumes each non-pickup debtor owes exactly one creditor the full price of their own order, but with 2+ pickups there is no defined rule for which pickup each debtor pays. A Debt has a single CreditorUserId, so the assignment policy must be decided before the order-finalization service is built.
- [dataModel] Debt creation timing is ambiguous: debts must be generated when a day is finalized, but the auto-close vs manual-close mechanism (a flagged product gap) is undecided. If a day never closes, debts never materialize. The Debt lifecycle is coupled to the unresolved 'who/what closes a day' question.
- [dataModel] Storing Order.Kind and PriceCents as frozen denormalized copies is deliberate (history immutability), but means a MenuItem price/kind correction will NOT retroactively change past orders' tier/stat contribution. This is the correct behavior but should be confirmed as intended, since it differs from a naive join-at-read model.
- [dataModel] SQLite single-writer serialization is fine for 13 users but the integration-test harness (fresh temp-file DB per test) must ensure connections are disposed/pooling disabled so the temp file can be deleted on teardown on Windows/macOS; a leaked open connection will lock the file. Use `Pooling=False` or `Microsoft.Data.Sqlite` connection lifetime control in the WebApplicationFactory fixture.
- [dataModel] DateOnly and DateTimeOffset both map to TEXT on SQLite; range/ordering queries on these (leaderboard-by-year, 90-day window, monthly spend) rely on ISO-8601 lexicographic ordering. UTC normalization must be enforced everywhere or string comparison will misorder mixed-offset values.
- [security] FastEndpoints' JwtBearer reads the Authorization header by default; delivering the JWT in an httpOnly cookie requires a custom JwtBearerEvents.OnMessageReceived to lift the token from the cookie. If implemented sloppily this silently falls back to header-only and the cookie auth never engages. The integration test MUST assert that an authed request with ONLY the cookie (no Authorization header) succeeds.
- [security] Argon2id is CPU/memory-bound. With WebApplicationFactory + a fresh SQLite DB per test, real password verification in every auth test adds real wall-clock cost. Tests should seed users with a low-cost Argon2 parameter set bound from test configuration (still real Argon2id, just memory=8MB/iter=1) so the red-green loop stays fast while production uses the hardened params.
- [security] SameSite=Strict will block the auth cookie on top-level cross-site navigations (e.g. the PayPal.Me return redirect, or a link opened from the Teams/Slack push). For a same-origin SPA+API deployment Strict is safe; if the API is ever on a different subdomain than the web app, the cookie won't be sent and login will appear to silently fail. Deployment topology (same origin vs split) must be pinned before choosing Strict over Lax.
- [security] The PEPPER is a single global secret applied to every password. Rotating it invalidates ALL stored hashes simultaneously (no per-user re-hash-on-login migration is possible because the old pepper is gone). A pepper-version column + keeping the prior pepper available during a rotation window is the only safe rotation path; without it, a pepper change is a forced password reset for all 13 users.
- [security] Refresh-token rotation with reuse-detection requires storing the token hash AND a 'used/replaced' state. FastEndpoints' built-in RefreshTokenService.PersistTokenAsync/RefreshRequestValidationAsync gives the hooks but does NOT implement reuse-detection or family revocation for you — that logic (revoke the whole token family on replayed token) must be written and tested explicitly, or stolen refresh tokens stay valid until natural expiry.
- [security] Account lockout counters in SQLite under concurrent login attempts can race. A simple read-increment-write of FailedAttempts is not atomic; two parallel wrong-password attempts can both read the same count. Lockout should be enforced via a DB-level conditional update or accept that the threshold is approximate. Combined with the FastEndpoints Throttle() per-IP limit this is acceptable for 13 users but should be a conscious decision.
- [api] Multiple pickups + debt splitting is underspecified: with ≥1 Abholer, who owes which pickup? The plan assumes CloseDay creates debts where each non-pickup participant owes ONE designated/first pickup their full order price (matching the mock's single 'Abholer heute'). True multi-pickup money-splitting (e.g. round-robin assignment of debtors to pickups, or splitting the shop bill) is not defined and the CloseDay debt-creation rule will need a concrete policy before #10 is implemented.
- [api] Debt creation timing: the plan creates Debts on CloseDay (#10), but the mock shows the success screen's PayPal link and the Abholer's collect-total IMMEDIATELY after a single order submit (before any close). If product wants the PayPal link live at order time (not at close), debt creation must move to PutMyOrder/cutoff and CloseDay becomes idempotent reconciliation. This timing decision changes #10/#12 and must be pinned.
- [api] Notification mechanism: I recommend an in-app feed (new Notification entity) for v1 rather than real Web Push + service worker. This adds an entity NOT in the agreed Data-Model and must be ratified by the persistence agent; if real Web Push is required, add PushSubscription storage + a VAPID web-push sender and the OpenDay broadcast changes substantially.
- [api] Auto-close ownership: CloseDay (#10) exists, but who/what triggers it at the 11:30 Bestellschluss (background hosted service / cron / lazy close on next read) is an open product gap. Without an auto-closer, debts are never created unless someone manually closes — interacts with the debt-timing risk above.
- [api] PutMyOrder cross-field validation depends on the menu item's Kind, which the validator cannot authoritatively know (Kind lives in the DB). The validator does shape checks against the enum vocabularies; the service is the authority and may reject a payload the validator passed (e.g. Meat sent for a pizza ProductId). This split must be implemented as service-side Validation results, not just FluentValidation.
- [api] SQLite has no native DateOnly/decimal; relying on int-cents + DateOnly→TEXT('yyyy-MM-dd'). Year/month/ISO-week aggregation for Stats (#21) and Leaderboard (#22) must be done with care on SQLite (string date functions or in-memory grouping after a date-range filter) to avoid provider-translation failures — these queries need real-DB integration tests, not just unit tests.
- [frontend] Single-locale override: frontend-work mandates /$lang/ route prefix + i18n locale files, but this product is German-only. I recommend dropping the prefix and using plain German copy.ts constants. This deviates from the skill — confirm the orchestrator accepts the override (the alternative is a one-language i18n setup that adds ceremony for no benefit).
- [frontend] order→success state transfer via URL search param (orderId) + refetch assumes the backend exposes GET /api/orders/{id}/result returning the finalized order + collect/abholer summary. If the backend only returns the order on submit, success must instead pass minimal state — but URL+refetch is the refresh-safe choice and should drive the API contract.
- [frontend] Web Push is unresolved (known product gap): the design ships the 'day opened' notification as an in-app PushToast for v1. Real Web Push needs a service worker + VAPID + backend push subscriptions — out of scope here but the PushToast UI is reused either way. Confirm v1 = in-app only.
- [frontend] Auth via httpOnly cookie means the SPA cannot read the JWT; session state is derived from GET /api/auth/me. A cold load shows a brief 'loading' auth status before the guard resolves — handled by router beforeLoad awaiting useSession, but requires /api/auth/me to be fast and to 401 cleanly when anonymous.
- [frontend] 401→refresh→retry single-flight in refresh-link.ts must coordinate with the security design's refresh-token rotation + reuse-detection (family revoke). A botched retry loop could trigger false family-revocation and force re-login. This interceptor needs its own integration test against the real refresh endpoint.
- [frontend] MUI v9 + React 19 + React Compiler: the theme module-augmentation for custom palette colors (teal/paypal/gold) and the custom theme.schraege field must compile under the project's strict TS. Confirm MUI 9 supports the createTheme custom-field augmentation pattern used (it does via ThemeOptions augmentation, but worth a smoke build).
- [frontend] Material Icons: the mock uses 'Material Icons Outlined' webfont, but the app uses @mui/icons-material (SVG). Icon names map (kebab_dining→KebabDiningOutlined etc.) but a few mock icons (workspace_premium, takeout_dining, wrap_text) must be verified to exist in @mui/icons-material; CSP in any artifact/preview blocks the Google icon webfont, so SVG icons are mandatory.
- [frontend] Forced-password-change gate (mustChangePassword): the route /passwort-aendern must be reachable while every other authed route 403s server-side. The client guard must mirror this (redirect to /passwort-aendern when session.mustChangePassword) or the user lands on a 403'd dashboard.
- [tests] SQLite isolation choice: a temp *file* per test class is the recommended default, but if a future suite proves file-handle churn (esp. on Windows CI) is slow or flaky, the documented fallback is a single shared-cache `:memory:` connection kept open for the fixture lifetime. Picking `:memory:` naively (closing the connection between scopes) silently drops the schema mid-test — must not be done.
- [tests] FastEndpoints.Testing gives one AppFixture per test *class*, so DB isolation is at class granularity, not per-method. Tests within a class share a DB and run sequentially; a subagent that writes order-dependent tests or mutates shared seeded users will create flaky cross-test coupling. Mitigation enforced by the checklist: each test provisions/creates the rows it mutates rather than relying on siblings.
- [tests] Time-dependent behavior (cutoff, edit-window, refresh expiry, streak, 'diesen Monat') depends on a `TimeProvider`/`FakeTimeProvider` being injected end-to-end (host + services). If any service reads `DateTimeOffset.UtcNow` directly instead of the injected clock, those tests become non-deterministic and tempt a `Task.Delay` (banned). The data-model/security foundations both call for `TimeProvider` — this must actually be wired or the time tests are unreliable.
- [tests] Cookie-based auth in tests requires the fixture's HttpClient to NOT follow redirects automatically and to replay Set-Cookie correctly; FastEndpoints' typed `Client.POSTAsync<TEndpoint,...>` helpers may not surface raw Set-Cookie headers cleanly, so login/refresh/logout tests likely need a raw `HttpClient` + manual cookie handling. This is extra harness code the auth feature subagent must build before its first green test.
- [tests] MSW must be added to web devDependencies (currently absent) and registered in `web/src/test/setup.ts` with server lifecycle hooks; without it, frontend submit-payload and response-handling tests have no legitimate network seam and risk regressing into hook-mocking (a banned mock-only pattern).
- [tests] The weak test Argon2id profile (8 MiB / t=1) keeps the loop fast but means tests do NOT validate production hardening params. A separate, non-CI-blocking assertion (or a config-binding unit test) should confirm the *production* `PasswordHashingOptions` parse to the OWASP values, so a misconfigured prod profile isn't masked by the fast test profile.
- [tests] Exhaustive 15-branch tier coverage relies on the Application `TierCalculator` operating on plain value inputs (order facts), not on EF entities or the DbContext. If the tier logic is written to query the DbContext directly, it cannot be unit-tested purely and gets pushed into slow integration tests, undermining the split. The calculator must take a collection of simple records.


---

## Completeness critique

## Completeness Critique — Schulz Döner Control plan

I read the mock (`mocks/Schulz Döner Control.dc.html` lines 1–640: login, dashboard, order, success, tiere markup + the inline `MENU`/`SEED`/`DOENER_SYNONYME`/`MY_HISTORY`/`computeTier`/`TIER_CATALOG`/`submitOrder`/`renderVals`), `CONTEXT.md`, both skills, the scaffold (`server/src/...`, `tests/...DoenerControlApp.cs`), and verified the FastEndpoints 8.1 / FastEndpoints.Testing 8.1 API surface in the local NuGet cache and the installed web deps.

The plan is strong and largely faithful, but it contains **build-breaking technical errors**, **several frontend↔API endpoint contradictions that will block integration**, and a few **completeness/security gaps**. Below are the load-bearing problems, ordered by severity.

### High-severity (will not compile / will not wire up)

1. **`Result`/`Result<T>` has no `Unauthorized`/`Forbidden` status, but the whole auth+authz design depends on mapping to 401/403.** `Core/Result.cs` defines exactly `Success/NotFound/Conflict/Validation`. The Security + API plans say login/refresh/change-password map to **401** and admin endpoints to **403**, and that there's a shared `ResultExtensions` Result→HTTP mapper. There is no Result status that carries "unauthorized". The skill also bans bare `Failure()`. Either extend `ResultStatus` (add `Unauthorized`, `Forbidden`) — which touches Core and must be a deliberate decision — or have the endpoints map auth failures directly to status codes without round-tripping a Result status. This is unresolved across both security and API sections and every auth endpoint depends on it.

2. **The test harness overrides a method that does not exist on `AppFixture<T>`.** The test plan's `DoenerApp` overrides `ConfigureConfiguration(IConfigurationBuilder)`. I verified against `FastEndpoints.Testing` 8.1 XML: the only overridable members are `ConfigureApp(IWebHostBuilder)`, `ConfigureServices(IServiceCollection)`, `PreSetupAsync`, `SetupAsync`, `TearDownAsync` (+ `ConfigureAppHost`). There is no `ConfigureConfiguration`. Test config (pepper, JWT key, weak Argon2) must be injected via `ConfigureApp` (`b.UseSetting(...)` / `b.ConfigureAppConfiguration(...)`), not the invented override. As written F0/F3 won't compile.

3. **`FastEndpoints.Security` is a separate NuGet package that is NOT in the dependency list.** The Security plan asserts "FastEndpoints security comes in the existing FastEndpoints 8.1 package (`FastEndpoints.Security` namespace)". I confirmed `AddAuthenticationJwtBearer`, `JWTBearer.CreateToken`, etc. are NOT in the core `FastEndpoints` 8.1 assembly/XML and `FastEndpoints.Security` is not restored. `Directory.Packages.props` must add `FastEndpoints.Security` (8.1.0) — otherwise none of the JWT/cookie wiring exists. (`Throttle(...)` IS in core — that part is fine.)

4. **Frontend calls multiple endpoints the API plan does not define, and uses different routes for ones it does.** Concrete contradictions: (a) Frontend `success` uses `order.useOrderResult` → `GET /api/orders/{id}/result`; the API inventory has **no order-by-id / order-result endpoint at all** (only `/order-days/{dayId}/orders/mine`). The whole URL-driven success screen (`/erledigt?orderId=…` then fetch) has no backend. (b) Frontend `useSubmitOrder` → `PUT /api/order-days/{id}/my-order` vs API `PUT /api/order-days/{dayId}/orders/mine`. (c) `useOpenDay` → `POST /api/order-days` vs API `POST /api/order-days/open`. (d) `payments.useOpenDebts` → `GET /api/debts/open` and `useSettleDebt` → `POST /api/debts/{id}/settle` vs API `GET /api/debts/mine`. (e) `dashboard.useDashboard` recommends one `GET /api/dashboard` aggregate that the API plan never defines (it ships 5 separate endpoints: `/stats/dashboard`, `/leaderboard`, `/tiere/mine`, `/order-days/today`, `/debts/mine`). Pick one contract per call and reconcile every URL; the success-order-result endpoint in particular is a missing backend slice, not just a rename.

5. **`Order` has no `OrderDayId`-independent identity exposed for the success screen, and there is no endpoint to read an order by its id.** The success flow needs `GET /order/{orderId}` returning product label, price, detail, isPickup, the abholer (name/initials/color/handle), `collectCents`, `collectCount`, and `myPayPalUrl`. None of endpoints 8–16 return that shape by order id. Add the endpoint to the API plan and a Roadmap slice; otherwise F15's success screen cannot be built.

### High-severity (correctness / product logic)

6. **Debt creation on day-close cannot reproduce the mock's per-order amount, because at close time the pickup person's "collect" is the sum of OTHER participants' own prices — but the plan never says a non-pickup who is also… and never handles the multi-pickup split.** The data-model says "each pickup person, each non-pickup participant owes them their own order price" — with ≥1 pickup this double-creates debt (a non-pickup would owe EVERY pickup their full price). CONTEXT.md says "one person pays the shop". The split rule for ≥2 pickups (who collects from whom) is explicitly an open gap and is still unresolved; the close-day algorithm in CloseDay (#10) will produce wrong/duplicated debts. Decide: exactly one "paying" pickup per day collects, or define the split deterministically, before F10.

7. **`computeTier` uses German-accented meat/sauce string keys (`'Hähnchen'`, `'Knoblauch'`, `'Kräuter'`) but the persistence model stores enums (`Haehnchen`, `Kraeuter`).** The tier port must map enum→the exact semantics, and the integration test seeds "Markus's exact 12-order history". The plan's `MeatType.Haehnchen` / `Sauce.Kraeuter` ASCII spellings are fine as enums, but the porting note must be explicit that `kalbR`/`haehnR`/garlic/spicy are computed off the enum, not off German strings — and the canonical Markus fixture (12 orders, all in `MY_HISTORY`) must be reproduced exactly (it yields 🐺 Knoblauch-Wolf: garlic=11/12≈0.917, spicy=4/12≈0.33, so not Bürowaffe). Verify the fixture produces 0.917 garlic, not a rounding that trips ≥0.6/≥0.6. Low risk but must be pinned in the test.

8. **Username case-insensitive uniqueness is asserted but SQLite needs an explicit collation/normalization, which the model omits.** The model says `Username` unique index and "lowercased", and the login validator lowercases input — but nothing enforces case-insensitive uniqueness at the DB. On SQLite a plain unique index is case-sensitive by default; `m.Wagner` and `m.wagner` would both insert. Fix: store a normalized (lowercased) username and put the unique index on that (or `COLLATE NOCASE` on the column). State it in the model + provisioning, and add a test (`Should_RejectDuplicate_When_UsernameDiffersOnlyByCase`).

### Medium-severity

9. **Material Icons Outlined font is not available and the CSP/dependency story is unaddressed.** The mock is saturated with `Material Icons Outlined` (kebab_dining, restaurant, euro, payments, local_fire_department, emoji_events, directions_car, account_balance_wallet, no_meals, campaign, notifications_active, add, check, chevron_right, and the 6 menu icons). The web app has `@mui/icons-material` (SVG components) but NOT the icon font, and the mock pulls fonts from Google CDN. The frontend plan says "Material Icons Outlined" but never specifies bundling the font locally (`@fontsource`-style) nor mapping the mock's string icon names (`kebab_dining`) to MUI SVG components. `MenuItem.MaterialIcon` is stored as the font string (`kebab_dining`) — the frontend must either load the icon font or map each string to an icon component. Decide and add the dependency; otherwise every icon renders as text.

10. **No "current open day id" path for the dashboard "Meine Bestellung abgeben" → Order screen.** The Order route is `/order` with no day id, but `PutMyOrder` is `PUT /api/order-days/{dayId}/orders/mine` and `useMyOrder(orderDayId)` needs a day id. The frontend plan never says how `/order` learns the open day's id (search param? fetched via `useTodayOrderDay`?). Pin it: `/order` should resolve the open day via `GET /order-days/today` (or carry `?dayId=`), and guard against "no open day".

11. **`OrderDay.Date` as `DateOnly` + "one OrderDay per calendar day" unique index conflicts with re-opening after a closed day and with history.** If Thursday is opened, closed, then someone wants to open again same day (e.g. a second wave), the unique index on `Date` blocks it. More importantly, historical OrderDays for tier/leaderboard accumulate one row per past Thursday — fine — but the open/idempotency logic must scope to `Date == today AND Status == Open`, and the unique index on `Date` alone forbids ever having two OrderDays on the same calendar date across all of history (correct for the business rule, but means a closed day can never be superseded). This is a real semantic decision the plan asserts as "non-negotiable" without acknowledging the re-open case. Confirm: one OrderDay per calendar date forever (re-open = re-use the existing row, flip back to Open) — and make CloseDay/OpenDay idempotency reflect that.

12. **`My_HISTORY`/tier window: data-model says `CreatedAt >= now-90d`, but tier is "last 3 calendar months" and `Order.CreatedAt` is when the row was written, not the order day.** Editing an old order bumps `UpdatedAt`; a backfilled/seeded historical order's `CreatedAt` must be the historical day, not insert time. The 3-month window should filter on `OrderDay.Date`, not `Order.CreatedAt` — otherwise the dev history seed (and any backfill) lands all orders at "now" and the window is meaningless. Same issue affects "Diesen Monat €" (must be by order-day month) and the streak (by order-day ISO week). Switch all history-derived windows to `OrderDay.Date`.

13. **CSRF double-submit on a `SameSite=Strict` same-origin SPA: the `dc_xsrf` cookie must be readable by JS, but `Secure`+`Strict` is fine; however the plan never says the SPA must seed/refresh the XSRF cookie on `GET /auth/me` and after refresh.** If the access token is refreshed (new cookies) but the XSRF cookie isn't reissued/rotated, the next mutation can 403. Specify that login AND refresh AND `me` all (re)set `dc_xsrf`, and the apiClient reads it fresh per request (it does read per non-GET, good) — but the refresh-link must re-read the cookie after a refresh round-trip.

14. **Login dummy-verify timing defense needs a real constant hash to verify against, and the test config uses weak Argon2 (8 MiB / t=1) — the "constant timing" property is untestable and arguably moot under the weak profile.** Not a blocker, but the plan claims a timing-constant guarantee it can't assert (the test plan even lists `Should_Return401_When_UserUnknown` "timing-constant via dummy verify" — there's no way to assert timing reliably). Keep the dummy verify for the real behavior (no early-return enumeration via different code paths) but drop any test that purports to assert timing; assert instead that unknown-user and wrong-password return identical response bodies/status.

15. **Notifications entity is acknowledged as "not in the agreed Data-Model" — the data-model section never lists it.** The API plan adds a `Notification` entity in passing and tells the persistence agent to coordinate, but the authoritative Data-Model section (which is called "complete") omits it entirely, and the Roadmap folds notifications into F8 without a migration/seed note. Promote `Notification` into the Data-Model section formally (fields, FKs, `OnDelete(Restrict)` to User/OrderDay, index on `(RecipientUserId, ReadAt)`), and make F8's migration include it. Otherwise the InitialCreate migration (F1) won't have the table and F8 needs its own migration (the plan implies a single InitialCreate).

16. **PayPal amount formatting: mock always uses `toFixed(2)` (dot, 2 decimals). The plan's `toPayPalAmount(cents)` must guarantee 2 decimals (e.g. 800 → "8.00", not "8"). The model text says "dot decimal, e.g. 8.50" but the link builder unit test only pins `850→8.50`.** Add the `800→8.00` / `1000→10.00` boundary case (mock `8.00` appears literally in `payLukas`). Low effort, prevents a malformed `paypal.me/x/8EUR`.

### Low-severity

17. **Leaderboard "Nur noch X Döner bis Platz N" semantics: the mock hardcodes "Nur noch 6 Döner bis Platz 3" where the user is rank 4 (91) and rank 3 is Sara (97) → diff 6 to the next-HIGHER count.** The API field is `DoenerToNextRank`/`NextRank` and the calculator says "diff to next-higher count above the caller". Correct — but pin the test to exactly this case (rank 4 → "6 bis Platz 3"), and define behavior when the caller is rank 1 (no next rank → null, hide the footer). The plan's unit test list covers "below top" but not the rank-1 null case.

18. **Stat card "Döner gesamt" is lifetime (`COUNT(Orders)` all-time) but leaderboard is per-year — the mock shows 1.337 lifetime vs leaderboard counts of 142/119/97/91 (clearly per-year 2026).** The plan gets this right (gesamt=all-time, leaderboard=year) but the dashboard StatsSchema field is named `totalDoener` while CONTEXT says "total Döner ever" — just ensure the stats endpoint counts ALL orders, not year-scoped, and that the test seeds across two years to prove it (the test inventory only says "seed N orders → assert N").

19. **The mock login uses `pin: 'doener123'` and the field is labeled "Passwort" — no PIN concept exists in the data model (good), but the seed/provisioning must hand out a known dev password so the integration `LoginAsync("m.wagner", DemoPassword)` helper works.** The test harness references `TestSeed.DemoPassword`; ensure the dev/test seeder sets a deterministic password for `m.wagner` with `MustChangePassword=false` (otherwise every authed test first hits the forced-change gate and 403s). The plan seeds users with `MustChangePassword=true` — that would break every authenticated integration test. Make the test seed explicitly set `MustChangePassword=false` for the demo login user.

20. **"Abholer heute" is rendered as a single name in the mock open-day card, but the system designs for ≥1 pickup (`PickupNames` list).** Consistent and good. Minor: the dashboard open-day `OrderRowSummaryDto` has `IsPickup`, and the abholer line must render the list; ensure the frontend `AbholerLine` handles 0 pickups (no one claimed yet) gracefully — the mock always shows one. Empty-state copy for "noch kein Abholer" is unspecified.

21. **Roadmap F1 "single InitialCreate migration creating all tables" vs F8 adding the Notification table + F18 dev history seed: if Notification isn't in F1, F8 must add a second migration — acceptable, but the Roadmap's "single InitialCreate" claim and F8's scope ("+ notifications") silently conflict.** Decide whether Notification ships in InitialCreate (preferred, since F1 owns the schema) or as an F8 migration, and make the dependency explicit so the F8 agent isn't surprised. Also F18 "dev history seed" must run before F11/F12/F13 can be manually verified with non-empty data — note it's optional and not a test dependency (tests build their own fixtures), which the plan does say.

### What's solid (no action needed)
STORED-vs-DERIVED is correct (tier/stats/leaderboard/streak all derived; only Order/Debt/Notification stored). Money-as-int-cents, `Sauce` as `[Flags]`, `DateOnly`/`DateTimeOffset` TEXT mapping, `OnDelete(Restrict)` for multi-cascade, temp-file SQLite over `:memory:`, `MigrateAsync` not `EnsureCreated`, Argon2id `KnownSecret` pepper, refresh-token hashed-storage + rotation + family-revoke, secured-by-default + cookie→token via `JwtBearerEvents`, and the "real DB / no mock-only tests" discipline are all correct and well-justified. `Throttle`, `TimeProvider`/`FakeTimeProvider`, per-class fixture isolation, and the tier branch-by-branch unit suite are right.

### Findings

| Severity | Area | Issue | Fix |
|---|---|---|---|
| **high** | Core / Result + auth mapping | Result<T>/ResultStatus only has Success/NotFound/Conflict/Validation (verified in Core/Result.cs), but the Security and API plans map auth failures to 401 and admin to 403 via a shared ResultExtensions mapper. There is no Result status that represents Unauthorized/Forbidden, and the skill bans bare Failure(). | Decide explicitly: either extend ResultStatus with Unauthorized+Forbidden (Core change, update both Result records and the mapper) or have auth endpoints map login/refresh/change-password failures to 401 and Roles() failures to 403 directly at the endpoint without a Result status. Pin this before F3. |
| **high** | Test harness (F0) | DoenerApp overrides ConfigureConfiguration(IConfigurationBuilder), which does not exist on FastEndpoints.Testing AppFixture<T> (8.1). Verified overridable members are ConfigureApp(IWebHostBuilder), ConfigureServices(IServiceCollection), PreSetupAsync, SetupAsync, TearDownAsync. The harness will not compile. | Inject test config (Auth:Pepper, Auth:JwtSigningKey, weak PasswordHashing params) via ConfigureApp using b.UseSetting(...) or b.ConfigureAppConfiguration(...). Remove the invented ConfigureConfiguration override from the F0 design. |
| **high** | Backend packages / security | Security plan claims JWT/cookie helpers (AddAuthenticationJwtBearer, JWTBearer.CreateToken) ship in the core FastEndpoints 8.1 package. Verified they are NOT in the core FastEndpoints 8.1 assembly/XML; they live in a separate FastEndpoints.Security NuGet package that is not in Directory.Packages.props nor restored. | Add <PackageVersion Include="FastEndpoints.Security" Version="8.1.0" /> to Directory.Packages.props and reference it in the Api project as part of F3. (Throttle is in core and is fine.) |
| **high** | Frontend <-> API contract | Frontend feature hooks call endpoints the API plan lacks or names differently: GET /api/orders/{id}/result (no such endpoint exists), GET /api/dashboard aggregate (API ships 5 separate endpoints), PUT /api/order-days/{id}/my-order vs API .../orders/mine, POST /api/order-days vs API .../open, GET /api/debts/open + POST /api/debts/{id}/settle vs API GET /api/debts/mine. | Reconcile every URL to one canonical contract. Specifically add a backend order-by-id result endpoint (see separate finding), and either commit to a /api/dashboard aggregate or change the frontend to compose the 5 endpoints. Align route casing/segments across both plans before F6/F15/F16. |
| **high** | API surface / success screen | The success screen is URL-driven (/erledigt?orderId=...) and fetches GET /api/orders/{id}/result returning product label, price, detail, isPickup, abholer {name,initials,color,handle}, collectCents, collectCount, myPayPalUrl. No endpoint in the inventory returns an order (or this summary) by order id. | Add GET /api/orders/{id} (or /orders/{id}/result) with an OrderResult response and a backend Roadmap slice; service authorizes that the caller owns the order, builds the abholer/collect/PayPal data server-side. Without it F15's success screen has no backend. |
| **high** | Debts / close-day | CloseDay creates a Debt for every (pickup person x non-pickup participant). With >=1 pickup this double-charges a non-pickup who would owe every pickup their full price, contradicting CONTEXT.md ('one person pays the shop'). The >=2-pickup who-owes-whom split is still an open gap but the close-day algorithm is asserted as implementable. | Define the settlement rule deterministically: designate exactly one paying/collecting pickup per day (or a documented split), and have CloseDay create one Debt per non-pickup participant to that single collector for their own order price. Resolve before F10. |
| **high** | Persistence / username uniqueness | Username uniqueness is required and 'lowercased', but a plain SQLite unique index is case-sensitive, so m.Wagner and m.wagner both insert. The model never specifies a normalized column or COLLATE NOCASE. | Store a normalized lowercased username and place the unique index on it (or declare COLLATE NOCASE on Username). Lowercase on provision and login. Add an integration test Should_RejectDuplicate_When_UsernameDiffersOnlyByCase. |
| **medium** | Tier algorithm port | computeTier keys off German strings ('Knoblauch','Kraeuter','Haehnchen') while persistence uses enums (Sauce.Kraeuter, MeatType.Haehnchen). The port must compute garlic/spicy/kalbR/haehnR from enum flags, and the canonical Markus 12-order fixture must reproduce exactly (garlic 11/12 ~0.917, spicy 4/12 -> Knoblauch-Wolf, not Buerowaffe). | Specify the tier service computes inputs from enums/flags (not German strings), and pin the Markus fixture with exact expected ratios in the unit + integration test so the >=0.6/>=0.6 Buerowaffe branch is provably not hit. |
| **medium** | Persistence / history windows | Tier window is CreatedAt >= now-90d, monthly spend is current calendar month, streak is ISO weeks - all keyed off Order.CreatedAt (row insert time). Edits bump UpdatedAt and seeded/backfilled history would all land at 'now', making the 3-month window, monthly spend, and streak wrong. | Key all history-derived windows on OrderDay.Date, not Order.CreatedAt. Tier = OrderDay.Date within last 3 months; monthly spend = OrderDay.Date in current month; streak = ISO weeks of OrderDay.Date. Reflect this in the calculators and integration tests. |
| **medium** | Frontend / Material Icons | The mock uses Material Icons Outlined font strings everywhere (kebab_dining, restaurant, payments, etc.) and MenuItem.MaterialIcon stores those strings. The web app has @mui/icons-material (SVG) but not the icon font, and CSP/relative-asset constraints block CDN fonts. No plan covers loading the font locally or mapping strings to MUI icon components. | Decide: bundle the Material Icons Outlined font locally (fontsource) and render via the font, OR add a string->MUI-icon-component map. Add the dependency and state the mapping in the frontend plan; otherwise every icon renders as literal text. |
| **medium** | Frontend / order route | /order route carries no day id, but PutMyOrder is .../order-days/{dayId}/orders/mine and useMyOrder(orderDayId) needs one. The frontend plan never says how /order resolves the open day id or handles 'no open day'. | Specify /order resolves the open day via GET /order-days/today (or a ?dayId= search param) and guards/redirects when no day is open. Make the dependency explicit for F15. |
| **medium** | Persistence / OrderDay re-open | Unique index on OrderDay.Date forbids two OrderDays on the same calendar date forever, which is correct for the business rule but the plan never addresses re-opening a closed day (second wave) - OpenDay idempotency only handles the still-open case. | Confirm one OrderDay per calendar date for all history; make OpenDay re-use the existing row for today (flip Status back to Open / extend cutoff) rather than insert, and scope 'today open' checks to Date==today AND Status==Open. Add a test for open-after-close. |
| **medium** | Security / CSRF token lifecycle | dc_xsrf double-submit requires the cookie be reissued whenever auth cookies rotate. The plan sets it on login but does not state that /auth/refresh and /auth/me also (re)set dc_xsrf, nor that the refresh-link re-reads it after refresh, risking 403 on the next mutation after a silent refresh. | Specify login, refresh, and me all (re)issue dc_xsrf, and the apiClient/refresh-link re-reads the cookie after a refresh round-trip before retrying the mutation. Add a test: mutation succeeds after a silent token refresh. |
| **medium** | Data-Model / Notification entity | The 'complete' Data-Model section omits the Notification entity entirely; it appears only as an ad-hoc addition in the API plan. The Roadmap implies a single InitialCreate migration (F1) but folds Notifications into F8, so the table would be missing from InitialCreate. | Promote Notification into the Data-Model (Id, RecipientUserId FK Restrict, OrderDayId FK Restrict nullable, Kind, Title, Body, CreatedAt, ReadAt; index (RecipientUserId, ReadAt)). Decide it ships in InitialCreate (F1) or document an explicit F8 migration; align the Roadmap. |
| **medium** | Test seed / authed tests | Provisioning seeds users with MustChangePassword=true, and the forced-change gate 403s every endpoint except change-password/logout. The integration LoginAsync('m.wagner', DemoPassword) helper would then 403 on every authenticated test. | Make the test/dev seed set MustChangePassword=false and a deterministic DemoPassword for the demo login user (m.wagner), so authed integration tests pass the gate. Keep MustChangePassword=true only for newly provisioned users. |
| **low** | Pure calculators / PayPal amount | Mock always uses toFixed(2) (e.g. 8.00 in payLukas). toPayPalAmount(cents) must always emit 2 decimals; the unit test only pins 850->8.50, missing 800->8.00 / 1000->10.00 which would otherwise risk paypal.me/x/8EUR. | Specify toPayPalAmount always formats 2 decimals with a dot, and add boundary tests 800->'8.00' and 1000->'10.00'. |
| **low** | Leaderboard footer | 'Nur noch X Doener bis Platz N' = diff to next-higher count (mock: rank 4 with 91 -> '6 bis Platz 3' since rank3=97). Plan is correct but does not pin the rank-1 case (no next rank -> footer hidden / null). | Add unit tests for the exact rank-4->'6 bis Platz 3' case and for rank 1 returning null DoenerToNextRank/NextRank (footer hidden). |
| **low** | Stats / lifetime vs year | 'Doener gesamt' is lifetime all-time while the leaderboard is per-year; the dashboard test inventory only says 'seed N orders -> assert N' and does not prove the all-time vs year-scoped distinction. | Add a test seeding orders across two years and assert 'Doener gesamt' counts all years while leaderboard counts only the queried year. |
| **low** | Frontend / abholer empty state | Mock always renders a single 'Abholer heute' name; the system designs for >=1 (PickupNames list) but no copy/empty-state is specified for 0 pickups (no one has claimed yet). | Specify AbholerLine empty-state copy (e.g. 'Noch kein Abholer') and rendering for 0 and >=2 pickups. |

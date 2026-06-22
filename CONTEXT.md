# Schulz Döner Control — Product & Design Context

Durable background for the project. Code conventions live in the `backend-work` /
`frontend-work` skills; the minimal always-know facts live in `CLAUDE.md`. This file is
the *why* and the *what* — the product spec.

## What this app is

A mobile-first web app for the Schulz office's weekly **Döner Thursday**. The office has
~13 people. Every Thursday the team orders Döner / Dürüm / Pizza etc. from the local
shop. One or two people drive over and pick up the whole order, **one person pays the
shop**, and everyone else reimburses the payer via PayPal.

Today this runs on a sheet of paper plus repeated "what's your PayPal link again?"
messages. The app replaces that: open an order day, collect everyone's order, designate
the pickup person, and settle payments.

It is a **humorous internal tool**. The tone is playful — it addresses the user as
"Chef", assigns funny "Döner-Tiere", and uses absurd synonyms for Döner in
notifications — but it sits on the **serious Schulz Machine-Eye design system**
(industrial machine-monitoring aesthetic). Everything is in **German**.

## Core concepts

- **Auth** — Username + password login. Employee accounts.
- **Döner-Tag (order day)** — Any colleague can open today's order day
  ("Ich will heute Döner!"). Once open, others check in and add their orders. A
  Döner-Tag has a **Bestellschluss** that is *action-driven*, not time-based: there
  is no cutoff clock — ordering closes only when the Abholer (pickup person) closes
  it.
- **Order** — Each person picks one menu item and configures it (see below).
- **Abholer (pickup person)** — One or more people check in as today's pickup. They pay
  the shop and collect reimbursements.
- **Payments** — After ordering, non-pickup people get an auto-generated **PayPal.Me**
  link prefilled with their amount, addressed to the Abholer. The Abholer sees the total
  they'll collect. The app also tracks open/unsettled payments to colleagues.

## Menu & order configuration

Menu items (default prices, all editable per order): **Döner 7,50 € · Dürüm 8,00 € ·
Big Döner 9,50 € · Dönerbox 6,50 € · Danny-Box 6,00 € · Pizza 9,00 €**.

- **Danny-Box** — insider item: a Dönerbox with just Pommes, meat & sauce — no salad/bread.
- **Pizza** → variant selector: Salami, Margherita, Funghi, Tonno, Hawaii.
- **Döner-type items** → meat selector (**Kalb / Hähnchen**) + sauce multi-select
  (**Kräuter 🌿, Knoblauch 🧄, Scharf 🌶**).
- **Extrawünsche** — free-text field (e.g. "ohne Zwiebeln, Soße separat").
- **Price per item** — editable; feeds the PayPal amount.

## Dashboard / stats

- Aggregate stats: total Döner ever, monthly spend, open payments, ordering streak.
- **Döner-Bestenliste (leaderboard)** — ranks colleagues by lifetime Döner count; medals
  for top 3; current user highlighted.
- **Open payments list** — with direct PayPal buttons.

## Signature fun features

These carry the personality — keep them.

### Döner-Tier

Like a "sleep animal": each user is assigned a funny/roasty animal **computed from their
real order history over the last 3 months** (sauce ratios, meat loyalty, product mix,
etc.). **15 Tiere exist, prioritized in order** — the first matching one wins. A catalog
screen lists all of them, with the user's own Tier badged.

All 15 Tiere, in **priority order** (first match wins). Inputs are computed over the
user's orders in the last 3 months: `garlic`/`spicy` = share of orders containing
Knoblauch / Scharf; `kalbR`/`haehnR` = ratio among orders that have a meat;
`noSauce` = share of Döner-kind orders with no sauce; `allThree` = share with ≥3 sauces;
product counts (`pizza`/`danny`/`big`/`box`/`duerum`); `uniq` = distinct products;
`n` = order count; `meated` = count of orders with a meat. (Source of truth: the
`computeTier` function in [the mock](mocks/Schulz%20Döner%20Control.dc.html).)

| # | Tier | Trigger |
|---|------|---------|
| 1 | 🦨 Die Bürowaffe | `garlic ≥ 0.6 && spicy ≥ 0.6` |
| 2 | 🐺 Der Knoblauch-Wolf | `garlic ≥ 0.7` |
| 3 | 🐉 Der Schärfe-Drache | `spicy ≥ 0.7` |
| 4 | 🍕 Der Pizza-Verräter | `pizza ≥ 2` |
| 5 | 📦 Der Danny-Jünger | `danny ≥ 2` |
| 6 | 🐗 Die Big-Döner-Wildsau | `big ≥ max(2, n·0.4)` |
| 7 | 🦖 Der Kalb-Rex | `kalbR == 1 && meated ≥ 5` |
| 8 | 🐔 Das Angst-Hähnchen | `haehnR == 1 && meated ≥ 5` |
| 9 | 🐙 Der Soßen-Messie | `allThree ≥ 0.5` |
| 10 | 🐭 Die Trockenmaus | `noSauce ≥ 0.5` |
| 11 | 🦅 Der Dürüm-Adler | `duerum ≥ max(2, n·0.5)` |
| 12 | 🦫 Der Pommes-Biber | `box ≥ max(2, n·0.4)` |
| 13 | 🐒 Das Chaos-Äffchen | `uniq ≥ 5` |
| 14 | 🦥 Das Gewohnheits-Faultier | `uniq ≤ 1 && n ≥ 5` |
| 15 | 🌯 Der solide Döner-Bürger | **fallback** |

Each Tier carries a German tagline + ~3 tag chips (exact text lives in the mock's
`TIER_CATALOG`).

### Döner-Synonyme in notifications

When an order day opens, colleagues get a push that **always uses a random absurd synonym
for Döner**: Drehspieß-Tasche, Osmanischer Fleischeimer, Fleisch-Rucksack, Donatello,
Rindfleisch-Knoppers, Drehmoment-Mäppchen, Anatolische Fleischbombe, Klappkatze.

### "Chef" address

The app calls the user **"Chef"** everywhere, except the **home screen greeting**, which
uses their real name.

## Design system — Schulz Machine-Eye

Industrial machine-monitoring aesthetic.

- **Typeface:** Open Sans.
- **Theme color (Schulz red):** `#C90023`.
- **Navy:** `#002230`.
- The diagonal **"Schräge"** bevel on red chrome surfaces.
- **Material Icons**, outlined style.
- **No AI-slop gradients.**

The **authoritative visual + interaction design is the mock** in [`mocks/`](mocks/) —
specifically `mocks/Schulz Döner Control.dc.html`. It is the source of truth for layout,
exact colors (red `#C90023`/hover `#A8001D`, navy `#002230`, teal `#00728E`, muted
`#8898a6`, success `#2E7D32`, orange `#ED701C`, gold `#FAB014`, PayPal blue `#0070BA`),
the **Schräge** bevel (`clip-path:polygon(82% 0,100% 0,100% 100%,75% 100%)` overlay on
red surfaces), copy, and the menu/tier data.

## Screens & flow

```
Login
  → Home / Dashboard
       (stats · leaderboard · Döner-Tier card · open Döner-Tag with participant
        list + Abholer + sent-notification preview · open payments)
  → Döner-Tiere catalog
  → Order (menu select + configuration)
  → Success (order summary + PayPal action)
```

## Language

Everything user-facing is in **German**.

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
  Döner-Tag has a **Bestellschluss** (order cutoff time).
- **Order** — Each person picks one menu item and configures it (see below).
- **Abholer (pickup person)** — One or more people check in as today's pickup. They pay
  the shop and collect reimbursements.
- **Payments** — After ordering, non-pickup people get an auto-generated **PayPal.Me**
  link prefilled with their amount, addressed to the Abholer. The Abholer sees the total
  they'll collect. The app also tracks open/unsettled payments to colleagues.

## Menu & order configuration

Menu items: **Döner, Dürüm, Big Döner, Dönerbox, Danny-Box, Pizza**.

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

Known Tiere (priority order, fallback last):

| Tier | Trigger (informal) |
|------|--------------------|
| 🦨 Die Bürowaffe | Knobi + scharf |
| 🐺 Der Knoblauch-Wolf | heavy Knoblauch |
| 🐉 Der Schärfe-Drache | heavy Scharf |
| 🍕 Der Pizza-Verräter | orders Pizza |
| 📦 Der Danny-Jünger | Danny-Box loyalist |
| 🐗 Die Big-Döner-Wildsau | Big Döner habit |
| 🦖 Der Kalb-Rex | Kalb loyalty |
| 🐔 Das Angst-Hähnchen | always Hähnchen |
| 🐭 Die Trockenmaus | few/no sauces |
| 🦥 Das Gewohnheits-Faultier | same order every time |
| 🌯 Der solide Döner-Bürger | **fallback** |

> The full set of 15 (and the exact threshold rules) still needs to be finalized — the
> above are the ones specified so far.

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

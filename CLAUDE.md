# Schulz Döner Control

Mobile-first web app for the Schulz office's weekly **Döner-Tag**. It organizes the
ritual: open an order day, collect everyone's order, designate the pickup person
(*Abholer*), and settle PayPal reimbursements. Internal, deliberately playful tool
built on the serious Schulz **Machine-Eye** design system.

→ Full product spec, features, menu, Döner-Tiere, and design system: **[CONTEXT.md](CONTEXT.md)**

## Structure

Monorepo:

- `server/` — C#/.NET backend. Clean Architecture, FastEndpoints, EF Core / PostgreSQL.
- `web/` — React + TypeScript frontend. MUI, TanStack Query, Zod, Biome, Vitest (pnpm).

## Rules

- **Before writing, planning, or modifying any code in `server/`, invoke the
  `backend-work` skill. Before any work in `web/`, invoke `frontend-work`.** These hold
  the mandatory, non-negotiable conventions — do not reproduce or override them here.
- All user-facing text is **German**.
- The app addresses the user as **"Chef"** everywhere, except the home greeting which
  uses their real name. Tone is playful (see CONTEXT.md: Döner-Tiere, Döner-synonyms).
- Keep this file minimal: durable product/design context lives in `CONTEXT.md`, and code
  conventions live in the skills. Add to those, not here.

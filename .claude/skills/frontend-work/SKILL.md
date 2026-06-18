---
name: frontend-work
description: Mandatory rules for all React/TypeScript frontend work. Invoke before writing, planning or modifying any code in the web/ directory.
---

## Rules

### Components
- Declare all components as `FC<Props>` with named exports
- Use arrow functions exclusively — never use `function` keyword
- One component per file
- Never use default exports
- Never hardcode layout sx props (margin, padding) inside components — parent controls positioning via `sx` prop
- Extract all business logic into custom hooks — component bodies contain only hook composition and JSX rendering, never data fetching, transformations, or complex state management inline
- Never call apiClient directly in components — all data fetching must go through React Query hooks in api.ts

### Composition
- Composition is the primary design goal — consider compound composition before building any component
- Build compound components in three layers in this order: (1) layout components with slots, (2) dedicated hooks or context for logic, (3) UI pieces that consume the context
- Use Context to eliminate prop drilling when 3+ props are threaded through children
- Use `Object.assign()` for compound component namespaces
- One context per component group, co-located in `*-context.ts`
- Context hook always throws if used outside provider
- Extract complex operations into `use-*-operations.ts` hooks, pass result via context

### MUI
- Use `Stack` instead of `Box` with `display: flex`
- Exception: use `sx={{ display: 'flex' }}` on MUI containers (DialogContent, etc.) to avoid extra wrapper divs
- Put Stack layout props (`alignItems`, `justifyContent`, `spacing`) in `sx`, not as component props — only `direction` is allowed as a prop
- Always use default imports from MUI, never named imports
- Use theme tokens exclusively — never hardcode px values, colors, or spacing

### TypeScript
- Zero `any` and `unknown` tolerance — everything must be strictly typed
- All function parameters and return types must be explicitly typed
- Exception: return types on React components are implicit
- Never cast API responses with `as unknown as` or raw type assertions — always validate with Zod schemas
- Use `import type` for type-only imports

### React
- React Compiler is enabled — `useMemo`, `useCallback`, `React.memo` are banned
- Always use curly braces on all if/else branches, even single-line
- Never use `crypto.randomUUID()` — use incrementing counter or `Date.now() + Math.random()`
- Prefix fire-and-forget promises with `void`
- When state must reset in response to a prop change, use a render-phase update: track the previous prop value with useState, compare during render, and call setState synchronously — never use useEffect for this, as it causes an extra commit-phase render and a visible flicker

### Validation
- Validate all API responses at the boundary with Zod `.parse()`
- Types are inferred from Zod schemas via `z.infer<>`, never manually defined
- Schemas live in feature `schemas.ts`, types in `types.ts`
- Form schemas end with `...FormSchema`, form types end with `...Form`

### Code Style
- Biome for linting and formatting — not Prettier, not ESLint
- Zero warnings policy — treat all lint and TypeScript warnings as errors
- Never use deprecated APIs from any library — migrate to replacements immediately
- Add comments only when code is truly complex or explains a non-obvious "why"

### Testing
- Vitest + Testing Library
- Main components must have unit tests — skip only when tests would just validate mocks
- Co-locate test files with source

## Project Patterns

### Architecture
- Feature-based modules in `src/features/<name>/` with barrel exports via `index.ts`
- Dependency flow is unidirectional: `src/{lib,components,styles}` → `features` → `routes`
- Features never import from other features
- Routes compose features together
- All imports use `@/` path alias

### Feature Module Structure
- Each feature contains: `index.ts` (barrel), `schemas.ts`, `types.ts`, `api.ts`, `components/`, `hooks/`, `i18n/`
- External code imports only through the barrel file
- Internal files within a feature import freely from each other

### Data Fetching
- TanStack Query for all server state
- Each feature has `api.ts` with query hooks and query key objects
- React Context for UI state only, never for server data
- React Hook Form + Zod resolver for forms
- URL is single source of truth for language (`/$lang/` prefix)

### Component Structure
- Main components: own folder with barrel file (`index.tsx`), stories, tests
- Internal components: in `internal/` subfolder, scoped to main component
- Stories and tests only for main components, not internal ones
- Co-located: `ComponentName.stories.tsx`, `ComponentName.test.tsx`

### Naming
- Component files: PascalCase — Hook files: kebab-case with `use-` prefix
- Zod schemas: PascalCase with `Schema` suffix
- Query keys: camelCase object
- Backend `...Dto` maps to frontend type without suffix

### i18n
- Route-based language switching via `/$lang/` URL prefix
- Common translations: `src/lib/i18n/locales/<lang>/common.json`
- Feature translations: `src/features/<name>/i18n/<lang>.json`
- Run `pnpm i18n:types` after changing translation keys

### Layout & Dialogs
- Use `PageLayout` composition: `PageLayout` + `PageLayout.Header` + `PageLayout.Content`
- Dialogs via `dialogManager.showDialog()` / `dialogManager.showFormDialog()`
- Snackbars via `snackbarManager.showAlert()`

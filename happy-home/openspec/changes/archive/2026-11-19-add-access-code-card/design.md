# Design

## Context

- The app is a fresh Vue 3 + TypeScript + Vite scaffold (`src/App.vue` shows the default "You did it!" page). There is no router, store, HTTP client or test runner yet.
- The Figma file is the UI source of truth (see `openspec/config.yaml`). Its "Design System" page defines the components this change mirrors: icons, **Code digit** (states Default, Hidden, Error, Expired, Unavailable), **Code**, **Status message** (Error, Warning, Server error), **Button** (Default, Loading), **Logo** and **Access code card**, plus text styles and a "Theme" variable collection (16 color variables) with modes Light / Dark / High contrast. Every variable has WEB code syntax `var(--color-<name>)`.
- The backend endpoint does not exist yet. Requirements are in `specs/`; this document only covers how to build them.

## Goals / Non-Goals

**Goals:**
- A component tree that maps 1-to-1 to the Figma components, so design changes are easy to trace.
- All backend specifics (URLs, payload shape, status mapping) in one module, so plugging in the real endpoint touches only that module and its tests.
- Theme colors defined once as CSS custom properties with the same names as the Figma variables.
- Every state in the specs reachable in tests without a backend.

**Non-Goals:**
- Global state management (Pinia) or routing: there is one screen with local state.
- A generic HTTP client or retry/back-off library.
- A visible theme switcher (themes follow system settings only).

## Decisions

### 1. Component structure mirrors the Figma Design System
```
src/
  components/
    icons/            IconClose, IconRetry, IconAlert, IconClock, IconServer, IconSpinner, IconHome (inline SVG, currentColor, aria-hidden)
    CodeDigit.vue     props: digit, state: 'default' | 'hidden' | 'error' | 'expired' | 'unavailable'
    AccessCode.vue    renders 4 CodeDigit; exposes the whole code as one accessible label
    StatusMessage.vue props: type: 'error' | 'warning' | 'server-error', message; role="status"
    BaseButton.vue    props: label, loading, icon?; disabled + aria-busy while loading
    AppLogo.vue
    AccessCodeCard.vue  composes the above; emits `close`, `regenerate`, `retry`
  views/AccessCodeView.vue  page background + logo + card, wires the composable
  composables/useAccessCode.ts
  api/accessCode.ts
  styles/tokens.css, styles/base.css
```
`AccessCodeCard` is presentational: it receives a view-state object and emits events. All behavior lives in `useAccessCode`, which keeps the components easy to test against the Figma states.
*Alternative considered:* one large `AccessCode.vue` component. Rejected because the design already defines reusable pieces and separate components keep each state testable.

### 2. State is a small discriminated union in `useAccessCode`
```ts
type AccessCodeState =
  | { status: 'loading'; pending: 'load' | 'regenerate' }
  | { status: 'ready'; code: string }
  | { status: 'expired'; code: string }
  | { status: 'error'; kind: 'server' | 'general'; failed: 'load' | 'regenerate' }
```
- `load()` runs on mount; `regenerate()` and `retry()` are exposed to the view.
- `retry()` repeats `failed` (load or regenerate), as the specs require.
- A new action is ignored while `status === 'loading'`, which prevents duplicate regenerate requests (the button is also disabled).
- The mapping from state to Figma component states lives in one place: loading → Code digit `hidden` + Button `loading`; ready → `default`; expired → `expired` + Status `warning`; error/server → `unavailable` + Status `server-error` + label "Try again"; error/general → `error` + Status `error` + label "Try again".
*Alternative considered:* a set of booleans (`isLoading`, `hasError`, …). Rejected because impossible combinations become representable.

### 3. Backend access isolated in `api/accessCode.ts` with an assumed contract
The module exports `getAccessCode()` and `regenerateAccessCode()`, both returning `Promise<{ code: string; expired: boolean }>` or throwing an `AccessCodeError` with `kind: 'server' | 'general'`.

Assumed contract until the real endpoint is provided (to be confirmed):

| Operation | Request | Success response |
|---|---|---|
| Get current code | `GET {VITE_API_BASE_URL}/access-code` | `200 { "code": "5916", "expiresAt": "2026-12-01T00:00:00Z" \| null }` |
| Issue new code | `POST {VITE_API_BASE_URL}/access-code/regenerate` | `200 { "code": "4827", "expiresAt": … }` |

Error classification (the only place HTTP details are interpreted):
- HTTP 500–599 → `server`
- network failure, timeout (10 s via `AbortController`), any other status, or a `code` that does not match `/^\d{4}$/` → `general`
- `expired` is true when `expiresAt` is in the past (or when the backend sends an explicit expired flag, once known).

Uses native `fetch`; no extra HTTP dependency. `VITE_API_BASE_URL` is read from `import.meta.env`, with an `.env.example` documenting it.
*Alternative considered:* waiting for the backend before building. Rejected: the UI states can be built and tested now, and only this module changes later.

### 4. Theme tokens as CSS custom properties driven by media queries
`styles/tokens.css` declares the 16 Figma "Theme" variables with identical names:
```css
:root { --color-bg: #0F0081; --color-surface: #FFFFFF; … }                 /* Light */
@media (prefers-color-scheme: dark) { :root { … Dark values … } }
@media (prefers-contrast: more)     { :root { … High contrast values … } }   /* last, so it wins over dark */
:root[data-theme='light' | 'dark' | 'high-contrast'] { … }                   /* test/preview override only */
```
Components only reference `var(--color-*)`, never raw hex values. Because the switch is pure CSS, theme changes apply live without JavaScript and without touching state. `color-scheme` is set per theme so native controls match.
*Alternative considered:* a `useTheme` composable that sets a class from `matchMedia`. Rejected: more code, flashes on load and is not needed without a manual switcher. The `data-theme` attribute keeps a hook for tests and a future switcher.

### 5. Contrast fixes to two Figma tokens (applied in Figma)
Checking the Figma values against the `app-theming` contrast requirement showed two failures:
- Light `color/text-muted` `#BCBCBC` on white = 1.9:1 (explanation text) → change to `#707070` (4.95:1).
- High contrast `color/error` `#FF5C5C` on black = 6.94:1 (needs 7:1) → change to `#FF6B6B` (7.57:1).

Both values are already updated in the Figma "Theme" collection; `tokens.css` must use the same values so design and code stay in sync. A new token `color/focus` was added for the focus ring. Struck-through expired digits are inactive content and use `text-muted` as well. All other pairs pass (for example Light error on surface 4.86:1, Dark muted on surface 5.08:1).

### 6. Responsive layout with one breakpoint
Mobile styles apply below `600px` (`@media (max-width: 599.98px)`). They use the Figma mobile values: card width `calc(100% - 48px)`, digit boxes 64×80, button height 44, text styles `*/Mobile`. Digit boxes use `flex: 1 1 0` with a max width, so the four boxes shrink down to a 320 px viewport instead of overflowing. Typography uses the Figma text styles mapped to classes (Brand, Title, Digit, Button, Message, Caption), with Inter from `@fontsource-variable/inter`.

### 7. Accessibility details
- `AccessCode` renders the boxes `aria-hidden` and has one visually hidden label: "Access code 5 9 1 6", "Loading access code" or "Access code unavailable". New codes are announced through a polite live region.
- `StatusMessage` uses `role="status"` (polite). The general and server error variants use `role="alert"`.
- The close control is a `<button aria-label="Close">` with a 44×44 hit area on mobile. All interactive elements get a visible `:focus-visible` ring: `outline: 3px solid var(--color-focus); outline-offset: 0` (Figma: outside stroke bound to `color/focus`; Light `#000000`, Dark `#A99FFF`, High contrast `#FFFFFF`). The Figma `Button State=Focus` and `Icon button State=Focus` variants show this.

### 8. Close behavior
`AccessCodeCard` emits `close`. For now `AccessCodeView` hides the card and shows nothing else. When the surrounding app exists, the host decides what closing means (for example navigating back). This keeps the spec ("the card is dismissed") true without assuming navigation.

### 9. Testing
Add Vitest + `@vue/test-utils` + jsdom, with an `npm run test:unit` script. The API module is tested by stubbing `fetch`. The composable and components are tested by mocking the API module. Each spec scenario maps to at least one test.

## Risks / Trade-offs

- [The real API differs from the assumed contract] → All differences stay in `api/accessCode.ts` and its tests. The UI only depends on `{ code, expired }` and the two error kinds.
- [The backend signals expiry differently (status code, flag) than `expiresAt`] → Expiry detection is one function in the API module and gets updated when the contract is known.
- [The `prefers-contrast` media query is not supported in an older browser] → Those users fall back to Light or Dark, which still meet AA.
- [Changing two Figma color values alters the approved design slightly] → The changes are small (darker grey, lighter red) and are needed for readability. Flag them to the designer when updating Figma.
- [Inter font file adds weight] → Use the variable font subset (latin) only.

## Migration Plan

No data or API migration. Deploy is a normal frontend release. Roll back by reverting the change. When the real endpoint arrives, set `VITE_API_BASE_URL` and adjust `api/accessCode.ts` plus its tests.

## Open Questions

- Exact endpoint URLs, payload field names, authentication headers and how the backend signals an expired code (changes only `api/accessCode.ts`).
- What closing the card should do once the screen is embedded in a larger app (changes only `AccessCodeView`).

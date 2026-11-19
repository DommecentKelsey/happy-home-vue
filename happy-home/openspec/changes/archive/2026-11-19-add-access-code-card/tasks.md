# Tasks

## 1. Project setup

- [x] 1.1 Add dev dependencies `vitest`, `@vue/test-utils` and `jsdom`, add a `test:unit` script and a `vitest.config.ts` (jsdom environment, `@` alias); verify `npm run test:unit` runs and passes with one placeholder test
- [x] 1.2 Add `@fontsource-variable/inter` and import it in `src/main.ts`; verify `npm run build` succeeds
- [x] 1.3 Add `.env.example` with `VITE_API_BASE_URL=` and a typed declaration for it in `env.d.ts`; verify `npm run type-check` passes

## 2. Theme tokens and base styles

- [x] 2.1 Update the Figma "Theme" collection: Light `color/text-muted` → `#707070`, High contrast `color/error` → `#FF6B6B` (design.md decision 5) and add `color/focus`; verified on the Design System color table
- [x] 2.2 Create `src/styles/tokens.css` with all 16 `--color-*` variables for Light, Dark (`prefers-color-scheme: dark`) and High contrast (`prefers-contrast: more`), plus `[data-theme]` overrides; verify every variable name matches the Figma code syntax
- [x] 2.3 Create `src/styles/base.css` with the text style classes (Brand, Title, Digit, Button, Message, Caption, desktop and mobile sizes), body background `var(--color-bg)`, and `:focus-visible` ring (3px, `var(--color-focus)`); import both stylesheets in `src/main.ts` and verify the page background changes with `data-theme` in the browser
- [x] 2.4 Add a unit test that parses `tokens.css` and checks each theme's text/icon color pairs against the required contrast ratios (AA, AAA for high contrast); verify it passes

## 3. API module

- [x] 3.1 Implement `src/api/accessCode.ts` with `getAccessCode()` and `regenerateAccessCode()`, the `AccessCodeError` type, 10 s timeout, 4-digit validation and expiry detection, using the assumed contract from design.md; verify `npm run type-check` passes
- [x] 3.2 Add unit tests with a stubbed `fetch` covering: success, expired (`expiresAt` in the past), HTTP 503 → `server`, network error → `general`, timeout → `general`, malformed code → `general`, and the regenerate request using `POST`; verify all pass

## 4. Presentational components

- [x] 4.1 Create the icon components (close, retry, alert, clock, server, spinner, home) as inline SVG with `currentColor` and `aria-hidden`; verify they render in a component test
- [x] 4.2 Create `CodeDigit.vue` with the five states and `AccessCode.vue` with the single accessible label; add component tests for each state and for the labels "Access code 5 9 1 6" / "Loading access code"
- [x] 4.3 Create `StatusMessage.vue` (error, warning, server-error with the correct icon and role) and `BaseButton.vue` (label, optional icon, loading spinner, disabled + `aria-busy` while loading); add component tests verifying roles, icons and that a loading button does not emit clicks
- [x] 4.4 Create `AppLogo.vue` and `AccessCodeCard.vue` composing the pieces, with the explanation text always visible and a close button that emits `close` on click, Enter and Space; add component tests for each view state and the close events
- [x] 4.5 Add the mobile layout (< 600 px) to the card and view per design.md decision 6; verify manually at 1280, 390 and 320 px widths that the layout matches Figma and nothing scrolls horizontally

## 5. State and screen

- [x] 5.1 Implement `useAccessCode` (load on mount, regenerate, retry of the failed action, ignore actions while loading); add unit tests with a mocked API module covering every scenario in `specs/access-code` and `specs/access-code-regeneration`, including the double-click case
- [x] 5.2 Create `views/AccessCodeView.vue` wiring the composable to the card and hiding the card on `close`; replace the scaffold content of `src/App.vue` with this view; add a component test that mounts the view with a mocked API and walks loading → code → regenerate → new code
- [x] 5.3 Add a polite live region that announces newly shown codes; verify in the view test that the announcement text updates after a successful regeneration

## 6. Integration checks

- [x] 6.1 Run `npm run lint`, `npm run type-check`, `npm run test:unit` and `npm run build`; verify all succeed
- [x] 6.2 With a temporary mock server (or MSW-style stub) behind `VITE_API_BASE_URL`, check all five Figma states in the browser in Light, Dark and High contrast (toggle via OS settings or `data-theme`) and at desktop and mobile widths; verify each matches the corresponding Figma frame
- [ ] 6.3 Check keyboard-only use (Tab to close and button, Enter/Space) and a screen reader pass (code, loading and error announcements); verify the behavior described in the specs, including the visible focus ring (Figma: Focus view frames) — keyboard focus ring verified (Tab to close and button, 3px `--color-focus` outline); screen reader pass still to do manually

## Design reference

- Figma frames per state/theme/width are listed on the "Spec mapping" page of the Figma file; components, text styles and color tokens are on the "Design System" page.

## Workflow follow-up

- When the real backend endpoint is provided: update `api/accessCode.ts` and its tests to the real contract, set `VITE_API_BASE_URL`, and re-run 6.1–6.2.
- Archive the change after review (`openspec archive add-access-code-card`).

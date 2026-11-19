# Proposal

## Why

Residents need one place to see the 4-digit access code for their apartment and replace it when it may have leaked. The Figma design for this screen (all states, desktop and mobile, three themes) is finished, but the Vue app is still the default scaffold. Writing down the expected behavior now lets the UI be built and tested before the backend endpoint is available.

## What Changes

- Add an access code screen that shows the "Happy home" logo and an access code card, matching the Figma screens "Code view", "Loading view", "Error view", "Expired code view" and "Server error view".
- Load the current access code when the screen opens and show a loading state (masked digits, spinner in the button) while waiting.
- Let the resident request a new code with "Get new code"; the old code stops working once a new one is issued.
- Show distinct feedback for an expired code, a server error and any other failure, with a way to try again.
- Add responsive layouts for desktop and mobile (390 px wide) as designed.
- Add Light, Dark and High contrast themes, chosen from the operating system's appearance and contrast settings, using the color tokens from the Figma "Theme" collection.
- Keep backend communication behind a single access-code API module with a configurable base URL, because the real endpoint will be provided later.
- Add a unit/component test setup to the project (none exists today).

## Capabilities

### New Capabilities
- `access-code`: Showing the resident's current access code, including the loading, expired and error states and the close control of the card.
- `access-code-regeneration`: Requesting a new access code to replace the current one, including progress and failure feedback.
- `app-theming`: Light, Dark and High contrast color themes and how the active theme is chosen.

### Modified Capabilities
- None (no specs exist yet).

## Impact

- **Code**: replaces the scaffold content of `src/App.vue`; adds UI components mirroring the Figma Design System (Code digit, Code, Status message, Button, Logo, Access code card, icons), an access-code API module, state handling and a global stylesheet with theme tokens.
- **APIs**: consumes two backend operations (get current code, issue new code). Their URLs and payloads are not known yet; an assumed contract is described in design.md and must be confirmed when the endpoint is delivered.
- **Configuration**: new environment variable for the API base URL (`VITE_API_BASE_URL`).
- **Dependencies**: adds `@fontsource-variable/inter` (self-hosted Inter font used by the design) and dev dependencies for testing (Vitest, Vue Test Utils, jsdom).
- **Out of scope**: authentication/login, choosing a theme manually inside the app, a confirmation dialog before regenerating, offline detection, rate-limit messaging and an "no code yet" empty state. None of these are in the current design.

# access-code Specification

## Purpose
Lets a resident see the current 4-digit access code of their apartment, with clear feedback while it loads, when it has expired and when it cannot be retrieved.

## Requirements

### Requirement: Load the access code on open
The system SHALL request the resident's current access code from the backend as soon as the access code screen is shown.

#### Scenario: Screen opens
- **WHEN** the resident opens the access code screen
- **THEN** the system requests the current access code from the backend exactly once

### Requirement: Loading state
While the access code is being retrieved, the card SHALL show four masked digits ("*"), a spinner instead of the button label, and the button SHALL NOT be activatable.

#### Scenario: Waiting for the backend
- **WHEN** the request for the access code has not completed yet
- **THEN** each of the four digit boxes shows "*"
- **AND** the button shows a spinner and cannot be activated
- **AND** assistive technology is informed that the code is loading

### Requirement: Show the current code
When the backend returns a valid, unexpired code, the card SHALL show the four digits in order, each in its own box, with the "Get new code" button enabled.

#### Scenario: Code received
- **WHEN** the backend returns the code "5916" that has not expired
- **THEN** the boxes show "5", "9", "1" and "6" from left to right
- **AND** the "Get new code" button is enabled

#### Scenario: Code announced as a whole
- **WHEN** a screen reader user reaches the code
- **THEN** the code is announced once as a single value (for example "Access code 5 9 1 6") instead of four unrelated boxes

### Requirement: Explain code uniqueness
The card SHALL always show the explanation that the code is unique to the apartment and that generating a new code makes the old code unusable.

#### Scenario: Explanation visible in every state
- **WHEN** the card is in the loading, code, expired or any error state
- **THEN** the explanation text is visible below the button

### Requirement: Expired code state
When the backend reports the current code as expired, the card SHALL show the old digits struck through and muted, a warning message "This code has expired. Get a new code." with a clock icon, and an enabled "Get new code" button.

#### Scenario: Backend reports an expired code
- **WHEN** the backend returns the code "5916" together with an indication that it has expired
- **THEN** the boxes show "5", "9", "1", "6" struck through in the muted style
- **AND** the warning message is shown below the boxes
- **AND** activating "Get new code" starts a code regeneration

### Requirement: Server error state
When the backend responds with a server error (HTTP 5xx), the card SHALL show neutral boxes with "–", the message "Server error (500). Try again later." with a server icon, and a "Try again" button.

#### Scenario: Backend returns HTTP 503
- **WHEN** the request for the access code fails with HTTP status 503
- **THEN** each box shows "–" in the neutral style
- **AND** the server error message is shown
- **AND** the button label is "Try again"

### Requirement: General error state
When the request fails for any reason other than a server error (no network, timeout, unexpected response), the card SHALL show error-styled boxes with "–", the message "Something went wrong. Please try again." with an alert icon, and a "Try again" button.

#### Scenario: Network failure
- **WHEN** the request for the access code cannot reach the backend
- **THEN** each box shows "–" in the error style
- **AND** the general error message is shown with a "Try again" button

#### Scenario: Request takes too long
- **WHEN** the backend has not answered within 10 seconds
- **THEN** the request is abandoned and the general error state is shown

#### Scenario: Malformed code
- **WHEN** the backend answers successfully but the code is not exactly four digits
- **THEN** the general error state is shown instead of a partial or invalid code

### Requirement: Retry after an error
Activating "Try again" SHALL repeat the operation that failed and show the loading state while it runs.

#### Scenario: Retry loading the code
- **WHEN** loading the code failed and the resident activates "Try again"
- **THEN** the loading state is shown and the code is requested again

### Requirement: Error messages are announced
Status messages (expired, server error, general error) SHALL be exposed to assistive technology as live announcements when they appear.

#### Scenario: Error appears
- **WHEN** the card switches to any error or expired state
- **THEN** a screen reader announces the status message without the user moving focus

### Requirement: Close the card
The card SHALL have a close control in its top-right corner, operable by mouse, touch and keyboard, that dismisses the card.

#### Scenario: Resident closes the card
- **WHEN** the resident activates the close control
- **THEN** the access code card is dismissed

#### Scenario: Keyboard access
- **WHEN** the resident tabs to the close control and presses Enter or Space
- **THEN** the access code card is dismissed

### Requirement: Visible keyboard focus
Every interactive control (the close control and the button) SHALL show a visible focus ring when it receives keyboard focus, in every theme.

#### Scenario: Tabbing to the button
- **WHEN** the resident tabs to the "Get new code" button
- **THEN** a 3 px focus ring in the theme's focus color is drawn around the button

#### Scenario: Tabbing to the close control on a phone
- **WHEN** the resident tabs to the close control on a 390 px wide viewport
- **THEN** the focus ring surrounds its 44×44 px hit area

### Requirement: Responsive layout
The screen SHALL use the mobile layout from the design on viewports narrower than 600 px and the desktop layout otherwise, without horizontal scrolling down to 320 px wide.

#### Scenario: Phone-sized viewport
- **WHEN** the viewport is 390 px wide
- **THEN** the card spans the width minus 24 px on each side, the digit boxes are 64×80 px and the button is at least 44 px high

#### Scenario: Desktop viewport
- **WHEN** the viewport is 1280 px wide
- **THEN** the card is 288 px wide and centered with the logo above it

#### Scenario: Very narrow viewport
- **WHEN** the viewport is 320 px wide
- **THEN** all four digits, the button and the explanation are fully visible without horizontal scrolling

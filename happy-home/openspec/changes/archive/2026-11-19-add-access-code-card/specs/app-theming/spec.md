# Spec Delta

## Purpose

Gives the app Light, Dark and High contrast color themes that follow the resident's system settings, using the colors defined in the Figma "Theme" collection.

## ADDED Requirements

### Requirement: Light theme by default
The app SHALL use the Light theme when the operating system reports neither a dark appearance nor an increased-contrast preference.

#### Scenario: Default system settings
- **WHEN** the system has a light appearance and no contrast preference
- **THEN** the page background, card, text, button and status colors match the Light mode of the Figma "Theme" collection

### Requirement: Dark theme
The app SHALL use the Dark theme when the operating system reports a dark appearance and no increased-contrast preference.

#### Scenario: Dark appearance
- **WHEN** the system appearance is dark
- **THEN** all colors match the Dark mode of the Figma "Theme" collection

### Requirement: High contrast theme
The app SHALL use the High contrast theme whenever the operating system reports an increased-contrast preference, regardless of light or dark appearance.

#### Scenario: Increased contrast requested
- **WHEN** the system requests more contrast
- **THEN** all colors match the High contrast mode of the Figma "Theme" collection, including visible borders around the card and digit boxes

#### Scenario: Increased contrast with dark appearance
- **WHEN** the system requests more contrast and has a dark appearance
- **THEN** the High contrast theme is used

### Requirement: Live theme switching
The app SHALL switch theme immediately when the system appearance or contrast setting changes, without a reload and without losing the shown code or state.

#### Scenario: System switches to dark while the code is shown
- **WHEN** the code "5916" is shown and the system appearance changes to dark
- **THEN** the screen switches to the Dark theme and still shows "5916"

### Requirement: Readable contrast in every theme
In every theme, text and essential icons SHALL meet WCAG 2.1 AA contrast against their background (4.5:1 for normal text, 3:1 for large text and icons), and the High contrast theme SHALL meet AAA (7:1) for text.

#### Scenario: Contrast check
- **WHEN** the colors of each theme are checked with a contrast tool
- **THEN** every text and icon color pair meets the ratio required for that theme

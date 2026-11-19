# Spec Delta

## Purpose

Lets a resident replace the current access code with a new one issued by the backend, so a code that leaked or expired stops working.

## ADDED Requirements

### Requirement: Request a new code
Activating "Get new code" SHALL ask the backend to issue a new access code for the apartment.

#### Scenario: Resident requests a new code
- **WHEN** a valid code is shown and the resident activates "Get new code"
- **THEN** the system sends one request to the backend to issue a new code

#### Scenario: Requesting a new code for an expired code
- **WHEN** the expired state is shown and the resident activates "Get new code"
- **THEN** the system sends one request to the backend to issue a new code

### Requirement: Progress while regenerating
While a new code is being issued, the card SHALL show the loading state (masked digits and a spinner in a non-activatable button).

#### Scenario: Waiting for the new code
- **WHEN** the request for a new code has not completed yet
- **THEN** the four boxes show "*" and the button shows a spinner and cannot be activated

### Requirement: No duplicate requests
The system MUST NOT send a second request to issue a new code while a previous one is still in progress.

#### Scenario: Double click
- **WHEN** the resident activates "Get new code" twice in quick succession
- **THEN** only one request to issue a new code is sent

### Requirement: Show the new code
When the backend issues a new code, the card SHALL replace the old digits with the new four digits and return to the normal code state.

#### Scenario: New code issued
- **WHEN** the backend responds with the new code "4827"
- **THEN** the boxes show "4", "8", "2" and "7"
- **AND** the "Get new code" button is enabled again
- **AND** assistive technology announces that a new code is shown

### Requirement: Regeneration failure
When issuing a new code fails, the card SHALL show the server error state for HTTP 5xx responses and the general error state for all other failures, as defined by the access-code capability; "Try again" SHALL repeat the request for a new code.

#### Scenario: Server error while regenerating
- **WHEN** the request for a new code fails with HTTP 500
- **THEN** the server error state is shown
- **AND** activating "Try again" sends a new request to issue a new code

#### Scenario: Network failure while regenerating
- **WHEN** the request for a new code cannot reach the backend
- **THEN** the general error state is shown
- **AND** activating "Try again" sends a new request to issue a new code

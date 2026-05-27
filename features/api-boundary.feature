Feature: MVP backend API boundary
  StreakBeacon MVP has no backend API unless a future architecture gate explicitly opens it.

  Scenario: MVP does not expose a backend API contract
    Given the MVP architecture decision is local-first browser storage
    When the app is implemented
    Then no backend route handler is required for tracked items, completion, preferences, import, export, or reset
    And no OpenAPI document is required for the MVP local-only behavior

  Scenario: Future route handlers require contract and Gherkin before implementation
    Given a future requirement needs a Next.js route handler
    When the route handler is proposed
    Then an OpenAPI contract must be documented first
    And Gherkin scenarios must cover every endpoint
    And the architecture gate must be revisited before implementation starts

  Scenario: Server-required product changes reopen architecture
    Given a future PRD requires accounts, sync, cloud backup, sharing, reminders, GitHub import, or authenticated external import
    When that requirement is accepted
    Then the Next.js-only architecture decision must be revalidated
    And persistence, auth, API, and deployment implications must be decided before code is written

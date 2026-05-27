Feature: First run and local persistence
  StreakBeacon starts as a local-first browser app with no account or backend dependency.

  Background:
    Given I am using a fresh browser profile

  Scenario: First run shows an empty local workspace
    When I open the StreakBeacon app
    Then I should see an empty tracked item state
    And I should be able to create my first tracked item
    And I should not be asked to sign in

  Scenario: App remains usable without network after initial load
    Given the StreakBeacon app has loaded
    When the browser network is unavailable
    Then I can view locally saved tracked items
    And I can mark and unmark local days
    And no backend error is shown

  Scenario: Local data persists after reload
    Given I created a tracked item named "Writing"
    And I marked today complete for "Writing"
    When I reload the app
    Then the "Writing" item should still exist
    And today should still be marked complete for "Writing"

  Scenario: Last selected item is restored
    Given I created tracked items named "Writing" and "Exercise"
    And I selected "Exercise"
    When I reload the app
    Then "Exercise" should be the selected item
    And the grid should show completion state for "Exercise"

  Scenario: Responsive navigation keeps core actions reachable
    Given I created a tracked item named "Writing"
    When I view the app on a narrow mobile viewport
    Then I can select tracked items
    And I can add a tracked item
    And I can open settings
    And I can mark or unmark a visible day

Feature: Streak grid and daily completion
  Users mark and inspect local completion days for the selected tracked item.

  Background:
    Given I created tracked items named "Writing" and "Exercise"
    And "Writing" is selected

  Scenario: Mark a visible day complete
    When I mark today complete
    Then today should appear complete in the grid
    And the current streak for "Writing" should update

  Scenario: Unmark a completed visible day
    Given I marked today complete
    When I unmark today
    Then today should appear incomplete in the grid
    And the current streak for "Writing" should update

  Scenario: Inspect a completed day
    Given I marked today complete
    When I inspect today in the grid
    Then I should see that today is complete
    And I should see the selected tracked item name

  Scenario: Inspect an incomplete day
    Given today is incomplete
    When I inspect today in the grid
    Then I should see that today is incomplete
    And I should be able to mark it complete

  Scenario: Switching items shows separate completion state
    Given I marked today complete for "Writing"
    When I select "Exercise"
    Then today should appear incomplete for "Exercise"
    When I select "Writing"
    Then today should appear complete for "Writing"

  @prd-open
  Scenario: Date range, timezone, and streak-break semantics require product confirmation
    Given the authoritative PRD has not confirmed date range, timezone, or exact streak-break behavior
    When implementation defines grid range or streak calculations
    Then the behavior should remain documented as PRD-open
    And implementation should not add backend, account, or sync behavior to resolve it by assumption

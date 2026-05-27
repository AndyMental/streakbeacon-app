Feature: Tracked item management
  Users manage multiple local streak items without accounts, sync, or server state.

  Background:
    Given I opened StreakBeacon with local storage available

  Scenario: Create a tracked item
    When I create a tracked item named "Writing"
    Then "Writing" should appear in the tracked item list
    And "Writing" should be selected
    And its streak grid should be empty

  Scenario: Prevent unusable tracked item names
    When I try to create a tracked item with a blank name
    Then the item should not be created
    And I should see an accessible validation error

  Scenario: Edit a tracked item name
    Given I created a tracked item named "Writing"
    When I rename "Writing" to "Drafting"
    Then the tracked item list should show "Drafting"
    And the existing completion history should be preserved

  Scenario: Delete a tracked item after confirmation
    Given I created tracked items named "Writing" and "Exercise"
    And I selected "Writing"
    When I confirm deletion of "Writing"
    Then "Writing" should no longer appear in the tracked item list
    And "Exercise" should remain available

  Scenario: Cancel tracked item deletion
    Given I created a tracked item named "Writing"
    When I start deleting "Writing"
    And I cancel the deletion
    Then "Writing" should still appear in the tracked item list
    And its completion history should be unchanged

  Scenario: Select a tracked item
    Given I created tracked items named "Writing" and "Exercise"
    When I select "Exercise"
    Then "Exercise" should be visually selected
    And the grid should show completion state for "Exercise"

Feature: Import, export, reset, and theme settings
  Users can preserve, restore, clear, and personalize local StreakBeacon data.

  Background:
    Given I opened StreakBeacon with local storage available

  Scenario: Theme choice persists
    When I switch the theme mode
    And I reload the app
    Then the selected theme mode should still be applied

  Scenario: Export local data as versioned JSON
    Given I created a tracked item named "Writing"
    And I marked today complete for "Writing"
    When I export my data
    Then a JSON file should be downloaded
    And the JSON should include a schema version
    And the JSON should include tracked items, completion state, and preferences

  Scenario: Import valid same-app JSON after confirmation
    Given I have a valid StreakBeacon export file
    When I import the file
    And I confirm the import preview
    Then the imported tracked items should appear
    And the imported completion state should be restored

  Scenario: Cancel import before applying changes
    Given I have a valid StreakBeacon export file
    And I have existing local data
    When I import the file
    And I cancel the import preview
    Then my existing local data should be unchanged

  Scenario: Reject invalid JSON import
    Given I have a file that is not valid JSON
    When I import the file
    Then the import should not apply
    And I should see an accessible invalid-file error

  Scenario: Reject unsupported schema version
    Given I have a StreakBeacon JSON file with an unsupported schema version
    When I import the file
    Then the import should not apply
    And I should see an accessible unsupported-version error

  Scenario: Confirm duplicate item handling during import
    Given I have an existing tracked item named "Writing"
    And I have a valid StreakBeacon export file that also contains "Writing"
    When I import the file
    And I review the import preview
    Then I should see how the duplicate tracked item will be handled
    And the import should not apply until I confirm it

  Scenario: Reset local data after confirmation
    Given I created a tracked item named "Writing"
    When I confirm reset of local data
    Then all tracked items should be cleared
    And local preferences should return to their default state

  Scenario: Cancel local data reset
    Given I created a tracked item named "Writing"
    When I start resetting local data
    And I cancel the reset
    Then "Writing" should still appear in the tracked item list
    And its completion history should be unchanged

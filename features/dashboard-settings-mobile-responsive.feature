@critical
Feature: Dashboard and Settings mobile responsiveness
  As a mobile StreakBeacon user
  I want Dashboard and Settings controls to reflow within a narrow viewport
  So that I can review and manage streaks without sideways page overflow

  Background:
    Given the StreakBeacon app is loaded at a 320px wide viewport
    And local storage contains active habits and a 365-day grid window

  @smoke
  Scenario: Keep the Dashboard page inside the 320px viewport
    Given the Dashboard is visible
    When the user views the page without interacting
    Then the document has no horizontal overflow
    And the primary Dashboard sections are readable within the viewport

  @smoke
  Scenario: Constrain 365-day grid scrolling to the grid region
    Given the Dashboard shows the 365-day streak grid
    When the user scrolls sideways within the streak grid region
    Then the grid content moves horizontally inside that region
    And the page itself remains fixed to the 320px viewport

  Scenario: Preserve minimum Dashboard touch targets on mobile
    Given the Dashboard action controls are visible
    When the user inspects the tappable controls
    Then each visible Dashboard button or grid day target is at least 44px tall and 44px wide

  @smoke
  Scenario: Reflow Settings into one column on mobile
    Given the Settings panel is visible
    When the user views the panel at a 320px wide viewport
    Then each Settings section appears in a single column
    And no Settings field or panel creates document-level horizontal overflow

  Scenario: Keep Settings controls tappable with long labels
    Given the Settings panel includes restore controls and long imported habit names
    When the user views the Settings panel at a 320px wide viewport
    Then each visible Settings button is at least 44px tall and 44px wide
    And long labels wrap within the viewport instead of forcing sideways page scrolling

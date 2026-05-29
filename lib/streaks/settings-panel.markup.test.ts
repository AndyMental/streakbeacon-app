import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { SettingsPanel } from "../../app/settings-panel";

function render(node: ReturnType<typeof createElement>) {
  return renderToStaticMarkup(node);
}

describe("SettingsPanel markup", () => {
  it("exposes the export, file import, paste import and reset controls with stable testids", () => {
    const html = render(createElement(SettingsPanel));

    assert.match(html, /data-testid="export-json-button"/);
    assert.match(html, /data-testid="import-json-file"/);
    assert.match(html, /data-testid="import-json-label"/);
    assert.match(html, /data-testid="import-json-textarea"/);
    assert.match(html, /data-testid="import-json-paste-button"/);
    assert.match(html, /data-testid="reset-data-button"/);
  });

  it("renders visible labels for the export and import controls", () => {
    const html = render(createElement(SettingsPanel));

    assert.match(html, /Export JSON/);
    assert.match(html, /Import JSON/);
    assert.match(html, /Or paste exported JSON/);
    assert.match(html, /Preview pasted JSON/);
  });

  it("does not render preview or error alerts in the default state", () => {
    const html = render(createElement(SettingsPanel));

    assert.equal(html.includes('data-testid="import-preview"'), false);
    assert.equal(html.includes('data-testid="import-error"'), false);
  });
});

describe("Alert primitive used by SettingsPanel", () => {
  it("renders the destructive variant with role=\"alert\" so invalid JSON is announced", () => {
    const html = render(
      createElement(
        Alert,
        {
          variant: "destructive",
          "data-testid": "import-error"
        } as Parameters<typeof Alert>[0],
        createElement(AlertDescription, null, "Bad JSON")
      )
    );

    assert.match(html, /role="alert"/);
    assert.match(html, /data-testid="import-error"/);
    assert.match(html, /Bad JSON/);
  });
});

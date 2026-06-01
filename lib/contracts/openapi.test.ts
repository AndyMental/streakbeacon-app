import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import Ajv from 'ajv';

test('OpenAPI contract validation', async (t) => {
  const openapiPath = path.resolve(process.cwd(), 'docs/openapi.yaml');
  
  await t.test('docs/openapi.yaml exists', () => {
    assert.strictEqual(fs.existsSync(openapiPath), true, 'docs/openapi.yaml should exist');
  });

  const content = fs.readFileSync(openapiPath, 'utf8');
  let doc: unknown;

  await t.test('docs/openapi.yaml is valid YAML', () => {
    doc = YAML.parse(content);
    assert.ok(doc, 'YAML should be parsable');
  });

  await t.test('docs/openapi.yaml has required OpenAPI 3.0.3 fields', () => {
    const d = doc as Record<string, unknown>;
    assert.strictEqual(d.openapi, '3.0.3', 'openapi version should be 3.0.3');
    assert.ok(d.info, 'info object should exist');
    assert.ok(d.paths, 'paths object should exist');
  });

  await t.test('docs/openapi.yaml schema validation (basic)', () => {
    const ajv = new Ajv();
    const d = doc as Record<string, Record<string, Record<string, unknown>>>;
    // Basic structural validation of a few key components if they exist
    if (d.components && d.components.schemas) {
      for (const [name, schema] of Object.entries(d.components.schemas)) {
        assert.ok(ajv.validateSchema(schema as Record<string, unknown>), `Schema ${name} should be valid`);
      }
    }
  });
});

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const prettier = require("prettier");
const swaggerJsdoc = require("swagger-jsdoc");
const YAML = require("yaml");

(async () => {
  const openapiPath = path.resolve(__dirname, "../docs/openapi.yaml");
  const existingOpenapi = YAML.parse(fs.readFileSync(openapiPath, "utf8"));

  const generated = swaggerJsdoc({
    definition: {
      ...existingOpenapi,
      paths: {},
    },
    apis: [path.resolve(__dirname, "../app/api/**/*.ts")],
  });

  const formatted = await prettier.format(YAML.stringify(generated), {
    parser: "yaml",
  });

  fs.writeFileSync(openapiPath, formatted);
  console.log(`Generated ${path.relative(process.cwd(), openapiPath)}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

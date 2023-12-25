// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getRollupOptions } from "@serwist/constants/rollup";
import fg from "fast-glob";

import packageJson from "../package.json" assert { type: "json" };

const isDev = process.env.NODE_ENV === "development";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const clientEntries = /** @type {Record<string, string>} */ ({});

for (const clientPath of await fg("client/*.ts", { cwd: __dirname })) {
  const parsedClientPath = path.parse(clientPath);
  clientEntries[`client/${parsedClientPath.name}`] = path.join("src", clientPath);
}

export default getRollupOptions({
  packageJson,
  jsFiles: [
    {
      input: {
        index: "src/index.ts",
        "index.browser": "src/index.browser.ts",
        ...clientEntries,
      },
      output: {
        dir: "dist",
        format: "esm",
      },
    },
  ],
  shouldEmitDeclaration: !isDev,
});

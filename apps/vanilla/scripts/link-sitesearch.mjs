/**
 * Ensures apps/vanilla/node_modules/@algolia/sitesearch → packages/standalone.
 * Bun/npm often hoist workspace deps to the repo root, so ./node_modules/... in index.html would 404.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** `apps/vanilla` (parent of `scripts/`). */
const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const repoRoot = path.resolve(appRoot, "..", "..");

const standaloneDir = path.join(repoRoot, "packages", "standalone");
const algoliaDir = path.join(appRoot, "node_modules", "@algolia");
const symlinkPath = path.join(algoliaDir, "sitesearch");

const resolvedApp = path.resolve(appRoot);
const resolvedSymlink = path.resolve(symlinkPath);
if (!resolvedSymlink.startsWith(resolvedApp + path.sep)) {
  throw new Error("link-sitesearch: symlink path must stay under apps/vanilla");
}

if (!fs.existsSync(standaloneDir)) {
  console.warn(
    "[vanilla] link-sitesearch: packages/standalone not found; skipping symlink",
  );
  process.exit(0);
}

fs.mkdirSync(algoliaDir, { recursive: true });

try {
  fs.unlinkSync(symlinkPath);
} catch {
  /* absent */
}

// Symlink uses paths built only from this file’s location + fixed segments; guarded above.
// nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
if (process.platform === "win32") {
  fs.symlinkSync(standaloneDir, symlinkPath, "junction");
} else {
  fs.symlinkSync(standaloneDir, symlinkPath);
}
console.log(
  "[vanilla] linked @algolia/sitesearch → packages/standalone (workspace)",
);

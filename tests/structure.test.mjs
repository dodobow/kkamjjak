import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

async function assertFileExists(filePath, source) {
  const absolutePath = path.resolve(rootDirectory, filePath);
  await assert.doesNotReject(
    access(absolutePath),
    `${source} references missing file: ${filePath}`
  );
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  }));
  return nestedFiles.flat();
}

const manifest = JSON.parse(
  await readFile(path.join(rootDirectory, "manifest.json"), "utf8")
);

await assertFileExists(manifest.action.default_popup, "manifest action");
await assertFileExists(manifest.background.service_worker, "manifest background");

for (const iconPath of Object.values(manifest.icons)) {
  await assertFileExists(iconPath, "manifest icons");
}

const pageFiles = (await collectFiles(path.join(rootDirectory, "pages")))
  .filter((filePath) => filePath.endsWith(".html"));

for (const pagePath of pageFiles) {
  const html = await readFile(pagePath, "utf8");
  const localResources = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((resourcePath) => !/^(?:https?:|data:|#)/.test(resourcePath));

  for (const resourcePath of localResources) {
    const absoluteResourcePath = path.resolve(path.dirname(pagePath), resourcePath);
    await assert.doesNotReject(
      access(absoluteResourcePath),
      `${path.relative(rootDirectory, pagePath)} references missing file: ${resourcePath}`
    );
  }
}

const scriptFiles = [
  ...(await collectFiles(path.join(rootDirectory, "src"))),
  ...(await collectFiles(path.join(rootDirectory, "pages")))
].filter((filePath) => filePath.endsWith(".js"));

for (const scriptPath of scriptFiles) {
  const script = await readFile(scriptPath, "utf8");
  const relativeImports = [...script.matchAll(/from\s+["'](\.[^"']+)["']/g)]
    .map((match) => match[1]);

  for (const importPath of relativeImports) {
    const absoluteImportPath = path.resolve(path.dirname(scriptPath), importPath);
    await assert.doesNotReject(
      access(absoluteImportPath),
      `${path.relative(rootDirectory, scriptPath)} imports missing file: ${importPath}`
    );
  }

  const runtimePaths = [
    ...script.matchAll(/(?:chrome\.runtime\.getURL|getRuntimeUrl)\("([^"]+)"\)/g)
  ].map((match) => match[1]);

  for (const runtimePath of runtimePaths) {
    await assertFileExists(runtimePath, path.relative(rootDirectory, scriptPath));
  }
}

console.log("project structure tests passed");

import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTION_ICON_PATHS,
  ACTION_TITLES,
  getActionState
} from "../src/action-state.js";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const now = 1_000_000;

const readyState = getActionState(now, now);
assert.equal(readyState.isReady, true);
assert.equal(readyState.iconPath, ACTION_ICON_PATHS.ready);
assert.equal(readyState.title, ACTION_TITLES.ready);

const cooldownState = getActionState(now + 1, now);
assert.equal(cooldownState.isReady, false);
assert.equal(cooldownState.iconPath, ACTION_ICON_PATHS.cooldown);
assert.equal(cooldownState.title, ACTION_TITLES.cooldown);

assert.equal(getActionState(undefined, now).isReady, true);

for (const iconSet of Object.values(ACTION_ICON_PATHS)) {
  for (const iconPath of Object.values(iconSet)) {
    await assert.doesNotReject(
      access(path.resolve(rootDirectory, iconPath)),
      `action state references missing icon: ${iconPath}`
    );
  }
}

console.log("action state tests passed");

import assert from "node:assert/strict";
import {
  TMI_ENTRIES,
  getTmiEntryById,
  selectTmiEntry
} from "../src/tmi.js";

assert.equal(TMI_ENTRIES.length, 16);
assert.equal(new Set(TMI_ENTRIES.map((entry) => entry.id)).size, TMI_ENTRIES.length);
assert.equal(getTmiEntryById("venus-day")?.text, "금성에서는 하루가 1년보다 깁니다.");
assert.equal(getTmiEntryById("missing"), null);
assert.equal(selectTmiEntry("octopus-hearts", () => .99).id, "octopus-hearts");
assert.equal(selectTmiEntry(null, () => 0).id, "developer-mbti");
assert.equal(selectTmiEntry("missing", () => .99).id, "spinosaurus-length");

console.log("TMI selection tests passed");

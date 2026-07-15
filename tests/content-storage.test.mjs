import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import {
  EVENTS,
  RARITY_ORDER,
  RARITY_WEIGHTS,
  formatProbabilityLabel
} from "../src/constants.js";
import { getEventContentItems, selectEventContent } from "../src/content.js";
import { pickWeightedEvent } from "../src/utils.js";

function sequenceRandom(...values) {
  let index = 0;
  return () => values[index++] ?? 0;
}

const database = {
  collection: {
    spin_world: {
      discovered: true,
      firstDiscoveredAt: 1,
      lastDiscoveredAt: 2,
      count: 3
    }
  }
};

globalThis.chrome = {
  runtime: { lastError: null },
  storage: {
    local: {
      get(keys, callback) {
        if (typeof keys === "string") {
          callback({ [keys]: database[keys] });
          return;
        }

        const defaults = keys && typeof keys === "object" && !Array.isArray(keys)
          ? keys
          : {};
        const result = { ...defaults };
        Object.keys(defaults).forEach((key) => {
          if (key in database) result[key] = database[key];
        });
        callback(result);
      },
      set(items, callback) {
        Object.assign(database, items);
        callback();
      }
    }
  }
};

const storage = await import("../src/storage.js");
let collection = await storage.getCollectionData();

assert.equal(collection.spin_world.count, 3);
assert.equal(Object.keys(collection.sudden_cat.subItems).length, 2);
assert.equal(Object.keys(collection.tab_exile.subItems).length, 3);

const dogSelection = selectEventContent("sudden_cat", "dog", "dog-01");
const discovery = await storage.updateEventDiscovery("sudden_cat", dogSelection);
collection = await storage.getCollectionData();

assert.equal(discovery.isNewSubItemDiscovery, true);
assert.equal(collection.sudden_cat.subItems.dog.count, 1);
assert.equal(collection.sudden_cat.subItems.spinosaurus.discovered, false);

await storage.unlockAllEventsForDebug();
collection = await storage.getCollectionData();

assert.equal(collection.tab_exile.subItems.waterfall.discovered, true);
assert.equal(getEventContentItems("tab_exile").length, 3);

const expectedRarityCounts = {
  Common: 6,
  Rare: 7,
  Epic: 4,
  Legendary: 2,
  Mythic: 1
};

assert.ok(Math.abs(EVENTS.reduce((sum, event) => sum + event.weight, 0) - 100) < 1e-10);
RARITY_ORDER.forEach((rarity) => {
  const rarityEvents = EVENTS.filter((event) => event.rarity === rarity);
  const rarityWeight = rarityEvents.reduce((sum, event) => sum + event.weight, 0);
  assert.equal(rarityEvents.length, expectedRarityCounts[rarity]);
  assert.ok(Math.abs(rarityWeight - RARITY_WEIGHTS[rarity]) < 1e-10);
  rarityEvents.forEach((event) => {
    assert.equal(event.weight, RARITY_WEIGHTS[rarity] / rarityEvents.length);
  });
});

assert.equal(pickWeightedEvent(EVENTS, sequenceRandom(0, 0)).rarity, "Common");
assert.equal(pickWeightedEvent(EVENTS, sequenceRandom(.5, 0)).rarity, "Rare");
assert.equal(pickWeightedEvent(EVENTS, sequenceRandom(.85, 0)).rarity, "Epic");
assert.equal(pickWeightedEvent(EVENTS, sequenceRandom(.95, 0)).rarity, "Legendary");
assert.equal(pickWeightedEvent(EVENTS, sequenceRandom(.99, 0)).rarity, "Mythic");

const spinosaurusSelection = selectEventContent(
  "sudden_cat",
  null,
  null,
  sequenceRandom(.99, 0)
);
const beachSelection = selectEventContent(
  "tab_exile",
  null,
  null,
  sequenceRandom(.34, 0)
);
assert.equal(spinosaurusSelection.itemId, "spinosaurus");
assert.equal(beachSelection.itemId, "beach");
assert.equal(formatProbabilityLabel(EVENTS.find((event) => event.id === "sudden_cat").probability / 2), "4.17%");
assert.equal(formatProbabilityLabel(EVENTS.find((event) => event.id === "tab_exile").probability / 3), "1.67%");

for (const eventId of ["sudden_cat", "tab_exile"]) {
  for (const item of getEventContentItems(eventId)) {
    for (const asset of item.assets) {
      await access(new URL(`../${asset.path}`, import.meta.url));
    }
  }
}

console.log("content and storage tests passed");

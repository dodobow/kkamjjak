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

assert.equal(await storage.getContentNoRepeatEnabled(), true);

const unseenSelection = await storage.selectContentForDraw(
  "sudden_cat",
  sequenceRandom(0, 0)
);
assert.equal(unseenSelection.itemId, "spinosaurus");

await storage.updateEventDiscovery("sudden_cat", unseenSelection);
const firstCycleSelection = await storage.selectContentForDraw(
  "sudden_cat",
  sequenceRandom(.99, 0)
);
assert.equal(firstCycleSelection.itemId, "dog");
assert.deepEqual(database.contentDrawState.sudden_cat, {
  remainingItemIds: [],
  lastItemId: "spinosaurus"
});

await storage.updateEventDiscovery("sudden_cat", firstCycleSelection);
assert.deepEqual(database.contentDrawState.sudden_cat, {
  remainingItemIds: ["spinosaurus"],
  lastItemId: "dog"
});

const secondCycleSelection = await storage.selectContentForDraw(
  "sudden_cat",
  sequenceRandom(0, 0)
);
assert.equal(secondCycleSelection.itemId, "spinosaurus");
await storage.updateEventDiscovery("sudden_cat", secondCycleSelection);

const cycleBoundarySelection = await storage.selectContentForDraw(
  "sudden_cat",
  sequenceRandom(.99, 0)
);
assert.equal(cycleBoundarySelection.itemId, "dog");

await storage.setContentNoRepeatEnabled(false);
assert.deepEqual(database.contentDrawState, {});
const unrestrictedSelection = await storage.selectContentForDraw(
  "sudden_cat",
  sequenceRandom(.99, 0)
);
assert.equal(unrestrictedSelection.itemId, "spinosaurus");
await storage.setContentNoRepeatEnabled(true);

await storage.unlockAllEventsForDebug();
assert.deepEqual(
  database.contentDrawState,
  {},
  "debug unlock should reset subitem draw cycles"
);

const travelCycle = [];
for (const random of [0, .99, 0]) {
  const selection = await storage.selectContentForDraw(
    "tab_exile",
    sequenceRandom(random, 0)
  );
  travelCycle.push(selection.itemId);
  await storage.updateEventDiscovery("tab_exile", selection);
}

assert.equal(
  new Set(travelCycle).size,
  3,
  "all travel scenes should appear once before the cycle refills"
);

const nextTravel = await storage.selectContentForDraw(
  "tab_exile",
  sequenceRandom(.99, 0)
);
assert.notEqual(
  nextTravel.itemId,
  travelCycle.at(-1),
  "the first travel scene in a new cycle should not immediately repeat"
);

collection = await storage.getCollectionData();

assert.equal(collection.tab_exile.subItems.waterfall.discovered, true);
assert.equal(getEventContentItems("tab_exile").length, 3);

const expectedRarityCounts = {
  Common: 5,
  Rare: 7,
  Epic: 3,
  Legendary: 2,
  Mythic: 1
};

assert.ok(Math.abs(EVENTS.reduce((sum, event) => sum + event.weight, 0) - 100) < 1e-10);
assert.equal(EVENTS.length, 18);
assert.equal(EVENTS.some((event) => event.category === "사운드"), false);
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
assert.equal(formatProbabilityLabel(EVENTS.find((event) => event.id === "sudden_cat").probability / 2), "5.0%");
assert.equal(formatProbabilityLabel(EVENTS.find((event) => event.id === "tab_exile").probability / 3), "1.67%");

for (const eventId of ["sudden_cat", "tab_exile"]) {
  for (const item of getEventContentItems(eventId)) {
    for (const asset of item.assets) {
      await access(new URL(`../${asset.path}`, import.meta.url));
    }
  }
}

console.log("content and storage tests passed");

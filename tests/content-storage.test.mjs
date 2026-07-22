import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import {
  EVENTS,
  RARITY_ORDER,
  RARITY_WEIGHTS,
  formatProbabilityLabel
} from "../src/constants.js";
import {
  getContentItemProbability,
  getEventContentItems,
  selectEventContent
} from "../src/content.js";
import { pickWeightedEvent } from "../src/utils.js";

function sequenceRandom(...values) {
  let index = 0;
  return () => values[index++] ?? 0;
}

function createSubItemState(eventId, discoveredItemIds = []) {
  const discoveredItems = new Set(discoveredItemIds);
  return Object.fromEntries(
    getEventContentItems(eventId).map((item) => [
      item.id,
      { discovered: discoveredItems.has(item.id) }
    ])
  );
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
const discoveryItems = getEventContentItems("sudden_cat");
const travelItems = getEventContentItems("tab_exile");

assert.equal(collection.spin_world.count, 3);
assert.equal(Object.keys(collection.sudden_cat.subItems).length, 9);
assert.equal(Object.keys(collection.tab_exile.subItems).length, 6);
assert.deepEqual(
  Object.fromEntries(travelItems.map((item) => [item.id, item.interaction])),
  {
    forest: "leaves",
    beach: "ripples",
    waterfall: "ripples",
    canyon: "dust",
    lake: "ripples",
    meadow: "petals"
  }
);

const dogSelection = selectEventContent("sudden_cat", "dog", "dog-01");
const discovery = await storage.updateEventDiscovery("sudden_cat", dogSelection);
collection = await storage.getCollectionData();

assert.equal(discovery.isNewSubItemDiscovery, true);
assert.equal(collection.sudden_cat.subItems.dog.count, 1);
assert.equal(collection.sudden_cat.subItems.spinosaurus.discovered, false);

assert.deepEqual(await storage.getContentNoRepeatPreferences(), {
  sudden_cat: true,
  tab_exile: true
});
assert.equal(await storage.getContentNoRepeatEnabled("sudden_cat"), true);

const unseenSelection = await storage.selectContentForDraw(
  "sudden_cat",
  sequenceRandom(0, 0)
);
assert.notEqual(unseenSelection.itemId, "dog");

await storage.updateEventDiscovery("sudden_cat", unseenSelection);
const firstDiscoveryCycle = new Set(["dog", unseenSelection.itemId]);
while (firstDiscoveryCycle.size < discoveryItems.length) {
  const selection = await storage.selectContentForDraw(
    "sudden_cat",
    sequenceRandom(0, 0)
  );
  assert.equal(firstDiscoveryCycle.has(selection.itemId), false);
  firstDiscoveryCycle.add(selection.itemId);
  await storage.updateEventDiscovery("sudden_cat", selection);
}

const completedDiscoveryCycle = [];
while (completedDiscoveryCycle.length < discoveryItems.length) {
  const selection = await storage.selectContentForDraw(
    "sudden_cat",
    sequenceRandom(completedDiscoveryCycle.length === 0 ? .99 : 0, 0)
  );
  assert.equal(completedDiscoveryCycle.includes(selection.itemId), false);
  completedDiscoveryCycle.push(selection.itemId);
  await storage.updateEventDiscovery("sudden_cat", selection);
}

assert.equal(database.contentDrawState.sudden_cat.remainingItemIds.length, 0);
assert.equal(
  database.contentDrawState.sudden_cat.lastItemId,
  completedDiscoveryCycle.at(-1)
);

const cycleBoundarySelection = await storage.selectContentForDraw(
  "sudden_cat",
  sequenceRandom(.99, 0)
);
assert.notEqual(cycleBoundarySelection.itemId, completedDiscoveryCycle.at(-1));

database.contentDrawState.tab_exile = {
  remainingItemIds: ["beach"],
  lastItemId: "forest"
};
await storage.setContentNoRepeatEnabled("sudden_cat", false);
assert.deepEqual(database.contentNoRepeat, {
  sudden_cat: false,
  tab_exile: true
});
assert.deepEqual(database.contentDrawState, {
  tab_exile: {
    remainingItemIds: ["beach"],
    lastItemId: "forest"
  }
});
assert.equal(await storage.getContentNoRepeatEnabled("tab_exile"), true);
const unrestrictedSelection = await storage.selectContentForDraw(
  "sudden_cat",
  sequenceRandom(.99, 0)
);
assert.equal(unrestrictedSelection.itemId, "spinosaurus");
await storage.setContentNoRepeatEnabled("sudden_cat", true);

await storage.unlockAllEventsForDebug();
assert.deepEqual(
  database.contentDrawState,
  {},
  "debug unlock should reset subitem draw cycles"
);

const travelCycle = [];
for (let index = 0; index < travelItems.length; index += 1) {
  const selection = await storage.selectContentForDraw(
    "tab_exile",
    sequenceRandom(index % 2 === 0 ? 0 : .99, 0)
  );
  travelCycle.push(selection.itemId);
  await storage.updateEventDiscovery("tab_exile", selection);
}

assert.equal(
  new Set(travelCycle).size,
  travelItems.length,
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
assert.equal(getEventContentItems("tab_exile").length, 6);

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
  sequenceRandom(.2, 0)
);
assert.equal(spinosaurusSelection.itemId, "spinosaurus");
assert.equal(beachSelection.itemId, "beach");
assert.equal(formatProbabilityLabel(EVENTS.find((event) => event.id === "sudden_cat").probability / 9), "1.11%");
assert.equal(formatProbabilityLabel(EVENTS.find((event) => event.id === "tab_exile").probability / 6), "0.83%");

const suddenCatProbability = EVENTS.find((event) => event.id === "sudden_cat").probability;
const tabExileProbability = EVENTS.find((event) => event.id === "tab_exile").probability;
const partialDiscovery = createSubItemState("sudden_cat", ["dog"]);
const partialTravelDiscovery = createSubItemState("tab_exile", ["forest"]);
const completeTravelDiscovery = createSubItemState(
  "tab_exile",
  travelItems.map((item) => item.id)
);

assert.equal(
  formatProbabilityLabel(getContentItemProbability(
    "sudden_cat",
    "dog",
    suddenCatProbability,
    partialDiscovery,
    true
  )),
  "0%"
);
assert.equal(
  formatProbabilityLabel(getContentItemProbability(
    "sudden_cat",
    "spinosaurus",
    suddenCatProbability,
    partialDiscovery,
    true
  )),
  "1.25%"
);
assert.equal(
  formatProbabilityLabel(getContentItemProbability(
    "tab_exile",
    "beach",
    tabExileProbability,
    partialTravelDiscovery,
    true
  )),
  "1.0%"
);
assert.equal(
  formatProbabilityLabel(getContentItemProbability(
    "tab_exile",
    "forest",
    tabExileProbability,
    partialTravelDiscovery,
    false
  )),
  "0.83%"
);
assert.equal(
  formatProbabilityLabel(getContentItemProbability(
    "tab_exile",
    "forest",
    tabExileProbability,
    completeTravelDiscovery,
    true
  )),
  "0.83%"
);

for (const eventId of ["sudden_cat", "tab_exile"]) {
  for (const item of getEventContentItems(eventId)) {
    for (const asset of item.assets) {
      await access(new URL(`../${asset.path}`, import.meta.url));
    }
  }
}

const registeredDiscoveryFiles = discoveryItems
  .flatMap((item) => item.assets)
  .map((asset) => asset.path.split("/").at(-1))
  .sort();
const registeredSceneFiles = travelItems
  .flatMap((item) => item.assets)
  .map((asset) => asset.path.split("/").at(-1))
  .sort();

assert.deepEqual(
  registeredDiscoveryFiles,
  (await readdir(new URL("../assets/images/discoveries/", import.meta.url))).sort(),
  "all discovery images should be registered"
);
assert.deepEqual(
  registeredSceneFiles,
  (await readdir(new URL("../assets/images/scenes/", import.meta.url))).sort(),
  "all travel scenes should be registered"
);

console.log("content and storage tests passed");

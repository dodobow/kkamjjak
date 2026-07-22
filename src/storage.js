import { EVENTS, STORAGE_KEYS } from "./constants.js";
import { getEventContentItems, selectEventContent } from "./content.js";

function getFromStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (items) => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.error("storage get failed", error);
        reject(error);
        return;
      }
      resolve(items);
    });
  });
}

function setToStorage(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.error("storage set failed", error);
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function createEmptySubItemEntry() {
  return {
    discovered: false,
    firstDiscoveredAt: null,
    lastDiscoveredAt: null,
    count: 0,
    lastAssetId: null
  };
}

function normalizeSubItems(eventId, rawSubItems = {}) {
  return getEventContentItems(eventId).reduce((items, item) => {
    items[item.id] = {
      ...createEmptySubItemEntry(),
      ...(rawSubItems[item.id] || {})
    };
    return items;
  }, {});
}

function createEmptyEntry(eventId) {
  const entry = {
    discovered: false,
    firstDiscoveredAt: null,
    lastDiscoveredAt: null,
    count: 0
  };

  if (getEventContentItems(eventId).length) {
    entry.subItems = normalizeSubItems(eventId);
  }

  return entry;
}

function normalizeCollection(rawCollection = {}) {
  return EVENTS.reduce((collection, event) => {
    const rawEntry = rawCollection[event.id] || {};
    collection[event.id] = {
      ...createEmptyEntry(event.id),
      ...rawEntry
    };

    if (getEventContentItems(event.id).length) {
      collection[event.id].subItems = normalizeSubItems(event.id, rawEntry.subItems);
      const subItemCount = Object.values(collection[event.id].subItems).reduce(
        (sum, subItem) => sum + (subItem.count || 0),
        0
      );
      collection[event.id].count = Math.max(
        collection[event.id].count || 0,
        subItemCount
      );
    }

    return collection;
  }, {});
}

function normalizeDrawState(eventId, rawState = {}) {
  const validItemIds = new Set(getEventContentItems(eventId).map((item) => item.id));
  const remainingItemIds = Array.isArray(rawState.remainingItemIds)
    ? [...new Set(rawState.remainingItemIds)].filter((itemId) => validItemIds.has(itemId))
    : [];

  return {
    remainingItemIds,
    lastItemId: validItemIds.has(rawState.lastItemId) ? rawState.lastItemId : null
  };
}

function pickRandomItem(items, random) {
  return items[Math.floor(random() * items.length)] || null;
}

function getContentEventIds() {
  return EVENTS
    .filter((event) => getEventContentItems(event.id).length)
    .map((event) => event.id);
}

function normalizeContentNoRepeatPreferences(rawPreferences) {
  const legacyEnabled = typeof rawPreferences === "boolean" ? rawPreferences : true;
  const storedPreferences = rawPreferences && typeof rawPreferences === "object"
    ? rawPreferences
    : {};

  return getContentEventIds().reduce((preferences, eventId) => {
    preferences[eventId] = eventId in storedPreferences
      ? storedPreferences[eventId] !== false
      : legacyEnabled;
    return preferences;
  }, {});
}

function hasCurrentContentPreferences(rawPreferences) {
  return Boolean(
    rawPreferences
    && typeof rawPreferences === "object"
    && getContentEventIds().every((eventId) => typeof rawPreferences[eventId] === "boolean")
  );
}

export async function getCollectionData() {
  const items = await getFromStorage(STORAGE_KEYS.collection);
  const storedCollection = items[STORAGE_KEYS.collection];
  const collection = normalizeCollection(storedCollection);

  if (!storedCollection) {
    await setToStorage({ [STORAGE_KEYS.collection]: collection });
  }

  return collection;
}

export async function getContentNoRepeatPreferences() {
  const items = await getFromStorage({ [STORAGE_KEYS.contentNoRepeat]: null });
  const rawPreferences = items[STORAGE_KEYS.contentNoRepeat];
  const preferences = normalizeContentNoRepeatPreferences(rawPreferences);

  if (!hasCurrentContentPreferences(rawPreferences)) {
    await setToStorage({ [STORAGE_KEYS.contentNoRepeat]: preferences });
  }

  return preferences;
}

export async function getContentNoRepeatEnabled(eventId) {
  const preferences = await getContentNoRepeatPreferences();
  return preferences[eventId] !== false;
}

export async function setContentNoRepeatEnabled(eventId, enabled) {
  if (!getEventContentItems(eventId).length) {
    throw new Error(`Event has no content items: ${eventId}`);
  }

  const items = await getFromStorage({
    [STORAGE_KEYS.contentNoRepeat]: null,
    [STORAGE_KEYS.contentDrawState]: {}
  });
  const preferences = normalizeContentNoRepeatPreferences(items[STORAGE_KEYS.contentNoRepeat]);
  const drawStates = { ...(items[STORAGE_KEYS.contentDrawState] || {}) };
  preferences[eventId] = Boolean(enabled);
  delete drawStates[eventId];

  await setToStorage({
    [STORAGE_KEYS.contentNoRepeat]: preferences,
    [STORAGE_KEYS.contentDrawState]: drawStates
  });
}

export async function selectContentForDraw(eventId, random = Math.random) {
  const contentItems = getEventContentItems(eventId);
  if (!contentItems.length) return null;

  const items = await getFromStorage({
    [STORAGE_KEYS.collection]: {},
    [STORAGE_KEYS.contentNoRepeat]: null,
    [STORAGE_KEYS.contentDrawState]: {}
  });
  const noRepeatEnabled = normalizeContentNoRepeatPreferences(
    items[STORAGE_KEYS.contentNoRepeat]
  )[eventId] !== false;

  if (!noRepeatEnabled) {
    return selectEventContent(eventId, null, null, random);
  }

  const collection = normalizeCollection(items[STORAGE_KEYS.collection]);
  const undiscoveredItems = contentItems.filter(
    (item) => !collection[eventId]?.subItems?.[item.id]?.discovered
  );
  let candidates = undiscoveredItems;

  if (!candidates.length) {
    const drawState = normalizeDrawState(
      eventId,
      items[STORAGE_KEYS.contentDrawState]?.[eventId]
    );
    const remainingIds = new Set(drawState.remainingItemIds);
    candidates = contentItems.filter((item) => remainingIds.has(item.id));

    if (!candidates.length) {
      candidates = contentItems.length > 1
        ? contentItems.filter((item) => item.id !== drawState.lastItemId)
        : contentItems;
    }
  }

  const selectedItem = pickRandomItem(candidates, random);
  return selectEventContent(eventId, selectedItem?.id, null, random);
}

export async function updateEventDiscovery(eventId, contentSelection = null) {
  if (!EVENTS.some((event) => event.id === eventId)) {
    throw new Error(`Unknown eventId: ${eventId}`);
  }

  const items = await getFromStorage({
    [STORAGE_KEYS.collection]: {},
    [STORAGE_KEYS.contentNoRepeat]: null,
    [STORAGE_KEYS.contentDrawState]: {}
  });
  const collection = normalizeCollection(items[STORAGE_KEYS.collection]);
  const now = Date.now();
  const previous = collection[eventId];
  const isNewDiscovery = !previous.discovered;
  const subItemId = contentSelection?.itemId;
  const previousSubItem = subItemId ? previous.subItems?.[subItemId] : null;
  const isNewSubItemDiscovery = Boolean(subItemId && !previousSubItem?.discovered);
  const contentItemIds = getEventContentItems(eventId).map((item) => item.id);
  const allPreviouslyDiscovered = contentItemIds.length > 0 && contentItemIds.every(
    (itemId) => previous.subItems?.[itemId]?.discovered
  );

  collection[eventId] = {
    ...previous,
    ...(previous.subItems ? { subItems: { ...previous.subItems } } : {}),
    discovered: true,
    firstDiscoveredAt: previous.firstDiscoveredAt || now,
    lastDiscoveredAt: now,
    count: (previous.count || 0) + 1
  };

  if (subItemId && previousSubItem) {
    collection[eventId].subItems[subItemId] = {
      ...previousSubItem,
      discovered: true,
      firstDiscoveredAt: previousSubItem.firstDiscoveredAt || now,
      lastDiscoveredAt: now,
      count: (previousSubItem.count || 0) + 1,
      lastAssetId: contentSelection.assetId || previousSubItem.lastAssetId
    };
  }

  const updates = { [STORAGE_KEYS.collection]: collection };
  const noRepeatEnabled = normalizeContentNoRepeatPreferences(
    items[STORAGE_KEYS.contentNoRepeat]
  )[eventId] !== false;

  if (subItemId && previousSubItem && noRepeatEnabled) {
    const drawStates = { ...(items[STORAGE_KEYS.contentDrawState] || {}) };
    const drawState = normalizeDrawState(eventId, drawStates[eventId]);
    const remainingItemIds = allPreviouslyDiscovered
      ? (drawState.remainingItemIds.length ? drawState.remainingItemIds : contentItemIds)
        .filter((itemId) => itemId !== subItemId)
      : [];

    drawStates[eventId] = {
      remainingItemIds,
      lastItemId: subItemId
    };
    updates[STORAGE_KEYS.contentDrawState] = drawStates;
  }

  await setToStorage(updates);

  return {
    isNewDiscovery,
    isNewSubItemDiscovery,
    entry: collection[eventId]
  };
}

export async function getCooldownData() {
  const items = await getFromStorage(STORAGE_KEYS.cooldown);
  const storedCooldown = items[STORAGE_KEYS.cooldown];

  const cooldown = {
    nextAvailableAt: storedCooldown?.nextAvailableAt || 0
  };

  if (!storedCooldown) {
    await setToStorage({ [STORAGE_KEYS.cooldown]: cooldown });
  }

  return cooldown;
}

export async function setCooldown(nextAvailableAt) {
  await setToStorage({
    [STORAGE_KEYS.cooldown]: {
      nextAvailableAt
    }
  });
}

export async function clearCooldownForDebug() {
  await setCooldown(0);
}

export async function unlockAllEventsForDebug() {
  const now = Date.now();
  const collection = EVENTS.reduce((result, event) => {
    const entry = {
      discovered: true,
      firstDiscoveredAt: now,
      lastDiscoveredAt: now,
      count: 1
    };

    const contentItems = getEventContentItems(event.id);
    if (contentItems.length) {
      entry.subItems = contentItems.reduce((subItems, item) => {
        subItems[item.id] = {
          discovered: true,
          firstDiscoveredAt: now,
          lastDiscoveredAt: now,
          count: 1,
          lastAssetId: item.assets[0]?.id || null
        };
        return subItems;
      }, {});
      entry.count = contentItems.length;
    }

    result[event.id] = entry;
    return result;
  }, {});

  await setToStorage({
    [STORAGE_KEYS.collection]: collection,
    [STORAGE_KEYS.contentDrawState]: {}
  });
  return collection;
}

export async function resetCollectionForDebug() {
  const collection = normalizeCollection({});
  await setToStorage({
    [STORAGE_KEYS.collection]: collection,
    [STORAGE_KEYS.contentDrawState]: {}
  });
  await setLastResult(null);
  return collection;
}

export async function getLastResult() {
  const items = await getFromStorage({ [STORAGE_KEYS.lastResult]: null });
  return items[STORAGE_KEYS.lastResult] || null;
}

export async function setLastResult(result) {
  await setToStorage({ [STORAGE_KEYS.lastResult]: result });
}

export async function getProgress() {
  const collection = await getCollectionData();
  const discoveredCount = EVENTS.filter(
    (event) => collection[event.id]?.discovered
  ).length;

  return {
    discoveredCount,
    totalCount: EVENTS.length,
    collection
  };
}

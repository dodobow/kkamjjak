const EVENT_CONTENT = {
  sudden_cat: {
    kind: "discovery",
    items: [
      {
        id: "dog",
        name: "강아지",
        assets: [
          {
            id: "dog-01",
            path: "assets/images/discoveries/dog.png",
            alt: "강아지"
          }
        ]
      },
      {
        id: "spinosaurus",
        name: "스피노사우루스",
        assets: [
          {
            id: "spinosaurus-01",
            path: "assets/images/discoveries/spinosaurus.png",
            alt: "스피노사우루스"
          }
        ]
      }
    ]
  },
  tab_exile: {
    kind: "scene",
    items: [
      {
        id: "forest",
        name: "숲",
        interaction: "leaves",
        assets: [
          {
            id: "forest-01",
            path: "assets/images/scenes/forest-01.png",
            alt: "햇빛이 비치는 숲길"
          }
        ]
      },
      {
        id: "beach",
        name: "바닷가",
        interaction: "ripples",
        assets: [
          {
            id: "beach-01",
            path: "assets/images/scenes/beach-01.png",
            alt: "잔잔한 바다와 모래사장"
          }
        ]
      },
      {
        id: "waterfall",
        name: "폭포",
        interaction: "ripples",
        assets: [
          {
            id: "waterfall-01",
            path: "assets/images/scenes/waterfall-01.png",
            alt: "숲속의 작은 폭포와 연못"
          }
        ]
      }
    ]
  }
};

function randomFrom(items, random) {
  return items[Math.floor(random() * items.length)];
}

export function getEventContent(eventId) {
  return EVENT_CONTENT[eventId] || null;
}

export function getEventContentItems(eventId) {
  return getEventContent(eventId)?.items || [];
}

export function getEventContentItem(eventId, itemId) {
  return getEventContentItems(eventId).find((item) => item.id === itemId) || null;
}

export function getContentItemProbability(
  eventId,
  itemId,
  parentProbability,
  subItems = {},
  noRepeatEnabled = true
) {
  const contentItems = getEventContentItems(eventId);
  if (!contentItems.some((item) => item.id === itemId)) return 0;

  if (!noRepeatEnabled) {
    return parentProbability / contentItems.length;
  }

  const undiscoveredCount = contentItems.filter(
    (item) => !subItems[item.id]?.discovered
  ).length;
  if (undiscoveredCount === 0) {
    return parentProbability / contentItems.length;
  }

  if (subItems[itemId]?.discovered) return 0;
  return parentProbability / undiscoveredCount;
}

export function selectEventContent(
  eventId,
  preferredItemId,
  preferredAssetId,
  random = Math.random
) {
  const definition = getEventContent(eventId);
  if (!definition?.items.length) return null;

  const item = getEventContentItem(eventId, preferredItemId)
    || randomFrom(definition.items, random);
  if (!item?.assets.length) return null;

  const asset = item.assets.find((candidate) => candidate.id === preferredAssetId)
    || randomFrom(item.assets, random);

  return {
    eventId,
    kind: definition.kind,
    itemId: item.id,
    itemName: item.name,
    assetId: asset.id,
    assetPath: asset.path,
    alt: asset.alt,
    interaction: item.interaction || null
  };
}

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
        id: "barn-owl",
        name: "가면올빼미",
        assets: [
          {
            id: "barn-owl-01",
            path: "assets/images/discoveries/barn-owl.png",
            alt: "가면올빼미"
          }
        ]
      },
      {
        id: "capybara",
        name: "카피바라",
        assets: [
          {
            id: "capybara-01",
            path: "assets/images/discoveries/capybara.png",
            alt: "카피바라"
          }
        ]
      },
      {
        id: "crested-gecko",
        name: "크레스티드 게코",
        assets: [
          {
            id: "crested-gecko-01",
            path: "assets/images/discoveries/crested-gecko.png",
            alt: "크레스티드 게코"
          }
        ]
      },
      {
        id: "emperor-penguin",
        name: "황제펭귄",
        assets: [
          {
            id: "emperor-penguin-01",
            path: "assets/images/discoveries/emperor-penguin.png",
            alt: "황제펭귄"
          }
        ]
      },
      {
        id: "fennec-fox",
        name: "사막여우",
        assets: [
          {
            id: "fennec-fox-01",
            path: "assets/images/discoveries/fennec-fox.png",
            alt: "사막여우"
          }
        ]
      },
      {
        id: "green-sea-turtle",
        name: "푸른바다거북",
        assets: [
          {
            id: "green-sea-turtle-01",
            path: "assets/images/discoveries/green-sea-turtle.png",
            alt: "푸른바다거북"
          }
        ]
      },
      {
        id: "red-panda",
        name: "레서판다",
        assets: [
          {
            id: "red-panda-01",
            path: "assets/images/discoveries/red-panda.png",
            alt: "레서판다"
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
            path: "assets/images/scenes/forest.png",
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
            path: "assets/images/scenes/beach.png",
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
            path: "assets/images/scenes/waterfall.png",
            alt: "숲속의 작은 폭포와 연못"
          }
        ]
      },
      {
        id: "canyon",
        name: "협곡",
        interaction: "dust",
        assets: [
          {
            id: "canyon-01",
            path: "assets/images/scenes/canyon.png",
            alt: "붉은 바위 사이로 이어진 협곡길"
          }
        ]
      },
      {
        id: "lake",
        name: "호숫가",
        interaction: "ripples",
        assets: [
          {
            id: "lake-01",
            path: "assets/images/scenes/lake.png",
            alt: "산으로 둘러싸인 잔잔한 호수"
          }
        ]
      },
      {
        id: "meadow",
        name: "초원",
        interaction: "petals",
        assets: [
          {
            id: "meadow-01",
            path: "assets/images/scenes/meadow.png",
            alt: "들꽃이 핀 초원과 오솔길"
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

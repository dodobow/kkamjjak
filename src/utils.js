import {
  CATEGORIES,
  EVENTS,
  RARITY_ORDER,
  RARITY_WEIGHTS
} from "./constants.js";

export function getEventById(eventId) {
  return EVENTS.find((event) => event.id === eventId) || null;
}

export function pickWeightedEvent(events = EVENTS, random = Math.random) {
  const rarityGroups = RARITY_ORDER.map((rarity) => ({
    rarity,
    events: events.filter((event) => event.rarity === rarity),
    weight: RARITY_WEIGHTS[rarity]
  })).filter((group) => group.events.length > 0);
  const totalWeight = rarityGroups.reduce((sum, group) => sum + group.weight, 0);
  let rarityRoll = random() * totalWeight;
  let selectedGroup = rarityGroups[rarityGroups.length - 1];

  for (const group of rarityGroups) {
    if (rarityRoll < group.weight) {
      selectedGroup = group;
      break;
    }
    rarityRoll -= group.weight;
  }

  return selectedGroup.events[Math.floor(random() * selectedGroup.events.length)];
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

export function getCategoryStats(collectionData) {
  return CATEGORIES.map((category) => {
    const events = EVENTS.filter((event) => event.category === category);
    const discovered = events.filter(
      (event) => collectionData[event.id]?.discovered
    ).length;

    return {
      category,
      discovered,
      total: events.length,
      events
    };
  });
}

export function isScriptableUrl(url = "") {
  return /^(https?:|file:)/.test(url);
}

export function getFriendlyExecutionError(message = "") {
  if (
    message.includes("Cannot access") ||
    message.includes("The extensions gallery") ||
    message.includes("chrome://") ||
    message.includes("Cannot access contents")
  ) {
    return "이 페이지에서는 실행할 수 없습니다.";
  }

  return "오류가 발생했습니다. 다시 시도해 주세요.";
}

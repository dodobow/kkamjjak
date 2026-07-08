import { CATEGORIES, EVENTS } from "./constants.js";

export function getEventById(eventId) {
  return EVENTS.find((event) => event.id === eventId) || null;
}

export function pickWeightedEvent(events = EVENTS) {
  const totalWeight = events.reduce((sum, event) => sum + event.weight, 0);
  let random = Math.random() * totalWeight;

  for (const event of events) {
    random -= event.weight;
    if (random <= 0) return event;
  }

  return events[events.length - 1];
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
    return "이 페이지에서는 버튼의 힘이 통하지 않습니다.";
  }

  return "오류가 발생했습니다. 다시 시도해 주세요.";
}

import {
  APP_NAME,
  DEV_SHOW_DEBUG_TOOLS,
  DEV_UNLOCK_ALL_EVENTS,
  EVENTS,
  formatProbabilityLabel
} from "./src/constants.js";
import { getEventContent, getEventContentItems } from "./src/content.js";
import { executeEventById } from "./src/effects.js";
import { initTheme } from "./src/theme.js";
import {
  clearCooldownForDebug,
  getCollectionData,
  getProgress,
  resetCollectionForDebug,
  unlockAllEventsForDebug
} from "./src/storage.js";
import {
  formatTimestamp,
  getCategoryStats,
  getEventById,
  isScriptableUrl
} from "./src/utils.js";

const elements = {
  title: document.querySelector("#collectionTitle"),
  totalProgress: document.querySelector("#totalProgress"),
  categoryStats: document.querySelector("#categoryStats"),
  eventSections: document.querySelector("#eventSections"),
  statusText: document.querySelector("#statusText")
};

let collection = {};
const pageParams = new URLSearchParams(location.search);
let replayTargetTabId = Number(pageParams.get("targetTabId")) || null;

function setStatus(message, state = "info") {
  elements.statusText.textContent = message;
  elements.statusText.dataset.state = message ? state : "idle";
}

function shouldShowDebugTools() {
  return DEV_SHOW_DEBUG_TOOLS || pageParams.get("debug") === "1";
}

async function resolveReplayTargetTabId() {
  if (replayTargetTabId) {
    try {
      const tab = await chrome.tabs.get(replayTargetTabId);
      if (isScriptableUrl(tab?.url)) return replayTargetTabId;
    } catch (error) {
      console.warn("stored replay target is unavailable", error);
    }

    replayTargetTabId = null;
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  const targetTab = tabs
    .filter((tab) => isScriptableUrl(tab.url))
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];

  replayTargetTabId = targetTab?.id || null;
  return replayTargetTabId;
}

function createDevUnlockedCollection(collectionData) {
  if (!DEV_UNLOCK_ALL_EVENTS) return collectionData;

  const now = Date.now();
  return EVENTS.reduce((result, event) => {
    const previous = collectionData[event.id] || {};
    result[event.id] = {
      ...previous,
      discovered: true,
      firstDiscoveredAt: previous.firstDiscoveredAt || now,
      lastDiscoveredAt: previous.lastDiscoveredAt || now,
      count: Math.max(1, previous.count || 0)
    };

    const contentItems = getEventContentItems(event.id);
    if (contentItems.length) {
      result[event.id].subItems = contentItems.reduce((subItems, item) => {
        const previousSubItem = previous.subItems?.[item.id] || {};
        subItems[item.id] = {
          ...previousSubItem,
          discovered: true,
          firstDiscoveredAt: previousSubItem.firstDiscoveredAt || now,
          lastDiscoveredAt: previousSubItem.lastDiscoveredAt || now,
          count: Math.max(1, previousSubItem.count || 0),
          lastAssetId: previousSubItem.lastAssetId || item.assets[0]?.id || null
        };
        return subItems;
      }, {});
    }

    return result;
  }, {});
}

function renderCategoryStats(stats) {
  elements.categoryStats.textContent = "";
  stats.forEach((stat) => {
    const row = document.createElement("div");
    row.className = "category-stat";
    row.innerHTML = `<span>${stat.category}</span><strong>${stat.discovered} / ${stat.total}</strong>`;
    elements.categoryStats.append(row);
  });

  if (shouldShowDebugTools()) {
    renderDebugPanel();
  }
}

function renderDebugPanel() {
  elements.categoryStats.querySelector(".debug-panel")?.remove();

  const panel = document.createElement("div");
  panel.className = "debug-panel";
  panel.innerHTML = `
    <h3>개발자 테스트</h3>
    <button class="debug-button" type="button" data-debug-action="unlock">모든 현상 해금 저장</button>
    <button class="debug-button" type="button" data-debug-action="reset">도감 초기화</button>
    <button class="debug-button" type="button" data-debug-action="cooldown">쿨타임 초기화</button>
  `;
  elements.categoryStats.append(panel);
}

function createContentItemList(event, entry) {
  const content = getEventContent(event.id);
  if (!content?.items.length) return null;

  const discoveredCount = content.items.filter(
    (item) => entry?.subItems?.[item.id]?.discovered
  ).length;
  const container = document.createElement("div");
  container.className = "content-item-list";
  container.setAttribute("aria-label", `${event.name} 하위 항목`);

  const heading = document.createElement("div");
  heading.className = "content-item-heading";
  heading.innerHTML = `<strong>하위 항목</strong><span>${discoveredCount} / ${content.items.length}</span>`;
  container.append(heading);

  content.items.forEach((item) => {
    const subItemEntry = entry?.subItems?.[item.id];
    const isDiscovered = Boolean(subItemEntry?.discovered);
    const asset = item.assets.find((candidate) => candidate.id === subItemEntry?.lastAssetId)
      || item.assets[0];
    const row = document.createElement("div");
    row.className = `content-item${isDiscovered ? "" : " locked"}`;

    const preview = document.createElement("div");
    preview.className = `content-item-preview content-item-preview-${content.kind}`;
    if (isDiscovered && asset) {
      const image = document.createElement("img");
      image.src = chrome.runtime.getURL(asset.path);
      image.alt = asset.alt;
      preview.append(image);
    } else {
      const placeholder = document.createElement("span");
      placeholder.textContent = "?";
      placeholder.setAttribute("aria-hidden", "true");
      preview.append(placeholder);
    }

    const detail = document.createElement("div");
    detail.className = "content-item-detail";
    const name = document.createElement("strong");
    const count = document.createElement("span");
    const itemProbability = event.probability / content.items.length;
    name.textContent = isDiscovered ? item.name : "미발견 항목";
    count.textContent = isDiscovered
      ? `${formatProbabilityLabel(itemProbability)} · ${subItemEntry.count || 0}회 발견`
      : `${formatProbabilityLabel(itemProbability)} · 아직 미발견`;
    detail.append(name, count);

    const replayButton = document.createElement("button");
    replayButton.className = "content-replay-button";
    replayButton.type = "button";
    replayButton.dataset.eventId = event.id;
    replayButton.dataset.contentItemId = item.id;
    replayButton.disabled = !isDiscovered;
    replayButton.textContent = "다시 보기";
    replayButton.setAttribute("aria-label", `${isDiscovered ? item.name : "미발견 항목"} 다시 보기`);

    row.append(preview, detail, replayButton);
    container.append(row);
  });

  return container;
}

function createEventCard(event) {
  const entry = collection[event.id];
  const isDiscovered = Boolean(entry?.discovered);
  const card = document.createElement("article");
  card.className = `event-card${isDiscovered ? "" : " locked"}`;

  const title = isDiscovered ? event.fullName : "???";
  const name = isDiscovered ? event.name : "아직 만나지 못한 장면입니다.";
  const description = isDiscovered
    ? event.description
    : "다음 한 장에서 만날 수 있어요.";

  card.innerHTML = `
    <div class="card-top">
      <div>
        <h3>${title}</h3>
        <p class="meta">${event.category} · ${name}</p>
      </div>
      <span class="rarity">${event.rarity}</span>
    </div>
    <p class="description">${description}</p>
    <dl class="detail-list">
      <div><dt>등장 확률</dt><dd>${event.probabilityLabel}</dd></div>
      <div><dt>최초 발견</dt><dd>${formatTimestamp(entry?.firstDiscoveredAt)}</dd></div>
      <div><dt>마지막 발견</dt><dd>${formatTimestamp(entry?.lastDiscoveredAt)}</dd></div>
      <div><dt>발견 횟수</dt><dd>${entry?.count || 0}</dd></div>
    </dl>
  `;

  const contentItemList = createContentItemList(event, entry);
  if (contentItemList) {
    card.append(contentItemList);
    return card;
  }

  const replayButton = document.createElement("button");
  replayButton.className = "replay-button";
  replayButton.type = "button";
  replayButton.dataset.eventId = event.id;
  replayButton.disabled = !isDiscovered;
  replayButton.textContent = isDiscovered ? "한 번 더 보기" : "아직 미발견";
  card.append(replayButton);

  return card;
}

function renderEvents(stats) {
  elements.eventSections.textContent = "";

  stats.forEach((stat) => {
    const section = document.createElement("section");
    section.className = "category-section";
    section.innerHTML = `
      <div class="category-heading">
        <h2>${stat.category}</h2>
        <span>${stat.discovered} / ${stat.total}</span>
      </div>
    `;

    const grid = document.createElement("div");
    grid.className = "event-grid";
    stat.events.forEach((event) => grid.append(createEventCard(event)));
    section.append(grid);
    elements.eventSections.append(section);
  });
}

async function replayEvent(eventId, contentItemId = null) {
  const event = getEventById(eventId);
  const entry = collection[eventId];

  if (!event) {
    setStatus("이 장면을 찾지 못했어요.", "error");
    return;
  }

  if (!entry?.discovered) {
    setStatus("아직 만나지 못한 장면이에요.");
    return;
  }

  const subItemEntry = contentItemId ? entry.subItems?.[contentItemId] : null;
  if (contentItemId && !subItemEntry?.discovered) {
    setStatus("아직 만나지 못한 하위 항목이에요.");
    return;
  }

  const targetTabId = event.target === "page" ? await resolveReplayTargetTabId() : null;

  if (event.target === "page" && !targetTabId) {
    setStatus("장면을 보여줄 일반 웹페이지 탭을 찾지 못했어요.", "error");
    return;
  }

  setStatus(`${event.fullName} 장면을 다시 펼치는 중...`, "loading");
  const result = await executeEventById(eventId, {
    targetTabId,
    focusTargetTab: event.target === "page" && Boolean(targetTabId),
    contentItemId,
    contentAssetId: subItemEntry?.lastAssetId || null
  });
  setStatus(
    result.ok
      ? event.target === "page"
        ? "원래 웹 탭에서 장면을 다시 보여드렸어요."
        : "새 탭에서 장면을 다시 열었어요."
      : result.userMessage,
    result.ok ? "success" : "error"
  );
}

async function refresh() {
  try {
    const [progress, collectionData] = await Promise.all([
      getProgress(),
      getCollectionData()
    ]);

    collection = createDevUnlockedCollection(collectionData);
    const discoveredCount = EVENTS.filter((event) => collection[event.id]?.discovered).length;
    elements.totalProgress.textContent = `${discoveredCount} / ${progress.totalCount}`;
    const stats = getCategoryStats(collection);
    renderCategoryStats(stats);
    renderEvents(stats);
  } catch (error) {
    console.error("collection refresh failed", error);
    setStatus("도감을 불러오는 중 잠시 문제가 생겼어요.", "error");
  }
}

function bindEvents() {
  elements.eventSections.addEventListener("click", (event) => {
    const button = event.target.closest(".replay-button, .content-replay-button");
    if (!button) return;
    replayEvent(button.dataset.eventId, button.dataset.contentItemId || null);
  });

  elements.categoryStats.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-debug-action]");
    if (!button) return;

    try {
      const action = button.dataset.debugAction;

      if (action === "unlock") {
        await unlockAllEventsForDebug();
      setStatus("모든 장면을 도감에서 볼 수 있게 했어요.", "success");
      }

      if (action === "reset") {
        await resetCollectionForDebug();
      setStatus("도감을 비우고 새 기록을 기다리고 있어요.", "success");
      }

      if (action === "cooldown") {
        await clearCooldownForDebug();
      setStatus("다음 한 장을 바로 열 수 있어요.", "success");
      }

      await refresh();
    } catch (error) {
      console.error("debug action failed", error);
      setStatus("개발자 동작 중 잠시 문제가 생겼어요.", "error");
    }
  });
}

function init() {
  void initTheme();
  document.title = `${APP_NAME} 도감`;
  elements.title.textContent = `${APP_NAME} 도감`;
  bindEvents();

  if (shouldShowDebugTools()) {
    renderDebugPanel();
  }

  refresh();

  if (replayTargetTabId) {
    setStatus("한 번 더 보기를 누르면 도감을 열었던 웹 탭에서 장면을 보여드려요.");
  } else {
    setStatus("웹페이지에서 확장 아이콘으로 도감을 열면 장면을 한 번 더 보기 좋아요.");
  }
}

init();

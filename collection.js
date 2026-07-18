import {
  APP_NAME,
  DEV_SHOW_DEBUG_TOOLS,
  DEV_UNLOCK_ALL_EVENTS,
  EVENTS,
  formatProbabilityLabel
} from "./src/constants.js";
import {
  getContentItemProbability,
  getEventContent,
  getEventContentItems
} from "./src/content.js";
import {
  CONTENT_PREFERENCE_CHANGE_EVENT,
  initContentPreference
} from "./src/content-preference.js";
import { executeEventById } from "./src/effects.js";
import { initTheme } from "./src/theme.js";
import {
  clearCooldownForDebug,
  getContentNoRepeatPreferences,
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
let contentNoRepeatPreferences = {};
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

  const noRepeatEnabled = contentNoRepeatPreferences[event.id] !== false;
  const discoveredCount = content.items.filter(
    (item) => entry?.subItems?.[item.id]?.discovered
  ).length;
  const container = document.createElement("div");
  container.className = "content-item-list";
  container.setAttribute("aria-label", `${event.name} 종류`);

  const heading = document.createElement("div");
  heading.className = "content-item-heading";
  const headingLabel = document.createElement("div");
  headingLabel.className = "content-item-heading-label";
  headingLabel.innerHTML = `<strong>종류</strong><span>${discoveredCount} / ${content.items.length}</span>`;

  const preference = document.createElement("label");
  preference.className = "theme-toggle content-item-preference";
  const preferenceText = document.createElement("span");
  preferenceText.textContent = "안 나온 거 먼저!";
  const preferenceInput = document.createElement("input");
  preferenceInput.type = "checkbox";
  preferenceInput.setAttribute("role", "switch");
  preferenceInput.dataset.contentNoRepeatToggle = "";
  preferenceInput.dataset.eventId = event.id;
  preferenceInput.checked = noRepeatEnabled;
  preferenceInput.setAttribute(
    "aria-label",
    noRepeatEnabled ? "안 나온 거 먼저 끄기" : "안 나온 거 먼저 켜기"
  );
  const preferenceControl = document.createElement("span");
  preferenceControl.className = "theme-toggle-control";
  preferenceControl.setAttribute("aria-hidden", "true");
  preference.append(preferenceText, preferenceInput, preferenceControl);
  heading.append(headingLabel, preference);
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
      placeholder.className = "content-item-placeholder";
      placeholder.textContent = "?";
      placeholder.setAttribute("aria-hidden", "true");
      preview.append(placeholder);
    }

    const detail = document.createElement("div");
    detail.className = "content-item-detail";
    const name = document.createElement("strong");
    const count = document.createElement("span");
    const itemProbability = getContentItemProbability(
      event.id,
      item.id,
      event.probability,
      entry?.subItems,
      noRepeatEnabled
    );
    name.textContent = isDiscovered ? item.name : "아직 미발견";
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
    replayButton.setAttribute("aria-label", `${isDiscovered ? item.name : "아직 미발견"} 다시 보기`);

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

  const title = isDiscovered ? event.fullName : "미발견";
  const name = isDiscovered ? event.name : "아직 나오지 않았습니다.";
  const description = isDiscovered
    ? event.description
    : "다음에 나올 수도 있습니다.";

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
  replayButton.textContent = isDiscovered ? "다시 보기" : "아직 미발견";
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
    setStatus("결과를 찾지 못했습니다.", "error");
    return;
  }

  if (!entry?.discovered) {
    setStatus("아직 발견하지 않은 결과입니다.");
    return;
  }

  const subItemEntry = contentItemId ? entry.subItems?.[contentItemId] : null;
  if (contentItemId && !subItemEntry?.discovered) {
    setStatus("아직 발견하지 않은 종류입니다.");
    return;
  }

  const targetTabId = event.target === "page" ? await resolveReplayTargetTabId() : null;

  if (event.target === "page" && !targetTabId) {
    setStatus("실행할 웹페이지 탭을 찾지 못했습니다.", "error");
    return;
  }

  setStatus(`${event.fullName} 다시 여는 중...`, "loading");
  const result = await executeEventById(eventId, {
    targetTabId,
    focusTargetTab: event.target === "page" && Boolean(targetTabId),
    contentItemId,
    contentAssetId: subItemEntry?.lastAssetId || null
  });
  setStatus(
    result.ok ? "다시 실행했습니다." : result.userMessage,
    result.ok ? "success" : "error"
  );
}

async function refresh() {
  try {
    const [progress, collectionData, noRepeatPreferences] = await Promise.all([
      getProgress(),
      getCollectionData(),
      getContentNoRepeatPreferences()
    ]);

    contentNoRepeatPreferences = noRepeatPreferences;
    collection = createDevUnlockedCollection(collectionData);
    const discoveredCount = EVENTS.filter((event) => collection[event.id]?.discovered).length;
    elements.totalProgress.textContent = `${discoveredCount} / ${progress.totalCount}`;
    const stats = getCategoryStats(collection);
    renderCategoryStats(stats);
    renderEvents(stats);
  } catch (error) {
    console.error("collection refresh failed", error);
    setStatus("도감을 불러오지 못했습니다.", "error");
  }
}

function bindEvents() {
  window.addEventListener(CONTENT_PREFERENCE_CHANGE_EVENT, (event) => {
    contentNoRepeatPreferences = event.detail.preferences;
    if (Object.keys(collection).length) {
      renderEvents(getCategoryStats(collection));
    }
  });

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
      setStatus("모든 결과를 도감에 표시했습니다.", "success");
      }

      if (action === "reset") {
        await resetCollectionForDebug();
      setStatus("도감 기록을 초기화했습니다.", "success");
      }

      if (action === "cooldown") {
        await clearCooldownForDebug();
      setStatus("지금 다시 열 수 있습니다.", "success");
      }

      await refresh();
    } catch (error) {
      console.error("debug action failed", error);
      setStatus("개발자 기능을 실행하지 못했습니다.", "error");
    }
  });
}

function init() {
  void initTheme();
  void initContentPreference();
  document.title = `${APP_NAME} 도감`;
  elements.title.textContent = `${APP_NAME} 도감`;
  bindEvents();

  if (shouldShowDebugTools()) {
    renderDebugPanel();
  }

  refresh();

  setStatus("다시 보기를 누르면 백그라운드 탭에서 실행됩니다.");
}

init();

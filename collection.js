import {
  APP_NAME,
  DEV_SHOW_DEBUG_TOOLS,
  DEV_UNLOCK_ALL_EVENTS,
  EVENTS
} from "./src/constants.js";
import { executeEventById } from "./src/effects.js";
import {
  clearCooldownForDebug,
  getCollectionData,
  getProgress,
  resetCollectionForDebug,
  unlockAllEventsForDebug
} from "./src/storage.js";
import { formatTimestamp, getCategoryStats, getEventById } from "./src/utils.js";

const elements = {
  title: document.querySelector("#collectionTitle"),
  totalProgress: document.querySelector("#totalProgress"),
  categoryStats: document.querySelector("#categoryStats"),
  eventSections: document.querySelector("#eventSections"),
  statusText: document.querySelector("#statusText")
};

let collection = {};
const pageParams = new URLSearchParams(location.search);
const replayTargetTabId = Number(pageParams.get("targetTabId")) || null;

function setStatus(message) {
  elements.statusText.textContent = message;
}

function shouldShowDebugTools() {
  return DEV_SHOW_DEBUG_TOOLS || pageParams.get("debug") === "1";
}

function createDevUnlockedCollection(collectionData) {
  if (!DEV_UNLOCK_ALL_EVENTS) return collectionData;

  const now = Date.now();
  return EVENTS.reduce((result, event) => {
    result[event.id] = {
      discovered: true,
      firstDiscoveredAt: collectionData[event.id]?.firstDiscoveredAt || now,
      lastDiscoveredAt: collectionData[event.id]?.lastDiscoveredAt || now,
      count: Math.max(1, collectionData[event.id]?.count || 0)
    };
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

function createEventCard(event) {
  const entry = collection[event.id];
  const isDiscovered = Boolean(entry?.discovered);
  const card = document.createElement("article");
  card.className = `event-card${isDiscovered ? "" : " locked"}`;

  const title = isDiscovered ? event.fullName : "???";
  const name = isDiscovered ? event.name : "아직 발견하지 못한 현상입니다.";
  const description = isDiscovered
    ? event.description
    : "버튼이 아직 이 현상을 허락하지 않았습니다.";

  card.innerHTML = `
    <div class="card-top">
      <div>
        <h3>${title}</h3>
        <p class="meta">${event.category} · ${name}</p>
      </div>
      <span class="rarity">${event.rarity}</span>
    </div>
    <p class="description">${description}</p>
    <div class="detail-list">
      <div><span>등장 확률</span><strong>${event.probabilityLabel}</strong></div>
      <div><span>최초 발견</span><strong>${formatTimestamp(entry?.firstDiscoveredAt)}</strong></div>
      <div><span>마지막 발견</span><strong>${formatTimestamp(entry?.lastDiscoveredAt)}</strong></div>
      <div><span>발견 횟수</span><strong>${entry?.count || 0}</strong></div>
    </div>
  `;

  const replayButton = document.createElement("button");
  replayButton.className = "replay-button";
  replayButton.type = "button";
  replayButton.dataset.eventId = event.id;
  replayButton.disabled = !isDiscovered;
  replayButton.textContent = isDiscovered ? "다시 재생" : "잠금";
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

async function replayEvent(eventId) {
  const event = getEventById(eventId);
  const entry = collection[eventId];

  if (!event) {
    setStatus("이벤트를 찾을 수 없습니다.");
    return;
  }

  if (!entry?.discovered) {
    setStatus("아직 발견하지 못한 이벤트입니다.");
    return;
  }

  setStatus(`${event.fullName} 재생 중...`);
  const result = await executeEventById(eventId, {
    targetTabId: event.target === "page" ? replayTargetTabId : null,
    focusTargetTab: event.target === "page" && Boolean(replayTargetTabId)
  });
  setStatus(result.ok ? "원래 웹 탭으로 이동해서 재생했습니다." : result.userMessage);
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
    setStatus("도감을 불러오는 중 오류가 발생했습니다.");
  }
}

function bindEvents() {
  elements.eventSections.addEventListener("click", (event) => {
    const button = event.target.closest(".replay-button");
    if (!button) return;
    replayEvent(button.dataset.eventId);
  });

  elements.categoryStats.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-debug-action]");
    if (!button) return;

    try {
      const action = button.dataset.debugAction;

      if (action === "unlock") {
        await unlockAllEventsForDebug();
        setStatus("모든 현상을 저장소에 해금했습니다.");
      }

      if (action === "reset") {
        await resetCollectionForDebug();
        setStatus("도감을 초기화했습니다.");
      }

      if (action === "cooldown") {
        await clearCooldownForDebug();
        setStatus("쿨타임을 초기화했습니다.");
      }

      await refresh();
    } catch (error) {
      console.error("debug action failed", error);
      setStatus("디버그 동작 중 오류가 발생했습니다.");
    }
  });
}

function init() {
  document.title = `${APP_NAME} 도감`;
  elements.title.textContent = `${APP_NAME} 도감`;
  bindEvents();
  refresh();

  if (replayTargetTabId) {
    setStatus("다시 재생을 누르면 도감을 열었던 웹 탭으로 이동해서 보여줍니다.");
  } else {
    setStatus("웹페이지에서 확장 아이콘으로 도감을 열면 페이지 효과 재생이 안정적입니다.");
  }
}

init();

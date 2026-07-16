import {
  APP_DESCRIPTION,
  APP_NAME,
  COOLDOWN_ALARM_NAME,
  COOLDOWN_MS,
  EVENTS
} from "./src/constants.js";
import { getEventContentItem } from "./src/content.js";
import { initContentPreference } from "./src/content-preference.js";
import { executeEvent } from "./src/effects.js";
import { initTheme } from "./src/theme.js";
import {
  getCategoryStats,
  getEventById,
  formatDuration,
  formatTimestamp,
  isScriptableUrl,
  pickWeightedEvent
} from "./src/utils.js";
import {
  getCooldownData,
  selectContentForDraw,
  getLastResult,
  getProgress,
  setCooldown,
  setLastResult,
  updateEventDiscovery
} from "./src/storage.js";

const elements = {
  appName: document.querySelector("#appName"),
  appDescription: document.querySelector("#appDescription"),
  mainButton: document.querySelector("#mainButton"),
  cooldownText: document.querySelector("#cooldownText"),
  statusText: document.querySelector("#statusText"),
  progressText: document.querySelector("#progressText"),
  progressFill: document.querySelector("#progressFill"),
  categoryProgress: document.querySelector("#categoryProgress"),
  lastResultText: document.querySelector("#lastResultText"),
  openCollectionButton: document.querySelector("#openCollectionButton")
};

let cooldownTimer = null;

function setStatus(message, state = "info") {
  elements.statusText.textContent = message;
  elements.statusText.dataset.state = message ? state : "idle";
}

async function scheduleCooldownAlarm(nextAvailableAt) {
  try {
    await chrome.alarms.create(COOLDOWN_ALARM_NAME, { when: nextAvailableAt });
  } catch (error) {
    console.error("alarm registration failed", error);
  }
}

function renderCooldown(nextAvailableAt) {
  const remainingMs = nextAvailableAt - Date.now();
  const isCoolingDown = remainingMs > 0;

  elements.mainButton.disabled = isCoolingDown;
  elements.mainButton.textContent = isCoolingDown ? "준비 중" : "열어보기";
  elements.cooldownText.textContent = isCoolingDown
    ? `다시 열기까지 ${formatDuration(remainingMs)}`
    : "지금 열 수 있어요";

  if (cooldownTimer) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }

  if (isCoolingDown) {
    cooldownTimer = setInterval(() => renderCooldown(nextAvailableAt), 1000);
  }
}

function renderProgress(progress) {
  const percent = Math.round((progress.discoveredCount / progress.totalCount) * 100);
  elements.progressText.textContent = `${progress.discoveredCount} / ${progress.totalCount} 발견`;
  elements.progressFill.style.width = `${percent}%`;
  const progressTrack = elements.progressFill.parentElement;
  progressTrack.setAttribute("aria-valuemax", String(progress.totalCount));
  progressTrack.setAttribute("aria-valuenow", String(progress.discoveredCount));

  const stats = getCategoryStats(progress.collection);
  elements.categoryProgress.textContent = "";
  stats.forEach((stat) => {
    const chip = document.createElement("span");
    chip.className = "category-chip";
    chip.textContent = `${stat.category} ${stat.discovered}/${stat.total}`;
    elements.categoryProgress.append(chip);
  });
}

function renderLastResult(result) {
  if (!result) {
    elements.lastResultText.textContent = "아직 나온 결과가 없습니다.";
    elements.lastResultText.dataset.state = "empty";
    return;
  }

  const event = getEventById(result.eventId);
  if (!event) {
    elements.lastResultText.textContent = "저장된 결과를 찾지 못했습니다.";
    elements.lastResultText.dataset.state = "error";
    return;
  }

  const contentItem = getEventContentItem(result.eventId, result.contentItemId);
  elements.lastResultText.dataset.state = "result";
  elements.lastResultText.innerHTML = `
    <strong>${result.isNewDiscovery ? "처음 나왔어요." : "전에 나온 결과예요."}</strong>
    [${event.rarity}] ${event.fullName}${contentItem ? ` · ${contentItem.name}` : ""}<br>
    <span>${formatTimestamp(result.triggeredAt)}</span>
  `;
}

async function refresh() {
  try {
    const [cooldown, progress, lastResult] = await Promise.all([
      getCooldownData(),
      getProgress(),
      getLastResult()
    ]);

    renderCooldown(cooldown.nextAvailableAt);
    renderProgress(progress);
    renderLastResult(lastResult);
  } catch (error) {
    console.error("popup refresh failed", error);
    setStatus("기록을 불러오지 못했습니다.", "error");
  }
}

async function handleMainButtonClick() {
  setStatus("여는 중...", "loading");

  try {
    const cooldown = await getCooldownData();
    if (cooldown.nextAvailableAt > Date.now()) {
      renderCooldown(cooldown.nextAvailableAt);
      setStatus("아직 준비 중이에요.");
      return;
    }

    const event = pickWeightedEvent(EVENTS);
    const contentSelection = await selectContentForDraw(event.id);
    const execution = await executeEvent(event, {
      contentItemId: contentSelection?.itemId,
      contentAssetId: contentSelection?.assetId
    });

    if (!execution.ok) {
      setStatus(execution.userMessage, "error");
      return;
    }

    const discovery = await updateEventDiscovery(event.id, execution.contentSelection);
    const triggeredAt = Date.now();
    const nextAvailableAt = triggeredAt + COOLDOWN_MS;

    await setLastResult({
      eventId: event.id,
      contentItemId: execution.contentSelection?.itemId || null,
      contentAssetId: execution.contentSelection?.assetId || null,
      isNewDiscovery: discovery.isNewDiscovery || discovery.isNewSubItemDiscovery,
      triggeredAt
    });
    await setCooldown(nextAvailableAt);
    await scheduleCooldownAlarm(nextAvailableAt);

    setStatus("도감에 새로 기록했어요.", "success");
    await refresh();
  } catch (error) {
    console.error("main button failed", error);
    setStatus("열지 못했습니다. 다시 시도해 주세요.", "error");
  }
}

async function openCollection() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const collectionUrl = new URL(chrome.runtime.getURL("collection.html"));

    if (activeTab?.id && isScriptableUrl(activeTab.url)) {
      collectionUrl.searchParams.set("targetTabId", String(activeTab.id));
    }

    chrome.tabs.create({
      url: collectionUrl.toString()
    });
  } catch (error) {
    console.error("open collection failed", error);
    chrome.tabs.create({
      url: chrome.runtime.getURL("collection.html")
    });
  }
}

function init() {
  void initTheme();
  void initContentPreference();
  document.title = APP_NAME;
  elements.appName.textContent = APP_NAME;
  elements.appDescription.textContent = APP_DESCRIPTION;
  elements.mainButton.addEventListener("click", handleMainButtonClick);
  elements.openCollectionButton.addEventListener("click", openCollection);
  refresh();
}

init();

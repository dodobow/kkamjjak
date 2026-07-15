import {
  APP_DESCRIPTION,
  APP_NAME,
  COOLDOWN_ALARM_NAME,
  COOLDOWN_MS,
  EVENTS
} from "./src/constants.js";
import { getEventContentItem } from "./src/content.js";
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
  elements.mainButton.textContent = isCoolingDown ? "다음 한 장 준비 중" : "오늘의 한 장 열기";
  elements.cooldownText.textContent = isCoolingDown
    ? `다음 한 장까지 ${formatDuration(remainingMs)}`
    : "새로운 한 장을 열 수 있어요";

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
    elements.lastResultText.textContent = "아직 열어 본 장면이 없어요.";
    elements.lastResultText.dataset.state = "empty";
    return;
  }

  const event = getEventById(result.eventId);
  if (!event) {
    elements.lastResultText.textContent = "기록은 남아 있지만 장면을 찾지 못했어요.";
    elements.lastResultText.dataset.state = "error";
    return;
  }

  const contentItem = getEventContentItem(result.eventId, result.contentItemId);
  elements.lastResultText.dataset.state = "result";
  elements.lastResultText.innerHTML = `
    <strong>${result.isNewDiscovery ? "새로운 장면 발견!" : "이미 만난 장면이에요."}</strong>
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
    setStatus("기록을 읽는 중 잠시 문제가 생겼어요.", "error");
  }
}

async function handleMainButtonClick() {
  setStatus("오늘의 한 장을 고르는 중...", "loading");

  try {
    const cooldown = await getCooldownData();
    if (cooldown.nextAvailableAt > Date.now()) {
      renderCooldown(cooldown.nextAvailableAt);
      setStatus("다음 한 장을 준비하고 있어요.");
      return;
    }

    const event = pickWeightedEvent(EVENTS);
    const execution = await executeEvent(event);

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

    setStatus("새 장면을 도감에 담았어요.", "success");
    await refresh();
  } catch (error) {
    console.error("main button failed", error);
    setStatus("잠시 문제가 생겼어요. 다시 한 장을 열어 주세요.", "error");
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
  document.title = APP_NAME;
  elements.appName.textContent = APP_NAME;
  elements.appDescription.textContent = APP_DESCRIPTION;
  elements.mainButton.addEventListener("click", handleMainButtonClick);
  elements.openCollectionButton.addEventListener("click", openCollection);
  refresh();
}

init();

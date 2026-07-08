import {
  APP_DESCRIPTION,
  APP_NAME,
  COOLDOWN_ALARM_NAME,
  COOLDOWN_MS,
  EVENTS
} from "./src/constants.js";
import { executeEvent } from "./src/effects.js";
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

function setStatus(message) {
  elements.statusText.textContent = message;
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
  elements.mainButton.textContent = isCoolingDown ? "봉인됨" : "누르지 마시오";
  elements.cooldownText.textContent = isCoolingDown
    ? `남은 시간 ${formatDuration(remainingMs)}`
    : "버튼 사용 가능";

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
    elements.lastResultText.textContent = "아직 버튼의 죄가 기록되지 않았습니다.";
    return;
  }

  const event = getEventById(result.eventId);
  if (!event) {
    elements.lastResultText.textContent = "기록은 있는데 이벤트가 사라졌습니다.";
    return;
  }

  elements.lastResultText.innerHTML = `
    <strong>${result.isNewDiscovery ? "신규 발견!" : "이미 발견한 현상입니다."}</strong>
    [${event.rarity}] ${event.fullName}<br>
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
    setStatus("저장소를 읽는 중 오류가 발생했습니다.");
  }
}

async function handleMainButtonClick() {
  setStatus("운명을 굴리는 중...");

  try {
    const cooldown = await getCooldownData();
    if (cooldown.nextAvailableAt > Date.now()) {
      renderCooldown(cooldown.nextAvailableAt);
      setStatus("아직 봉인이 풀리지 않았습니다.");
      return;
    }

    const event = pickWeightedEvent(EVENTS);
    const execution = await executeEvent(event);

    if (!execution.ok) {
      setStatus(execution.userMessage);
      return;
    }

    const discovery = await updateEventDiscovery(event.id);
    const triggeredAt = Date.now();
    const nextAvailableAt = triggeredAt + COOLDOWN_MS;

    await setLastResult({
      eventId: event.id,
      isNewDiscovery: discovery.isNewDiscovery,
      triggeredAt
    });
    await setCooldown(nextAvailableAt);
    await scheduleCooldownAlarm(nextAvailableAt);

    setStatus("쿨타임 활성화!");
    await refresh();
  } catch (error) {
    console.error("main button failed", error);
    setStatus("오류가 발생했습니다. 다시 시도해 주세요.");
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
  document.title = APP_NAME;
  elements.appName.textContent = APP_NAME;
  elements.appDescription.textContent = APP_DESCRIPTION;
  elements.mainButton.addEventListener("click", handleMainButtonClick);
  elements.openCollectionButton.addEventListener("click", openCollection);
  refresh();
}

init();

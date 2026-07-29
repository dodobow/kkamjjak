import {
  APP_NAME,
  COOLDOWN_ALARM_NAME,
  NOTIFICATION_MESSAGE,
  NOTIFICATION_TITLE,
  STORAGE_KEYS
} from "./constants.js";
import { getActionState } from "./action-state.js";
import { getCooldownData } from "./storage.js";

function logRuntimeError(action) {
  const error = chrome.runtime.lastError;
  if (error) {
    console.error(`${action} failed: ${error.message}`);
  }
}

function applyActionState(nextAvailableAt) {
  const state = getActionState(nextAvailableAt);

  const iconUrl = chrome.runtime.getURL(state.iconPath);

  chrome.action.setIcon({ path: iconUrl }, () => {
    logRuntimeError("action icon update");
  });
  chrome.action.setTitle({ title: state.title }, () => {
    logRuntimeError("action title update");
  });
}

async function syncActionState(nextAvailableAt) {
  try {
    const cooldownEnd = Number.isFinite(nextAvailableAt)
      ? nextAvailableAt
      : (await getCooldownData()).nextAvailableAt;
    applyActionState(cooldownEnd);
  } catch (error) {
    console.error("action state sync failed", error);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== COOLDOWN_ALARM_NAME) return;

  applyActionState(0);

  const notificationIconUrl = chrome.runtime.getURL("assets/icons/icon128.png");

  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: notificationIconUrl,
      title: NOTIFICATION_TITLE,
      message: NOTIFICATION_MESSAGE,
      priority: 1
    },
    () => {
      logRuntimeError("cooldown notification");
    }
  );
});

chrome.runtime.onInstalled.addListener(() => {
  console.info(`${APP_NAME} extension installed.`);
  void syncActionState();
});

chrome.runtime.onStartup.addListener(() => {
  void syncActionState();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STORAGE_KEYS.cooldown]) return;

  const nextAvailableAt = changes[STORAGE_KEYS.cooldown].newValue?.nextAvailableAt;
  void syncActionState(nextAvailableAt);
});

void syncActionState();

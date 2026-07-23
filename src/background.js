import {
  APP_NAME,
  COOLDOWN_ALARM_NAME,
  NOTIFICATION_MESSAGE,
  NOTIFICATION_TITLE
} from "./constants.js";

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== COOLDOWN_ALARM_NAME) return;

  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "assets/icons/icon128.png",
      title: NOTIFICATION_TITLE,
      message: NOTIFICATION_MESSAGE,
      priority: 1
    },
    () => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.error("cooldown notification failed", error);
      }
    }
  );
});

chrome.runtime.onInstalled.addListener(() => {
  console.info(`${APP_NAME} extension installed.`);
});

import { STORAGE_KEYS } from "./constants.js";
import {
  getContentNoRepeatPreferences,
  setContentNoRepeatEnabled
} from "./storage.js";

export const CONTENT_PREFERENCE_CHANGE_EVENT = "contentpreferencechange";

let currentPreferences = {};

function getPreferenceToggles() {
  return Array.from(document.querySelectorAll("[data-content-no-repeat-toggle]"));
}

function syncPreferenceToggles() {
  getPreferenceToggles().forEach((toggle) => {
    const eventId = toggle.dataset.eventId;
    const enabled = currentPreferences[eventId] !== false;
    toggle.checked = enabled;
    toggle.setAttribute(
      "aria-label",
      enabled ? "안 나온 거 먼저 끄기" : "안 나온 거 먼저 켜기"
    );
  });
}

function applyContentPreferences(preferences) {
  const nextPreferences = { ...preferences };
  const changed = JSON.stringify(currentPreferences) !== JSON.stringify(nextPreferences);
  currentPreferences = nextPreferences;
  syncPreferenceToggles();

  if (changed) {
    window.dispatchEvent(new CustomEvent(CONTENT_PREFERENCE_CHANGE_EVENT, {
      detail: { preferences: { ...currentPreferences } }
    }));
  }
}

function bindPreferenceToggles() {
  document.addEventListener("change", async (event) => {
    const toggle = event.target.closest?.("[data-content-no-repeat-toggle]");
    if (!toggle) return;

    const eventId = toggle.dataset.eventId;
    const previousPreferences = { ...currentPreferences };
    const nextPreferences = {
      ...currentPreferences,
      [eventId]: toggle.checked
    };
    applyContentPreferences(nextPreferences);

    try {
      await setContentNoRepeatEnabled(eventId, toggle.checked);
    } catch (error) {
      console.error("content preference update failed", error);
      applyContentPreferences(previousPreferences);
    }
  });
}

function bindStorageSync() {
  if (!globalThis.chrome?.storage?.onChanged) return;

  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEYS.contentNoRepeat]) return;
    applyContentPreferences(await getContentNoRepeatPreferences());
  });
}

export async function initContentPreference() {
  bindPreferenceToggles();
  bindStorageSync();

  if (!globalThis.chrome?.storage?.local) {
    applyContentPreferences({});
    return;
  }

  applyContentPreferences(await getContentNoRepeatPreferences());
}

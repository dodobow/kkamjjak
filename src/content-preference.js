import { STORAGE_KEYS } from "./constants.js";
import {
  getContentNoRepeatEnabled,
  setContentNoRepeatEnabled
} from "./storage.js";

export const CONTENT_PREFERENCE_CHANGE_EVENT = "contentpreferencechange";

let currentEnabled = null;

function getPreferenceToggles() {
  return Array.from(document.querySelectorAll("[data-content-no-repeat-toggle]"));
}

function applyContentPreference(enabled) {
  const nextEnabled = enabled !== false;
  const changed = currentEnabled !== nextEnabled;
  currentEnabled = nextEnabled;

  getPreferenceToggles().forEach((toggle) => {
    toggle.checked = nextEnabled;
    toggle.setAttribute(
      "aria-label",
      nextEnabled ? "안 나온 것 먼저 끄기" : "안 나온 것 먼저 켜기"
    );
  });

  if (changed) {
    window.dispatchEvent(new CustomEvent(CONTENT_PREFERENCE_CHANGE_EVENT, {
      detail: { enabled: nextEnabled }
    }));
  }
}

function bindPreferenceToggles() {
  getPreferenceToggles().forEach((toggle) => {
    toggle.addEventListener("change", async () => {
      const previousEnabled = currentEnabled;
      const nextEnabled = toggle.checked;
      applyContentPreference(nextEnabled);

      try {
        await setContentNoRepeatEnabled(nextEnabled);
      } catch (error) {
        console.error("content preference update failed", error);
        applyContentPreference(previousEnabled);
      }
    });
  });
}

function bindStorageSync() {
  if (!globalThis.chrome?.storage?.onChanged) return;

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEYS.contentNoRepeat]) return;
    applyContentPreference(changes[STORAGE_KEYS.contentNoRepeat].newValue);
  });
}

export async function initContentPreference() {
  bindPreferenceToggles();
  bindStorageSync();

  if (!globalThis.chrome?.storage?.local) {
    applyContentPreference(true);
    return;
  }

  applyContentPreference(await getContentNoRepeatEnabled());
}

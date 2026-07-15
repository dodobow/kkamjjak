import { STORAGE_KEYS } from "./constants.js";

const LOCAL_THEME_KEY = "dopamineButtonTheme";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

function normalizeTheme(value) {
  return value === DARK_THEME || value === LIGHT_THEME ? value : null;
}

function readThemeMirror() {
  try {
    return normalizeTheme(localStorage.getItem(LOCAL_THEME_KEY));
  } catch (error) {
    console.warn("theme mirror read failed", error);
    return null;
  }
}

function writeThemeMirror(theme) {
  try {
    localStorage.setItem(LOCAL_THEME_KEY, theme);
  } catch (error) {
    console.warn("theme mirror write failed", error);
  }
}

function getStoredTheme() {
  if (!globalThis.chrome?.storage?.local) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    chrome.storage.local.get({ [STORAGE_KEYS.theme]: null }, (items) => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.warn("theme storage read failed", error);
        resolve(null);
        return;
      }

      resolve(normalizeTheme(items[STORAGE_KEYS.theme]));
    });
  });
}

function setStoredTheme(theme) {
  if (!globalThis.chrome?.storage?.local) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.theme]: theme }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.warn("theme storage write failed", error);
      }
      resolve();
    });
  });
}

function getThemeToggles() {
  return Array.from(document.querySelectorAll("[data-theme-toggle]"));
}

function applyTheme(theme) {
  const nextTheme = normalizeTheme(theme) || LIGHT_THEME;
  const isDark = nextTheme === DARK_THEME;

  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  writeThemeMirror(nextTheme);

  getThemeToggles().forEach((toggle) => {
    toggle.checked = isDark;
    toggle.setAttribute(
      "aria-label",
      isDark ? "라이트 모드로 전환" : "다크 모드로 전환"
    );
  });
}

function bindThemeToggles() {
  getThemeToggles().forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const theme = toggle.checked ? DARK_THEME : LIGHT_THEME;
      applyTheme(theme);
      setStoredTheme(theme);
    });
  });
}

function bindStorageSync() {
  if (!globalThis.chrome?.storage?.onChanged) return;

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEYS.theme]) return;

    applyTheme(changes[STORAGE_KEYS.theme].newValue);
  });
}

export async function initTheme() {
  const initialTheme = readThemeMirror() || LIGHT_THEME;
  applyTheme(initialTheme);
  bindThemeToggles();
  bindStorageSync();

  const storedTheme = await getStoredTheme();
  if (storedTheme && storedTheme !== initialTheme) {
    applyTheme(storedTheme);
  }
}

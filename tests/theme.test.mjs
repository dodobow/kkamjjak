import assert from "node:assert/strict";

const localValues = new Map();
const storedValues = { theme: "dark" };
let toggleChangeHandler = null;
let storageChangeHandler = null;

const toggle = {
  checked: false,
  attributes: {},
  addEventListener(type, handler) {
    if (type === "change") toggleChangeHandler = handler;
  },
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
};

globalThis.document = {
  documentElement: {
    dataset: {},
    style: {}
  },
  querySelectorAll(selector) {
    return selector === "[data-theme-toggle]" ? [toggle] : [];
  }
};

globalThis.localStorage = {
  getItem(key) {
    return localValues.get(key) ?? null;
  },
  setItem(key, value) {
    localValues.set(key, value);
  }
};

globalThis.chrome = {
  runtime: { lastError: null },
  storage: {
    local: {
      get(defaults, callback) {
        callback({ ...defaults, ...storedValues });
      },
      set(items, callback) {
        Object.assign(storedValues, items);
        callback();
      }
    },
    onChanged: {
      addListener(handler) {
        storageChangeHandler = handler;
      }
    }
  }
};

const { initTheme } = await import("../src/theme.js");
await initTheme();

assert.equal(document.documentElement.dataset.theme, "dark");
assert.equal(document.documentElement.style.colorScheme, "dark");
assert.equal(toggle.checked, true);
assert.equal(toggle.attributes["aria-label"], "라이트 모드로 전환");
assert.equal(localValues.get("dopamineButtonTheme"), "dark");

toggle.checked = false;
toggleChangeHandler();

assert.equal(document.documentElement.dataset.theme, "light");
assert.equal(storedValues.theme, "light");
assert.equal(toggle.attributes["aria-label"], "다크 모드로 전환");

storageChangeHandler({ theme: { newValue: "dark" } }, "local");

assert.equal(document.documentElement.dataset.theme, "dark");
assert.equal(toggle.checked, true);

console.log("theme tests passed");

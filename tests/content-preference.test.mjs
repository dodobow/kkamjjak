import assert from "node:assert/strict";

const storedValues = {
  contentNoRepeat: false,
  contentDrawState: {
    sudden_cat: {
      remainingItemIds: ["dog"],
      lastItemId: "spinosaurus"
    }
  }
};
const changeHandlers = [];
const dispatchedEvents = [];
let storageChangeHandler = null;

function createToggle() {
  return {
    checked: false,
    attributes: {},
    addEventListener(type, handler) {
      if (type === "change") changeHandlers.push(handler);
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
}

const toggles = [createToggle(), createToggle()];

globalThis.CustomEvent = class {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
};

globalThis.window = {
  dispatchEvent(event) {
    dispatchedEvents.push(event);
  }
};

globalThis.document = {
  querySelectorAll(selector) {
    return selector === "[data-content-no-repeat-toggle]" ? toggles : [];
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

const { initContentPreference } = await import("../src/content-preference.js");
await initContentPreference();

toggles.forEach((toggle) => {
  assert.equal(toggle.checked, false);
  assert.equal(toggle.attributes["aria-label"], "안 나온 것 먼저 켜기");
});

toggles[0].checked = true;
await changeHandlers[0]();

assert.equal(storedValues.contentNoRepeat, true);
assert.deepEqual(storedValues.contentDrawState, {});
toggles.forEach((toggle) => {
  assert.equal(toggle.checked, true);
  assert.equal(toggle.attributes["aria-label"], "안 나온 것 먼저 끄기");
});

storageChangeHandler({ contentNoRepeat: { newValue: false } }, "local");
toggles.forEach((toggle) => assert.equal(toggle.checked, false));
assert.equal(dispatchedEvents.at(-1).detail.enabled, false);

console.log("content preference tests passed");

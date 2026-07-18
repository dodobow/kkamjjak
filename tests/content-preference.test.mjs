import assert from "node:assert/strict";

const storedValues = {
  contentNoRepeat: false,
  contentDrawState: {
    sudden_cat: {
      remainingItemIds: ["dog"],
      lastItemId: "spinosaurus"
    },
    tab_exile: {
      remainingItemIds: ["beach"],
      lastItemId: "forest"
    }
  }
};
const dispatchedEvents = [];
let documentChangeHandler = null;
let storageChangeHandler = null;

function createToggle(eventId) {
  return {
    checked: false,
    dataset: { eventId },
    attributes: {},
    closest(selector) {
      return selector === "[data-content-no-repeat-toggle]" ? this : null;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
}

const toggles = [createToggle("sudden_cat"), createToggle("tab_exile")];

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
  addEventListener(type, handler) {
    if (type === "change") documentChangeHandler = handler;
  },
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

assert.deepEqual(storedValues.contentNoRepeat, {
  sudden_cat: false,
  tab_exile: false
});
toggles.forEach((toggle) => {
  assert.equal(toggle.checked, false);
  assert.equal(toggle.attributes["aria-label"], "안 나온 거 먼저 켜기");
});

toggles[0].checked = true;
await documentChangeHandler({ target: toggles[0] });

assert.deepEqual(storedValues.contentNoRepeat, {
  sudden_cat: true,
  tab_exile: false
});
assert.deepEqual(storedValues.contentDrawState, {
  tab_exile: {
    remainingItemIds: ["beach"],
    lastItemId: "forest"
  }
});
assert.equal(toggles[0].checked, true);
assert.equal(toggles[1].checked, false);
assert.equal(toggles[0].attributes["aria-label"], "안 나온 거 먼저 끄기");

storedValues.contentNoRepeat = {
  sudden_cat: true,
  tab_exile: true
};
await storageChangeHandler({
  contentNoRepeat: { newValue: storedValues.contentNoRepeat }
}, "local");

toggles.forEach((toggle) => assert.equal(toggle.checked, true));
assert.deepEqual(dispatchedEvents.at(-1).detail.preferences, {
  sudden_cat: true,
  tab_exile: true
});

console.log("content preference tests passed");

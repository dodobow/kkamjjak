import assert from "node:assert/strict";

let injectedCall = null;

globalThis.chrome = {
  runtime: {
    getURL(path) {
      return `chrome-extension://test/${path}`;
    }
  },
  tabs: {
    async get(tabId) {
      return { id: tabId, windowId: 1, url: "https://example.com" };
    },
    async query() {
      return [{ id: 1, windowId: 1, url: "https://example.com" }];
    },
    async update() {},
    async create() {}
  },
  windows: {
    async update() {}
  },
  scripting: {
    async executeScript(call) {
      injectedCall = call;
      return [{ result: true }];
    }
  }
};

const originalRandom = Math.random;
Math.random = () => 0;

try {
  const { executeEventById } = await import("../src/effects.js");
  const result = await executeEventById("button_judgement", { targetTabId: 1 });

  assert.equal(result.ok, true);
  assert.equal(result.contentSelection, null);
  assert.equal(injectedCall.target.tabId, 1);
  assert.equal(injectedCall.args[0], "button_judgement");
  assert.equal(injectedCall.args[1].comboImage.eventId, "sudden_cat");
  assert.equal(injectedCall.args[1].comboImage.itemId, "dog");
  assert.equal(
    injectedCall.args[1].comboImage.assetUrl,
    "chrome-extension://test/assets/images/discoveries/dog/dog-01.png"
  );
} finally {
  Math.random = originalRandom;
}

console.log("effect execution tests passed");

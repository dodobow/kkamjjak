const storageData = structuredClone(globalThis.STORE_CAPTURE_DATA || {});

function getStoredItems(keys) {
  if (typeof keys === "string") {
    return { [keys]: storageData[keys] };
  }

  if (Array.isArray(keys)) {
    return keys.reduce((items, key) => {
      items[key] = storageData[key];
      return items;
    }, {});
  }

  if (keys && typeof keys === "object") {
    return Object.entries(keys).reduce((items, [key, fallback]) => {
      items[key] = storageData[key] ?? fallback;
      return items;
    }, {});
  }

  return { ...storageData };
}

globalThis.chrome = {
  runtime: {
    lastError: null,
    getURL(path) {
      return new URL(`/${path}`, location.origin).href;
    }
  },
  storage: {
    local: {
      get(keys, callback) {
        callback(getStoredItems(keys));
      },
      set(items, callback) {
        Object.assign(storageData, structuredClone(items));
        callback?.();
      }
    }
  },
  alarms: {
    async create() {}
  },
  tabs: {
    async get() {
      return null;
    },
    async query() {
      return [];
    },
    create() {}
  },
  windows: {
    async update() {}
  },
  scripting: {
    async executeScript() {
      return [];
    }
  }
};


const discoveredAt = new Date("2026-07-27T18:20:00+09:00").getTime();
const lastDiscoveredAt = new Date("2026-07-28T14:35:00+09:00").getTime();

function discoveredEntry(count = 1) {
  return {
    discovered: true,
    firstDiscoveredAt: discoveredAt,
    lastDiscoveredAt,
    count
  };
}

globalThis.STORE_CAPTURE_DATA = {
  collection: {
    spin_world: discoveredEntry(2),
    browser_quake: discoveredEntry(1),
    gray_world: discoveredEntry(1),
    sudden_cat: {
      ...discoveredEntry(4),
      subItems: {
        dog: {
          ...discoveredEntry(1),
          lastAssetId: "dog-01"
        },
        capybara: {
          ...discoveredEntry(1),
          lastAssetId: "capybara-01"
        },
        "red-panda": {
          ...discoveredEntry(2),
          lastAssetId: "red-panda-01"
        }
      }
    },
    giant_emoji: discoveredEntry(2),
    tab_exile: {
      ...discoveredEntry(2),
      subItems: {
        forest: {
          ...discoveredEntry(1),
          lastAssetId: "forest-01"
        },
        meadow: {
          ...discoveredEntry(1),
          lastAssetId: "meadow-01"
        }
      }
    },
    meaningless_oracle: discoveredEntry(1),
    button_mockery: discoveredEntry(1)
  },
  cooldown: {
    nextAvailableAt: 0
  },
  lastResult: {
    eventId: "sudden_cat",
    contentItemId: "red-panda",
    contentAssetId: "red-panda-01",
    isNewDiscovery: true,
    triggeredAt: lastDiscoveredAt
  },
  contentNoRepeat: {
    sudden_cat: true,
    tab_exile: true
  },
  contentDrawState: {},
  theme: "light"
};

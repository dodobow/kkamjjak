export const ACTION_ICON_PATHS = Object.freeze({
  ready: Object.freeze({
    16: "assets/icons/icon16.png",
    48: "assets/icons/icon48.png",
    128: "assets/icons/icon128.png"
  }),
  cooldown: Object.freeze({
    16: "assets/icons/icon-closed16.png",
    48: "assets/icons/icon-closed48.png",
    128: "assets/icons/icon-closed128.png"
  })
});

export const ACTION_TITLES = Object.freeze({
  ready: "깜짝! 지금 열 수 있어요",
  cooldown: "깜짝! 다음 상자를 준비하고 있어요"
});

export function getActionState(nextAvailableAt, now = Date.now()) {
  const isCoolingDown = Number.isFinite(nextAvailableAt) && nextAvailableAt > now;
  const state = isCoolingDown ? "cooldown" : "ready";

  return {
    isReady: !isCoolingDown,
    iconPath: ACTION_ICON_PATHS[state],
    title: ACTION_TITLES[state]
  };
}

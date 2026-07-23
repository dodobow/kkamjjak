import { EVENTS } from "./constants.js";
import { selectEventContent } from "./content.js";
import { getEventById, getFriendlyExecutionError, isScriptableUrl } from "./utils.js";

function getRuntimeUrl(path) {
  return chrome.runtime.getURL(path);
}

async function queryTabs(query) {
  return chrome.tabs.query(query);
}

async function getBestPlayableTab() {
  const [activeTab] = await queryTabs({ active: true, currentWindow: true });

  if (activeTab && isScriptableUrl(activeTab.url)) {
    return activeTab;
  }

  const tabs = await queryTabs({ currentWindow: true });
  return tabs
    .filter((tab) => isScriptableUrl(tab.url))
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0] || activeTab || null;
}

async function getTargetTab(targetTabId) {
  if (!targetTabId) return getBestPlayableTab();

  try {
    const tab = await chrome.tabs.get(Number(targetTabId));
    return tab && isScriptableUrl(tab.url) ? tab : null;
  } catch (error) {
    console.warn("target tab lookup failed", error);
    return null;
  }
}

async function focusTab(tab) {
  if (!tab?.id) return;

  try {
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    await chrome.tabs.update(tab.id, { active: true });
  } catch (error) {
    console.warn("target tab focus failed", error);
  }
}

function executeScriptInTab(tabId, eventId, effectData) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: runInjectedEffect,
    args: [eventId, effectData]
  });
}

function createContentSelection(eventId, options = {}) {
  const selection = selectEventContent(
    eventId,
    options.contentItemId,
    options.contentAssetId
  );

  return selection
    ? { ...selection, assetUrl: getRuntimeUrl(selection.assetPath) }
    : null;
}

export async function executeEvent(event, options = {}) {
  if (!event) {
    return { ok: false, userMessage: "결과를 찾을 수 없습니다." };
  }

  try {
    const contentSelection = createContentSelection(event.id, options);
    const effectData = event.id === "button_judgement"
      ? { comboImage: createContentSelection("sudden_cat") }
      : contentSelection;

    if (event.target === "tab") {
      const eventUrl = new URL(getRuntimeUrl("pages/event/index.html"));
      eventUrl.searchParams.set("eventId", event.id);

      if (contentSelection) {
        eventUrl.searchParams.set("contentItemId", contentSelection.itemId);
        eventUrl.searchParams.set("contentAssetId", contentSelection.assetId);
      }

      await chrome.tabs.create({
        url: eventUrl.toString()
      });
      return { ok: true, contentSelection };
    }

    const tab = await getTargetTab(options.targetTabId);
    if (!tab?.id || !isScriptableUrl(tab.url)) {
      return {
        ok: false,
        userMessage: options.targetTabId
          ? "재생할 웹페이지 탭을 찾을 수 없습니다."
          : "일반 웹페이지에서만 실행할 수 있습니다."
      };
    }

    if (options.focusTargetTab) {
      await focusTab(tab);
    }

    await executeScriptInTab(tab.id, event.id, effectData);
    return { ok: true, contentSelection };
  } catch (error) {
    console.error("event execution failed", error);
    return {
      ok: false,
      userMessage: options.targetTabId
        ? "대상 탭에 다시 권한이 필요합니다. 대상 페이지에서 확장 아이콘을 열어 도감을 다시 열어 주세요."
        : getFriendlyExecutionError(error?.message || "")
    };
  }
}

export async function executeEventById(eventId, options = {}) {
  return executeEvent(getEventById(eventId), options);
}

// This function is serialized by chrome.scripting.executeScript.
function runInjectedEffect(eventId, effectData) {
  const EFFECT_ROOT_ID = "__dopamine_button_effect_root__";
  const STYLE_ID = "__dopamine_button_effect_style__";
  const STATE_KEY = "__dopamine_button_effect_state__";
  const state = window[STATE_KEY] || {
    timers: [],
    restorers: []
  };
  window[STATE_KEY] = state;

  const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];

  const removeExisting = () => {
    state.timers.forEach((timer) => window.clearTimeout(timer));
    state.timers = [];
    state.restorers.splice(0).reverse().forEach((restore) => restore());
    document.getElementById(EFFECT_ROOT_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.classList.remove(
      "db-spin",
      "db-quake",
      "db-invert",
      "db-gray",
      "db-blur",
      "db-zoom",
      "db-judgement",
      "db-disaster"
    );
  };

  const schedule = (callback, delay) => {
    const timer = window.setTimeout(() => {
      state.timers = state.timers.filter((item) => item !== timer);
      callback();
    }, delay);
    state.timers.push(timer);
    return timer;
  };

  const cleanupLater = (delay = 5000) => schedule(removeExisting, delay);

  const addStyle = (css) => {
    document.getElementById(STYLE_ID)?.remove();
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.documentElement.append(style);
  };

  const createRoot = (className = "") => {
    document.getElementById(EFFECT_ROOT_ID)?.remove();
    const root = document.createElement("div");
    root.id = EFFECT_ROOT_ID;
    root.className = className;
    root.setAttribute("aria-hidden", "true");
    document.documentElement.append(root);
    return root;
  };

  const overlayMessage = (message, delay = 4200, centered = false) => {
    const root = createRoot(`db-overlay-message${centered ? " db-overlay-message-center" : ""}`);
    root.textContent = message;
    addStyle(`
      #${EFFECT_ROOT_ID}.db-overlay-message {
        position: fixed; z-index: 2147483647; left: 50%; top: 24px;
        max-width: min(680px, calc(100vw - 32px)); padding: 14px 18px;
        border: 1px solid rgba(255,255,255,.24); border-radius: 6px; background: rgba(32, 32, 30, .96);
        color: #f7f7f4; box-shadow: 0 8px 24px rgba(0,0,0,.24);
        font: 650 16px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-align: center; pointer-events: none; transform: translateX(-50%);
      }
      #${EFFECT_ROOT_ID}.db-overlay-message-center {
        top: 50%; min-width: min(480px, calc(100vw - 32px)); transform: translate(-50%, -50%);
        animation: dbMessagePop .32s ease-out both;
      }
      @keyframes dbMessagePop { from { opacity: 0; transform: translate(-50%, -45%) scale(.9); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    `);
    if (delay) cleanupLater(delay);
  };

  removeExisting();

  switch (eventId) {
    case "spin_world":
      addStyle(`
        html.db-spin body { animation: dbSpin 3.2s ease-in-out both; transform-origin: center center; will-change: transform; }
        @keyframes dbSpin { 0% { transform: rotate(0); } 45% { transform: rotate(1turn) scale(.96); } 100% { transform: rotate(0) scale(1); } }
      `);
      document.documentElement.classList.add("db-spin");
      cleanupLater(3400);
      break;

    case "browser_quake":
      addStyle(`
        html.db-quake body { animation: dbQuake .12s linear 26; will-change: transform; }
        @keyframes dbQuake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(6px, -3px); } 50% { transform: translate(-5px, 4px); } 75% { transform: translate(3px, 5px); } }
      `);
      document.documentElement.classList.add("db-quake");
      cleanupLater(3600);
      break;

    case "color_doom":
      addStyle(`html.db-invert { filter: invert(1) hue-rotate(180deg); }`);
      document.documentElement.classList.add("db-invert");
      cleanupLater(5000);
      break;

    case "gray_world":
      addStyle(`html.db-gray { filter: grayscale(1); }`);
      document.documentElement.classList.add("db-gray");
      cleanupLater(4500);
      break;

    case "blur_truth":
      addStyle(`html.db-blur { filter: blur(3px); transition: filter .3s ease; }`);
      document.documentElement.classList.add("db-blur");
      cleanupLater(4000);
      break;

    case "zoom_illusion":
      addStyle(`
        html.db-zoom body { animation: dbZoom 4.5s cubic-bezier(.16,.76,.2,1) both; transform-origin: center center; will-change: transform; }
        @keyframes dbZoom { 0%, 100% { transform: scale(1); } 42%, 66% { transform: scale(1.28); } }
      `);
      document.documentElement.classList.add("db-zoom");
      cleanupLater(4700);
      break;

    case "snow_browser": {
      const root = createRoot("db-weather");
      const addFlakes = (count) => {
        const flakes = Array.from({ length: count }, () => {
          const flake = document.createElement("span");
          flake.textContent = randomFrom(["❄", "✦", "·"]);
          flake.style.left = `${Math.random() * 100}%`;
          flake.style.animationDelay = `${Math.random() * .6}s`;
          flake.style.animationDuration = `${4.5 + Math.random() * 2.3}s`;
          flake.style.opacity = String(.45 + Math.random() * .55);
          flake.style.fontSize = `${10 + Math.random() * 14}px`;
          return flake;
        });
        root.append(...flakes);
      };

      addFlakes(26);
      [900, 1800, 2700, 3600].forEach((delay) => {
        schedule(() => addFlakes(22), delay);
      });
      addStyle(`
        #${EFFECT_ROOT_ID}.db-weather { position: fixed; inset: 0; z-index: 2147483647; overflow: hidden; pointer-events: none; }
        #${EFFECT_ROOT_ID}.db-weather span { position: absolute; top: -34px; color: #e9fbff; text-shadow: 0 0 8px #6bdfff; animation: dbSnow linear forwards; }
        @keyframes dbSnow { to { transform: translate3d(20px, calc(100vh + 72px), 0) rotate(1turn); } }
      `);
      cleanupLater(11200);
      break;
    }

    case "rain_browser": {
      const root = createRoot("db-rain");
      const addDrops = (count) => {
        const drops = Array.from({ length: count }, () => {
          const drop = document.createElement("i");
          drop.style.left = `${Math.random() * 100}%`;
          drop.style.animationDelay = `${Math.random() * .45}s`;
          drop.style.animationDuration = `${.75 + Math.random() * .85}s`;
          return drop;
        });
        root.append(...drops);
      };

      addDrops(30);
      [550, 1100, 1650, 2200, 2750, 3300].forEach((delay) => {
        schedule(() => addDrops(22), delay);
      });
      addStyle(`
        #${EFFECT_ROOT_ID}.db-rain { position: fixed; inset: 0; z-index: 2147483647; overflow: hidden; pointer-events: none; }
        #${EFFECT_ROOT_ID}.db-rain i { position: absolute; top: -90px; width: 2px; height: 58px; border-radius: 99px; background: linear-gradient(transparent, rgba(97, 217, 255, .92)); animation: dbRain linear forwards; }
        @keyframes dbRain { to { transform: translate3d(-20px, calc(100vh + 100px), 0); } }
      `);
      cleanupLater(6200);
      break;
    }

    case "sudden_cat": {
      if (!effectData?.assetUrl) {
        throw new Error("Missing discovery asset");
      }

      const root = createRoot("db-discovery");
      const image = document.createElement("img");
      const label = document.createElement("span");
      image.src = effectData.assetUrl;
      image.alt = "";
      label.textContent = `${effectData.itemName} 발견`;
      image.addEventListener("error", () => {
        image.remove();
        label.textContent = "이미지를 불러오지 못했습니다.";
      }, { once: true });
      root.append(image, label);
      addStyle(`
        #${EFFECT_ROOT_ID}.db-discovery { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: 24px; color: #fff; text-align: center; pointer-events: none; }
        #${EFFECT_ROOT_ID}.db-discovery::before { content: ""; position: absolute; inset: 0; background: rgba(9, 10, 16, .48); animation: dbDiscoveryShade 4.8s ease both; }
        #${EFFECT_ROOT_ID}.db-discovery img { position: relative; width: min(72vw, 680px); height: min(68vh, 680px); object-fit: contain; filter: drop-shadow(0 20px 22px rgba(0,0,0,.42)); animation: dbDiscoveryIn 4.8s cubic-bezier(.2,.75,.2,1) both; }
        #${EFFECT_ROOT_ID}.db-discovery span { position: absolute; left: 50%; bottom: 28px; min-width: 10rem; padding: 10px 16px; border: 1px solid rgba(255,255,255,.28); border-radius: 6px; color: #fff; background: rgba(32,32,30,.94); translate: -50% 0; font: 650 17px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; animation: dbDiscoveryLabel 4.8s ease both; }
        @keyframes dbDiscoveryShade { 0%,100% { opacity: 0; } 12%,82% { opacity: 1; } }
        @keyframes dbDiscoveryIn { 0% { opacity: 0; transform: translateY(8vh) scale(.72); } 18%,78% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-2vh) scale(.96); } }
        @keyframes dbDiscoveryLabel { 0%,12%,88%,100% { opacity: 0; transform: translateY(8px); } 24%,78% { opacity: 1; transform: translateY(0); } }
        @media (max-width: 540px) { #${EFFECT_ROOT_ID}.db-discovery img { width: min(88vw, 680px); height: min(64vh, 680px); } }
        @media (prefers-reduced-motion: reduce) { #${EFFECT_ROOT_ID}.db-discovery::before, #${EFFECT_ROOT_ID}.db-discovery img, #${EFFECT_ROOT_ID}.db-discovery span { animation-timing-function: linear; } }
      `);
      cleanupLater(4800);
      break;
    }

    case "giant_emoji": {
      const root = createRoot("db-giant-emoji");
      root.textContent = randomFrom(["😵‍💫", "🫠", "🪩", "✨"]);
      addStyle(`
        #${EFFECT_ROOT_ID}.db-giant-emoji { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; font-size: min(34vw, 260px); pointer-events: none; animation: dbEmoji 4s ease both; filter: drop-shadow(0 28px 50px rgba(0,0,0,.38)); }
        @keyframes dbEmoji { 0% { opacity: 0; transform: scale(.1) rotate(-20deg); } 30%, 75% { opacity: 1; transform: scale(1) rotate(8deg); } 100% { opacity: 0; transform: scale(.7) rotate(20deg); } }
      `);
      cleanupLater(4300);
      break;
    }

    case "button_mockery":
      overlayMessage(randomFrom([
        "최고의 운세! 무엇을 하든 성공할 하루입니다.",
        "무난한 하루가 될 것 같아요. 오늘 하루도 화이팅!",
        "주위를 조심하세요. 누군가가 당신의 뒤를 노리고 있을 수도...",
        "오늘은 작은 선택 하나가 큰 행운으로 이어질지도 몰라요.",
        "평범해 보이는 하루지만, 예상치 못한 좋은 소식이 찾아올 수 있어요.",
        "망설이던 일이 있다면 오늘이 시작하기 좋은 날이에요.",
        "운은 준비된 사람의 편! 오늘은 용기 내서 한 걸음 나아가 보세요.",
        "잠시 쉬어가는 것도 중요한 하루예요. 너무 서두르지 마세요.",
        "뜻밖의 만남이나 연락이 당신의 하루를 바꿀지도 몰라요.",
        "오늘의 운세는... 비밀~"
      ]), 4600, true);
      break;

    case "nothing_happened":
      schedule(() => console.info("깜짝!: Nothing 이벤트가 정상적으로 아무 일도 하지 않았습니다."), 250);
      break;

    case "delayed_disaster": {
      const root = createRoot("db-late-gift");
      const shade = document.createElement("span");
      const stage = document.createElement("div");
      const parcel = document.createElement("div");
      const giftBody = document.createElement("span");
      const giftLid = document.createElement("span");
      const giftNote = document.createElement("strong");
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const revealDelay = reducedMotion ? 1800 : 2600 + Math.random() * 1400;

      shade.className = "db-gift-shade";
      stage.className = "db-gift-stage";
      parcel.className = "db-gift-parcel";
      giftBody.className = "db-gift-body";
      giftLid.className = "db-gift-lid";
      giftNote.className = "db-gift-note";
      giftNote.textContent = "짜잔! 아무것도 없는 줄 알았죠?";
      parcel.append(giftBody, giftLid);

      Array.from({ length: 14 }, (_, index) => {
        const piece = document.createElement("i");
        piece.className = "db-gift-piece";
        piece.style.setProperty("--piece-x", `${-145 + Math.random() * 290}px`);
        piece.style.setProperty("--piece-y", `${-90 - Math.random() * 150}px`);
        piece.style.setProperty("--piece-r", `${-220 + Math.random() * 440}deg`);
        piece.style.setProperty("--piece-delay", `${.28 + index * .025}s`);
        piece.style.setProperty(
          "--piece-color",
          ["#b74640", "#d8a646", "#66856f", "#3f3b36"][index % 4]
        );
        stage.append(piece);
        return piece;
      });

      stage.append(parcel, giftNote);
      root.append(shade, stage);
      addStyle(`
        #${EFFECT_ROOT_ID}.db-late-gift {
          position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
          overflow: hidden; color: #302d29; font-family: system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif; pointer-events: none;
        }
        #${EFFECT_ROOT_ID} .db-gift-shade {
          position: absolute; inset: 0; background: rgba(30, 27, 24, .28); opacity: 0;
        }
        #${EFFECT_ROOT_ID}.is-arrived .db-gift-shade { animation: dbGiftShade 4.2s ease both; }
        #${EFFECT_ROOT_ID} .db-gift-stage {
          position: relative; display: grid; width: min(22rem, calc(100vw - 32px)); min-height: 16rem;
          place-items: center; align-content: center; gap: 18px; opacity: 0;
        }
        #${EFFECT_ROOT_ID}.is-arrived .db-gift-stage { animation: dbGiftStage 4.2s ease both; }
        #${EFFECT_ROOT_ID} .db-gift-parcel {
          position: relative; width: 160px; height: 124px; transform-origin: center bottom;
        }
        #${EFFECT_ROOT_ID}.is-arrived .db-gift-parcel { animation: dbGiftParcel 4.2s cubic-bezier(.2,.78,.22,1) both; }
        #${EFFECT_ROOT_ID} .db-gift-body,
        #${EFFECT_ROOT_ID} .db-gift-lid {
          position: absolute; display: block; border: 1px solid #4a453f; border-radius: 5px;
          background-color: #fff8ef;
        }
        #${EFFECT_ROOT_ID} .db-gift-body {
          inset: 28px 8px 0;
        }
        #${EFFECT_ROOT_ID} .db-gift-body::before,
        #${EFFECT_ROOT_ID} .db-gift-lid::before {
          position: absolute; inset: 0 auto 0 44%; width: 12%; background: #b74640; content: "";
        }
        #${EFFECT_ROOT_ID} .db-gift-body::after {
          position: absolute; inset: 42% 0 auto; height: 15px; background: #b74640; content: "";
        }
        #${EFFECT_ROOT_ID} .db-gift-lid {
          top: 18px; left: 0; width: 100%; height: 30px; border-radius: 5px 5px 3px 3px;
          transform-origin: 18% 100%;
        }
        #${EFFECT_ROOT_ID}.is-arrived .db-gift-lid { animation: dbGiftLid 4.2s ease both; }
        #${EFFECT_ROOT_ID} .db-gift-note {
          max-width: calc(100vw - 48px); padding: 8px 13px; border: 1px solid #4a453f;
          border-radius: 4px; color: #302d29; background: #fffaf4; font-size: 15px;
          font-weight: 700; line-height: 1.45; text-align: center; word-break: keep-all; opacity: 0;
        }
        #${EFFECT_ROOT_ID}.is-arrived .db-gift-note { animation: dbGiftNote 4.2s ease both; }
        #${EFFECT_ROOT_ID} .db-gift-piece {
          position: absolute; left: 50%; top: 48%; width: 8px; height: 13px; border-radius: 1px;
          background: var(--piece-color); opacity: 0;
        }
        #${EFFECT_ROOT_ID}.is-arrived .db-gift-piece {
          animation: dbGiftPiece 1.25s cubic-bezier(.12,.72,.2,1) var(--piece-delay) both;
        }
        @keyframes dbGiftShade { 0%, 100% { opacity: 0; } 12%, 82% { opacity: 1; } }
        @keyframes dbGiftStage { 0%, 100% { opacity: 0; transform: translateY(12px); } 12%, 82% { opacity: 1; transform: translateY(0); } }
        @keyframes dbGiftParcel { 0% { transform: translateY(-32px) scale(.9); } 18% { transform: translateY(4px) scale(1.02); } 25%, 82% { transform: translateY(0) scale(1); } 100% { transform: translateY(-4px) scale(.98); } }
        @keyframes dbGiftLid { 0%, 23% { transform: translate(0) rotate(0); } 36%, 78% { transform: translate(-8px, -34px) rotate(-8deg); } 100% { transform: translate(-6px, -30px) rotate(-6deg); opacity: 0; } }
        @keyframes dbGiftNote { 0%, 28% { opacity: 0; transform: translateY(8px); } 42%, 82% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; } }
        @keyframes dbGiftPiece { 0% { opacity: 0; transform: translate(-50%, -50%) scale(.3); } 18% { opacity: 1; } 100% { opacity: 0; transform: translate(calc(-50% + var(--piece-x)), calc(-50% + var(--piece-y))) rotate(var(--piece-r)); } }
        @media (prefers-reduced-motion: reduce) {
          #${EFFECT_ROOT_ID}.is-arrived .db-gift-shade { animation: dbGiftShade 4.2s linear both; }
          #${EFFECT_ROOT_ID}.is-arrived .db-gift-stage { animation: dbGiftReduced 4.2s linear both; transform: none; }
          #${EFFECT_ROOT_ID}.is-arrived .db-gift-parcel,
          #${EFFECT_ROOT_ID}.is-arrived .db-gift-lid { animation: none; transform: none; }
          #${EFFECT_ROOT_ID}.is-arrived .db-gift-note { animation: dbGiftReduced 4.2s linear both; transform: none; }
          #${EFFECT_ROOT_ID} .db-gift-piece { display: none; }
          @keyframes dbGiftReduced { 0%, 100% { opacity: 0; } 10%, 86% { opacity: 1; } }
        }
      `);
      schedule(() => root.classList.add("is-arrived"), revealDelay);
      cleanupLater(revealDelay + 4400);
      break;
    }

    case "button_judgement": {
      const root = createRoot("db-combo-layer");
      const image = document.createElement("img");
      const emoji = document.createElement("span");
      const htmlClass = "db-combo-active";

      image.className = "db-combo-image";
      image.alt = "";
      if (effectData?.comboImage?.assetUrl) {
        image.src = effectData.comboImage.assetUrl;
        image.addEventListener("error", () => image.remove(), { once: true });
        root.append(image);
      }

      emoji.className = "db-combo-emoji";
      emoji.textContent = randomFrom(["😵‍💫", "🫠", "🤯", "🥳"]);
      root.append(emoji);

      Array.from({ length: 42 }, () => {
        const snow = document.createElement("span");
        const duration = 3.6 + Math.random() * 2;
        snow.className = "db-combo-snow";
        snow.textContent = randomFrom(["❄", "✦", "·"]);
        snow.style.left = `${Math.random() * 100}%`;
        snow.style.setProperty("--particle-top", `${Math.random() * 100}%`);
        snow.style.setProperty("--particle-delay", `${-Math.random() * duration}s`);
        snow.style.setProperty("--particle-duration", `${duration}s`);
        snow.style.setProperty("--particle-size", `${9 + Math.random() * 13}px`);
        root.append(snow);
        return snow;
      });

      Array.from({ length: 52 }, () => {
        const rain = document.createElement("i");
        const duration = .8 + Math.random() * .8;
        rain.className = "db-combo-rain";
        rain.style.left = `${Math.random() * 100}%`;
        rain.style.setProperty("--particle-top", `${Math.random() * 100}%`);
        rain.style.setProperty("--particle-delay", `${-Math.random() * duration}s`);
        rain.style.setProperty("--particle-duration", `${duration}s`);
        rain.style.setProperty("--particle-length", `${32 + Math.random() * 34}px`);
        root.append(rain);
        return rain;
      });

      document.documentElement.classList.add(htmlClass);
      state.restorers.push(() => document.documentElement.classList.remove(htmlClass));
      addStyle(`
        #${EFFECT_ROOT_ID}.db-combo-layer {
          position: fixed; inset: 0; z-index: 2147483647; overflow: hidden; pointer-events: none;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        html.db-combo-active body {
          filter: blur(3px); transform-origin: center; will-change: transform;
          animation: dbComboSpin 5.8s ease-in-out both;
        }
        #${EFFECT_ROOT_ID} .db-combo-image {
          position: absolute; z-index: 1; left: 50%; top: 54%; width: min(52vw, 520px);
          height: min(60vh, 560px); object-fit: contain; transform: translate(-50%, -50%);
          filter: drop-shadow(0 10px 16px rgba(0, 0, 0, .22));
          animation: dbComboImage 5.8s cubic-bezier(.2,.75,.2,1) both;
        }
        #${EFFECT_ROOT_ID} .db-combo-emoji {
          position: absolute; z-index: 2; top: max(7vh, 36px); right: max(6vw, 24px);
          font-size: min(20vw, 156px); line-height: 1;
          filter: drop-shadow(0 8px 12px rgba(0, 0, 0, .2));
          animation: dbComboEmoji 5.8s ease both;
        }
        #${EFFECT_ROOT_ID} .db-combo-snow {
          position: absolute; z-index: 3; top: -34px; color: #f4fbfd; font-size: var(--particle-size);
          line-height: 1; text-shadow: 0 1px 1px rgba(0, 0, 0, .24);
          animation: dbComboSnow var(--particle-duration) linear var(--particle-delay) 2 both;
        }
        #${EFFECT_ROOT_ID} .db-combo-rain {
          position: absolute; z-index: 3; top: -72px; width: 2px; height: var(--particle-length);
          border-radius: 2px; background: rgba(83, 151, 184, .82); transform: rotate(8deg);
          animation: dbComboRain var(--particle-duration) linear var(--particle-delay) 5 both;
        }
        @keyframes dbComboSpin {
          0% { transform: rotate(0) scale(1); }
          45% { transform: rotate(1turn) scale(.96); }
          100% { transform: rotate(0) scale(1); }
        }
        @keyframes dbComboImage {
          0%, 100% { opacity: 0; transform: translate(-50%, -44%) scale(.72); }
          12%, 84% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes dbComboEmoji {
          0%, 100% { opacity: 0; transform: scale(.3) rotate(-16deg); }
          10%, 86% { opacity: 1; transform: scale(1) rotate(8deg); }
        }
        @keyframes dbComboSnow { to { transform: translate3d(20px, calc(100vh + 78px), 0) rotate(1turn); } }
        @keyframes dbComboRain { to { transform: translate3d(-22px, calc(100vh + 124px), 0) rotate(8deg); } }
        @media (max-width: 540px) {
          #${EFFECT_ROOT_ID} .db-combo-image {
            top: 58%; width: min(78vw, 420px); height: min(54vh, 480px);
          }
          #${EFFECT_ROOT_ID} .db-combo-emoji {
            top: 9vh; right: 6vw; font-size: min(28vw, 132px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          html.db-combo-active body { animation: none; }
          #${EFFECT_ROOT_ID} .db-combo-image,
          #${EFFECT_ROOT_ID} .db-combo-emoji { animation: dbComboFadeReduced 5.8s linear both; }
          #${EFFECT_ROOT_ID} .db-combo-snow,
          #${EFFECT_ROOT_ID} .db-combo-rain {
            top: var(--particle-top); animation: none; opacity: .72;
          }
          @keyframes dbComboFadeReduced { 0%, 100% { opacity: 0; } 10%, 88% { opacity: 1; } }
        }
      `);
      cleanupLater(6200);
      break;
    }

    default:
      throw new Error(`Unknown injected eventId: ${eventId}`);
  }
}

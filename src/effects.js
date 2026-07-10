import { EVENTS } from "./constants.js";
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

function executeScriptInTab(tabId, eventId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: runInjectedEffect,
    args: [eventId]
  });
}

export async function executeEvent(event, options = {}) {
  if (!event) {
    return { ok: false, userMessage: "이벤트를 찾을 수 없습니다." };
  }

  try {
    if (event.target === "tab") {
      await chrome.tabs.create({
        url: getRuntimeUrl(`event-page.html?eventId=${encodeURIComponent(event.id)}`)
      });
      return { ok: true };
    }

    const tab = await getTargetTab(options.targetTabId);
    if (!tab?.id || !isScriptableUrl(tab.url)) {
      return {
        ok: false,
        userMessage: options.targetTabId
          ? "재생할 웹페이지 탭을 찾을 수 없습니다."
          : "일반 웹페이지에서만 버튼이 작동합니다."
      };
    }

    if (options.focusTargetTab) {
      await focusTab(tab);
    }

    await executeScriptInTab(tab.id, event.id);
    return { ok: true };
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
function runInjectedEffect(eventId) {
  const EFFECT_ROOT_ID = "__dopamine_button_effect_root__";
  const STYLE_ID = "__dopamine_button_effect_style__";
  const STATE_KEY = "__dopamine_button_effect_state__";
  const state = window[STATE_KEY] || {
    timers: [],
    restorers: [],
    audioContexts: []
  };
  window[STATE_KEY] = state;

  const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];

  const closeAudioContext = (context) => {
    state.audioContexts = state.audioContexts.filter((item) => item !== context);
    context.close().catch(() => {});
  };

  const removeExisting = () => {
    state.timers.forEach((timer) => window.clearTimeout(timer));
    state.timers = [];
    state.restorers.splice(0).reverse().forEach((restore) => restore());
    state.audioContexts.splice(0).forEach((context) => context.close().catch(() => {}));
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
        max-width: min(680px, calc(100vw - 32px)); padding: 16px 20px;
        border: 2px solid #ff335f; border-radius: 8px; background: rgba(12, 12, 20, .94);
        color: #fff; box-shadow: 0 18px 60px rgba(255, 51, 95, .35);
        font: 800 18px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

  const playTone = (notes) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      overlayMessage("소리가 나야 했는데 브라우저가 조용함을 선택했습니다.");
      return;
    }

    const context = new AudioContext();
    state.audioContexts.push(context);
    context.resume().catch(() => {});

    const start = context.currentTime + .03;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 8;
    compressor.connect(context.destination);

    const master = context.createGain();
    master.gain.setValueAtTime(.0001, start);
    master.gain.exponentialRampToValueAtTime(.3, start + .04);
    master.gain.exponentialRampToValueAtTime(.0001, start + 2.2);
    master.connect(compressor);

    notes.forEach((note, index) => {
      const at = start + index * .22;
      const duration = index === notes.length - 1 ? .46 : .25;
      ["triangle", "sine"].forEach((type, layer) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(note * (layer ? 2 : 1), at);
        oscillator.detune.value = layer ? 4 : -3;
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(layer ? .13 : .27, at + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(at);
        oscillator.stop(at + duration + .03);
      });
    });

    schedule(() => closeAudioContext(context), 2500);
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
      const root = createRoot("db-cat");
      root.innerHTML = `<div class="db-cat-emoji">${randomFrom(["🐈", "🐈‍⬛", "😼"])}</div><p>${randomFrom([
        "고양이가 모든 판단을 보류했습니다.",
        "고양이가 방금 이 탭의 주인이 되었습니다.",
        "고양이는 버튼을 누른 적이 없다고 합니다."
      ])}</p>`;
      addStyle(`
        #${EFFECT_ROOT_ID}.db-cat { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-content: center; gap: 6px; text-align: center; color: #fff; pointer-events: none; animation: dbCatIn .35s ease-out both; }
        #${EFFECT_ROOT_ID}.db-cat::before { content: ""; position: absolute; inset: 0; background: rgba(9, 10, 16, .42); }
        #${EFFECT_ROOT_ID} .db-cat-emoji, #${EFFECT_ROOT_ID} p { position: relative; margin: 0; }
        #${EFFECT_ROOT_ID} .db-cat-emoji { font-size: min(34vw, 250px); filter: drop-shadow(0 24px 30px rgba(0,0,0,.45)); animation: dbCatFloat 1.4s ease-in-out infinite alternate; }
        #${EFFECT_ROOT_ID} p { max-width: min(620px, calc(100vw - 32px)); padding: 12px 18px; border: 1px solid rgba(255,255,255,.28); border-radius: 8px; background: rgba(15, 15, 22, .9); font: 800 18px/1.4 system-ui, sans-serif; }
        @keyframes dbCatIn { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes dbCatFloat { to { transform: translateY(-12px) rotate(3deg); } }
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

    case "odd_stamp": {
      const root = createRoot("db-stamp");
      root.textContent = randomFrom(["승인됨?", "검토 보류", "이상 없음", "확인 불가"]);
      root.style.setProperty("--stamp-x", `${12 + Math.random() * 76}vw`);
      root.style.setProperty("--stamp-y", `${14 + Math.random() * 72}vh`);
      root.style.setProperty("--stamp-r", `${-32 + Math.random() * 64}deg`);
      addStyle(`
        #${EFFECT_ROOT_ID}.db-stamp { position: fixed; z-index: 2147483647; left: var(--stamp-x); top: var(--stamp-y); width: 180px; height: 180px; display: grid; place-items: center; border: 12px double #ff335f; border-radius: 50%; color: #ff335f; background: rgba(255,255,255,.04); font: 900 30px/1.1 system-ui, sans-serif; text-align: center; transform: translate(-50%, -50%) rotate(var(--stamp-r)); pointer-events: none; animation: dbStamp 4.8s ease both; text-shadow: 0 2px 0 rgba(0,0,0,.2); }
        @keyframes dbStamp { 0% { opacity: 0; transform: translate(-50%, -50%) scale(2.4) rotate(var(--stamp-r)); } 18%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(var(--stamp-r)); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(.8) rotate(var(--stamp-r)); } }
      `);
      cleanupLater(5000);
      break;
    }

    case "mystery_sound":
      playTone([220, 293.66, 233.08, 440, 155.56]);
      overlayMessage("띠로롱. 방금 무언가 승인된 척했습니다.", 3000);
      break;

    case "failed_fanfare":
      playTone([523.25, 659.25, 783.99, 1046.5, 155.56]);
      overlayMessage("팡파르가 마지막 음에서 자신감을 잃었습니다.", 3600);
      break;

    case "tone_pollution": {
      const candidates = Array.from(document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, td, th"))
        .filter((node) => {
          const text = node.textContent.trim();
          const rect = node.getBoundingClientRect();
          const style = window.getComputedStyle(node);
          return text.length > 8 && rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        })
        .sort(() => Math.random() - .5)
        .slice(0, 24);
      const changedNodes = candidates.map((node, index) => {
        const originalText = node.textContent;
        node.dataset.dopamineOriginalText = originalText;
        node.textContent = `${randomFrom(["긴급 공지:", "참고로", "아무튼", "공식 발표:"])} ${originalText.trim().slice(0, 88)} ${[
          "아마 버튼 때문입니다.",
          "라는 소문이 있습니다.",
          "버튼은 알고 있습니다.",
          "...라고 적혀 있네요."
        ][index % 4]}`;
        return [node, originalText];
      });
      state.restorers.push(() => {
        changedNodes.forEach(([node, originalText]) => {
          if (node.dataset.dopamineOriginalText === originalText) {
            node.textContent = originalText;
            delete node.dataset.dopamineOriginalText;
          }
        });
      });
      overlayMessage(`페이지의 문장 ${changedNodes.length}개가 잠깐 이상해졌습니다.`, 5600);
      break;
    }

    case "button_mockery":
      overlayMessage(randomFrom([
        "너는 또 버튼을 눌렀다. 기록은 남았다.",
        "버튼은 당신의 선택을 기억합니다.",
        "이번에도 호기심이 이겼습니다."
      ]), 4600, true);
      break;

    case "nothing_happened":
      schedule(() => console.info("도파민 버튼: Nothing 이벤트가 정상적으로 아무 일도 하지 않았습니다."), 250);
      break;

    case "delayed_disaster":
      overlayMessage("...", 0);
      schedule(() => {
        const root = createRoot("db-catastrophe");
        root.innerHTML = "<span>늦었습니다.<br>이제야 도착한 재앙입니다.</span>";
        addStyle(`
          html.db-disaster { filter: hue-rotate(150deg) saturate(2.1) contrast(1.38); }
          html.db-disaster body { animation: dbCatastrophe .11s linear 30; transform-origin: center; will-change: transform; }
          #${EFFECT_ROOT_ID}.db-catastrophe { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; overflow: hidden; color: white; background: repeating-linear-gradient(0deg, rgba(255,255,255,.13) 0 2px, transparent 2px 7px), rgba(255, 20, 80, .24); pointer-events: none; font: 900 min(7vw, 70px)/1.08 system-ui, sans-serif; text-align: center; text-shadow: 0 8px 28px rgba(0,0,0,.72); }
          #${EFFECT_ROOT_ID}.db-catastrophe::before { content: "!  !  !  !  !  !"; position: absolute; inset: -20%; color: rgba(255,255,255,.28); font-size: min(18vw, 190px); letter-spacing: 20px; animation: dbWarningFall 1.1s linear infinite; }
          #${EFFECT_ROOT_ID}.db-catastrophe span { position: relative; padding: 26px 32px; border: 2px solid rgba(255,255,255,.7); border-radius: 8px; background: rgba(12,12,18,.76); }
          @keyframes dbCatastrophe { 0%,100% { transform: translate(0) scale(1); } 25% { transform: translate(9px,-5px) scale(1.12); } 50% { transform: translate(-8px,7px) scale(1.16); } 75% { transform: translate(4px,5px) scale(1.1); } }
          @keyframes dbWarningFall { to { transform: translateY(18%); } }
        `);
        document.documentElement.classList.add("db-disaster");
      }, 2400);
      cleanupLater(7200);
      break;

    case "button_judgement":
      addStyle(`
        html.db-judgement { filter: saturate(1.8) contrast(1.25); }
        #${EFFECT_ROOT_ID}.db-judgement-root { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; overflow: hidden; background: radial-gradient(circle at center, rgba(255, 51, 95, .18), rgba(8, 8, 16, .78)); color: white; pointer-events: none; font: 900 min(9vw, 82px)/1.05 system-ui, sans-serif; text-align: center; }
        #${EFFECT_ROOT_ID}.db-judgement-root::before { content: ""; position: absolute; inset: -55vmax; background: conic-gradient(from 0deg, transparent, rgba(255,255,255,.25), transparent, rgba(255,51,95,.45), transparent); animation: dbJudgementSpin 1.6s linear infinite; }
        #${EFFECT_ROOT_ID}.db-judgement-root span { position: relative; max-width: 900px; padding: 24px; text-shadow: 0 8px 30px rgba(0,0,0,.6); }
        @keyframes dbJudgementSpin { to { transform: rotate(1turn); } }
      `);
      document.documentElement.classList.add("db-judgement");
      createRoot("db-judgement-root").innerHTML = "<span>버튼의<br>심판</span>";
      cleanupLater(6800);
      break;

    default:
      throw new Error(`Unknown injected eventId: ${eventId}`);
  }
}

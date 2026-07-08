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
  const playableTabs = tabs
    .filter((tab) => isScriptableUrl(tab.url))
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

  return playableTabs[0] || activeTab || null;
}

async function getTargetTab(targetTabId) {
  if (!targetTabId) return getBestPlayableTab();

  try {
    const tab = await chrome.tabs.get(Number(targetTabId));
    if (tab && isScriptableUrl(tab.url)) {
      return tab;
    }
  } catch (error) {
    console.warn("target tab lookup failed", error);
  }

  return null;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function focusTab(tab) {
  if (!tab?.id) return;

  try {
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    await chrome.tabs.update(tab.id, { active: true });
    await wait(180);
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
    return {
      ok: false,
      userMessage: "이벤트를 찾을 수 없습니다."
    };
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
          ? "도감을 열었던 웹 탭을 찾을 수 없습니다."
          : "이 페이지에서는 버튼의 힘이 통하지 않습니다."
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
        ? "대상 웹 탭에 다시 권한이 필요합니다. 확인할 웹페이지에서 확장 아이콘을 눌러 도감을 다시 열어 주세요."
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

  const removeExisting = () => {
    document.getElementById(EFFECT_ROOT_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.classList.remove(
      "db-spin",
      "db-quake",
      "db-invert",
      "db-gray",
      "db-blur",
      "db-zoom",
      "db-judgement"
    );
  };

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

  const cleanupLater = (delay = 5000) => {
    window.setTimeout(removeExisting, delay);
  };

  const overlayMessage = (message, delay = 4200) => {
    const root = createRoot("db-overlay-message");
    root.textContent = message;
    addStyle(`
      #${EFFECT_ROOT_ID}.db-overlay-message {
        position: fixed;
        z-index: 2147483647;
        left: 50%;
        top: 24px;
        transform: translateX(-50%);
        max-width: min(680px, calc(100vw - 32px));
        padding: 16px 20px;
        border: 2px solid #ff335f;
        border-radius: 14px;
        background: rgba(12, 12, 20, 0.92);
        color: #fff;
        box-shadow: 0 18px 60px rgba(255, 51, 95, 0.35);
        font: 800 18px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-align: center;
        pointer-events: none;
      }
    `);
    cleanupLater(delay);
  };

  const playTone = (notes) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      overlayMessage("소리가 나야 했는데 브라우저가 조용함을 선택했습니다.");
      return;
    }

    const context = new AudioContext();
    const start = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.12, start + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
    master.connect(context.destination);

    notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index % 2 ? "square" : "triangle";
      oscillator.frequency.setValueAtTime(note, start + index * 0.15);
      gain.gain.setValueAtTime(0.0001, start + index * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.8, start + index * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.15 + 0.14);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start + index * 0.15);
      oscillator.stop(start + index * 0.15 + 0.16);
    });

    window.setTimeout(() => context.close().catch(() => {}), 1400);
  };

  removeExisting();

  switch (eventId) {
    case "spin_world":
      addStyle(`
        html.db-spin body { animation: dbSpin 3.2s ease-in-out both; transform-origin: center center; }
        @keyframes dbSpin { 0% { transform: rotate(0); } 45% { transform: rotate(1turn) scale(.96); } 100% { transform: rotate(0) scale(1); } }
      `);
      document.documentElement.classList.add("db-spin");
      cleanupLater(3400);
      break;

    case "browser_quake":
      addStyle(`
        html.db-quake body { animation: dbQuake .12s linear 26; }
        @keyframes dbQuake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(6px, -3px); }
          50% { transform: translate(-5px, 4px); }
          75% { transform: translate(3px, 5px); }
        }
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
        html.db-zoom body { animation: dbZoom 4s ease-in-out both; transform-origin: center top; }
        @keyframes dbZoom { 0%, 100% { transform: scale(1); } 45%, 65% { transform: scale(1.08); } }
      `);
      document.documentElement.classList.add("db-zoom");
      cleanupLater(4200);
      break;

    case "snow_browser": {
      const root = createRoot("db-weather");
      const flakes = Array.from({ length: 42 }, (_, index) => {
        const flake = document.createElement("span");
        flake.textContent = "✦";
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.animationDelay = `${Math.random() * 2}s`;
        flake.style.animationDuration = `${3 + Math.random() * 3}s`;
        flake.style.opacity = String(0.45 + Math.random() * 0.55);
        flake.style.fontSize = `${10 + Math.random() * 14}px`;
        flake.dataset.index = String(index);
        return flake;
      });
      root.append(...flakes);
      addStyle(`
        #${EFFECT_ROOT_ID}.db-weather { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; overflow: hidden; }
        #${EFFECT_ROOT_ID}.db-weather span { position: absolute; top: -32px; color: #e9fbff; text-shadow: 0 0 8px #6bdfff; animation: dbSnow linear forwards; }
        @keyframes dbSnow { to { transform: translate3d(20px, calc(100vh + 48px), 0) rotate(1turn); } }
      `);
      cleanupLater(6500);
      break;
    }

    case "rain_browser": {
      const root = createRoot("db-rain");
      const drops = Array.from({ length: 70 }, () => {
        const drop = document.createElement("i");
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${Math.random() * 1.8}s`;
        drop.style.animationDuration = `${0.45 + Math.random() * 0.55}s`;
        return drop;
      });
      root.append(...drops);
      addStyle(`
        #${EFFECT_ROOT_ID}.db-rain { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; overflow: hidden; }
        #${EFFECT_ROOT_ID}.db-rain i { position: absolute; top: -80px; width: 2px; height: 46px; border-radius: 99px; background: linear-gradient(transparent, rgba(97, 217, 255, .85)); animation: dbRain linear forwards; }
        @keyframes dbRain { to { transform: translate3d(-20px, calc(100vh + 100px), 0); } }
      `);
      cleanupLater(5200);
      break;
    }

    case "sudden_cat":
      overlayMessage("고양이가 모든 판단을 보류했습니다. ฅ^•ﻌ•^ฅ", 4300);
      break;

    case "giant_emoji": {
      const root = createRoot("db-giant-emoji");
      root.textContent = ["😵‍💫", "🫠", "🪩", "✨"][Math.floor(Math.random() * 4)];
      addStyle(`
        #${EFFECT_ROOT_ID}.db-giant-emoji {
          position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
          font-size: min(34vw, 260px); pointer-events: none; animation: dbEmoji 4s ease both;
          filter: drop-shadow(0 28px 50px rgba(0,0,0,.38));
        }
        @keyframes dbEmoji { 0% { opacity: 0; transform: scale(.1) rotate(-20deg); } 30%, 75% { opacity: 1; transform: scale(1) rotate(8deg); } 100% { opacity: 0; transform: scale(.7) rotate(20deg); } }
      `);
      cleanupLater(4300);
      break;
    }

    case "odd_stamp": {
      const root = createRoot("db-stamp");
      root.textContent = "승인됨?";
      addStyle(`
        #${EFFECT_ROOT_ID}.db-stamp {
          position: fixed; z-index: 2147483647; right: 8vw; top: 18vh; width: 180px; height: 180px;
          display: grid; place-items: center; border: 12px double #ff335f; border-radius: 50%;
          color: #ff335f; background: rgba(255,255,255,.04); font: 900 34px/1.1 system-ui, sans-serif;
          transform: rotate(-17deg); pointer-events: none; animation: dbStamp 4.8s ease both;
          text-shadow: 0 2px 0 rgba(0,0,0,.2);
        }
        @keyframes dbStamp { 0% { opacity: 0; transform: scale(2.4) rotate(-17deg); } 18%, 80% { opacity: 1; transform: scale(1) rotate(-17deg); } 100% { opacity: 0; transform: scale(.8) rotate(-17deg); } }
      `);
      cleanupLater(5000);
      break;
    }

    case "mystery_sound":
      playTone([220, 330, 247, 392, 196]);
      overlayMessage("띠로롱. 방금 무언가 승인된 척했습니다.", 3000);
      break;

    case "failed_fanfare":
      playTone([523, 659, 784, 392, 185]);
      overlayMessage("팡파르가 중간에 자신감을 잃었습니다.", 3600);
      break;

    case "tone_pollution": {
      const candidates = Array.from(document.querySelectorAll("p, h1, h2, h3, li, a, button, span"))
        .filter((node) => node.childNodes.length && node.textContent.trim().length > 8)
        .slice(0, 18);
      const endings = [" 아무튼 버튼 때문입니다.", " 라는 소문이 있습니다.", " 버튼은 알고 있습니다.", " ...라고 적혀 있네요."];
      const changedNodes = [];
      candidates.slice(0, 8).forEach((node, index) => {
        const originalText = node.textContent;
        node.dataset.dopamineOriginalText = originalText;
        changedNodes.push([node, originalText]);
        node.textContent = `${node.textContent.trim().slice(0, 80)}${endings[index % endings.length]}`;
      });
      overlayMessage("페이지 말투가 잠깐 이상해졌습니다. 새로고침하면 얌전해집니다.", 5200);
      window.setTimeout(() => {
        changedNodes.forEach(([node, originalText]) => {
          if (node.dataset.dopamineOriginalText === originalText) {
            node.textContent = originalText;
            delete node.dataset.dopamineOriginalText;
          }
        });
      }, 5400);
      break;
    }

    case "button_mockery":
      overlayMessage("너는 또 버튼을 눌렀다. 기록은 남았다.", 4600);
      break;

    case "nothing_happened":
      window.setTimeout(() => {
        console.info("도파민 버튼: Nothing 이벤트가 정상적으로 아무 일도 하지 않았습니다.");
      }, 250);
      break;

    case "delayed_disaster":
      overlayMessage("...", 1600);
      window.setTimeout(() => {
        removeExisting();
        overlayMessage("늦었습니다. 이제야 도착한 재앙입니다.", 4200);
      }, 2600);
      break;

    case "button_judgement":
      addStyle(`
        html.db-judgement { filter: saturate(1.8) contrast(1.25); }
        #${EFFECT_ROOT_ID}.db-judgement-root {
          position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
          background: radial-gradient(circle at center, rgba(255, 51, 95, .18), rgba(8, 8, 16, .78));
          color: white; pointer-events: none; overflow: hidden;
          font: 900 min(9vw, 82px)/1.05 system-ui, sans-serif; text-align: center;
        }
        #${EFFECT_ROOT_ID}.db-judgement-root::before {
          content: ""; position: absolute; inset: -20%; background: conic-gradient(from 0deg, transparent, rgba(255,255,255,.25), transparent, rgba(255,51,95,.45), transparent);
          animation: dbJudgementSpin 1.6s linear infinite;
        }
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

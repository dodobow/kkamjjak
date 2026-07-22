import { APP_NAME } from "./src/constants.js";
import { selectEventContent } from "./src/content.js";
import { initTheme } from "./src/theme.js";
import { getEventById } from "./src/utils.js";

const params = new URLSearchParams(location.search);
const eventId = params.get("eventId");
const event = getEventById(eventId);
const contentSelection = selectEventContent(
  eventId,
  params.get("contentItemId"),
  params.get("contentAssetId")
);

function getRuntimeUrl(path) {
  return globalThis.chrome?.runtime?.getURL(path) || path;
}

const oracleLines = [
  "개발자의 MBTI는 ENTP입니다.",
  "시바견은 이름과 달리 욕설을 하지 않습니다.",
  "레몬 하나에는 레몬 1개 분량의 비타민 C가 들어 있습니다.",
  "금성에서는 하루가 1년보다 깁니다.",
  "문어는 심장이 세 개입니다.",
  "웜뱃은 네모난 똥을 쌉니다.",
  "에펠탑의 높이는 기온에 따라 달라집니다.",
  "가면올빼미는 완전한 어둠 속에서도 소리만으로 먹이의 위치를 찾아낼 수 있습니다.",
  "카피바라는 현존하는 설치류 중 가장 큽니다.",
  "크레스티드 게코는 눈꺼풀이 없어 혀로 눈을 닦습니다.",
  "개의 코무늬는 사람의 지문처럼 개체마다 다릅니다.",
  "황제펭귄 수컷은 알을 발등 위에 올린 채 약 두 달 동안 품습니다.",
  "사막여우는 개과 동물 중 몸집에 비해 가장 큰 귀를 가지고 있습니다.",
  "푸른바다거북이라는 이름은 등딱지가 아니라 체지방이 녹색인 데서 유래했습니다.",
  "레서판다는 대나무를 잡기 위한 가짜 엄지를 가지고 있습니다.",
  "스피노사우루스는 현재까지 알려진 육식공룡 중 몸길이가 가장 길었습니다."
];

function createRipple(container, x, y) {
  const ripple = document.createElement("span");
  ripple.className = "scene-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  container.append(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

function createLeaves(container, x, y) {
  Array.from({ length: 7 }, (_, index) => {
    const leaf = document.createElement("span");
    leaf.className = "scene-leaf";
    leaf.style.left = `${x + (Math.random() - .5) * 80}px`;
    leaf.style.top = `${y + (Math.random() - .5) * 36}px`;
    leaf.style.setProperty("--leaf-x", `${(Math.random() - .5) * 180}px`);
    leaf.style.setProperty("--leaf-y", `${100 + Math.random() * 160}px`);
    leaf.style.setProperty("--leaf-r", `${180 + Math.random() * 360}deg`);
    leaf.style.animationDelay = `${index * 35}ms`;
    container.append(leaf);
    leaf.addEventListener("animationend", () => leaf.remove(), { once: true });
    return leaf;
  });
}

function createPetals(container, x, y) {
  Array.from({ length: 8 }, (_, index) => {
    const petal = document.createElement("span");
    petal.className = "scene-petal";
    petal.style.left = `${x + (Math.random() - .5) * 70}px`;
    petal.style.top = `${y + (Math.random() - .5) * 30}px`;
    petal.style.setProperty("--petal-x", `${(Math.random() - .5) * 160}px`);
    petal.style.setProperty("--petal-y", `${70 + Math.random() * 110}px`);
    petal.style.setProperty("--petal-r", `${180 + Math.random() * 300}deg`);
    petal.style.animationDelay = `${index * 30}ms`;
    container.append(petal);
    petal.addEventListener("animationend", () => petal.remove(), { once: true });
    return petal;
  });
}

function createDust(container, x, y) {
  Array.from({ length: 9 }, (_, index) => {
    const dust = document.createElement("span");
    dust.className = "scene-dust";
    dust.style.left = `${x + (Math.random() - .5) * 90}px`;
    dust.style.top = `${y + (Math.random() - .5) * 34}px`;
    dust.style.setProperty("--dust-size", `${8 + Math.random() * 16}px`);
    dust.style.setProperty("--dust-x", `${(Math.random() - .5) * 150}px`);
    dust.style.setProperty("--dust-y", `${-35 - Math.random() * 75}px`);
    dust.style.animationDelay = `${index * 24}ms`;
    container.append(dust);
    dust.addEventListener("animationend", () => dust.remove(), { once: true });
    return dust;
  });
}

function bindSceneInteraction(selection) {
  const backdrop = document.querySelector("#sceneBackdrop");
  const effects = document.querySelector("#sceneEffects");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion) {
    window.addEventListener("pointermove", (pointerEvent) => {
      const x = pointerEvent.clientX / window.innerWidth - .5;
      const y = pointerEvent.clientY / window.innerHeight - .5;
      backdrop.style.setProperty("--scene-x", `${x * -18}px`);
      backdrop.style.setProperty("--scene-y", `${y * -12}px`);
    });
  }

  window.addEventListener("pointerup", (pointerEvent) => {
    if (pointerEvent.target.closest("button")) return;

    switch (selection.interaction) {
      case "leaves":
        createLeaves(effects, pointerEvent.clientX, pointerEvent.clientY);
        break;
      case "petals":
        createPetals(effects, pointerEvent.clientX, pointerEvent.clientY);
        break;
      case "dust":
        createDust(effects, pointerEvent.clientX, pointerEvent.clientY);
        break;
      case "ripples":
        createRipple(effects, pointerEvent.clientX, pointerEvent.clientY);
        break;
      default:
        break;
    }
  });
}

function renderScene(event, selection) {
  const backdrop = document.querySelector("#sceneBackdrop");
  const effects = document.querySelector("#sceneEffects");
  const message = document.querySelector("#eventMessage");
  const oracleBox = document.querySelector("#oracleBox");

  document.body.classList.add("scene-mode");
  document.querySelector(".event-page").classList.add("scene-copy");
  document.querySelector("#categoryText").textContent = event.name;
  document.querySelector("#eventTitle").textContent = selection.itemName;
  message.hidden = true;
  oracleBox.hidden = true;
  backdrop.hidden = false;
  effects.hidden = false;
  backdrop.style.backgroundImage = `url("${getRuntimeUrl(selection.assetPath)}")`;
  backdrop.setAttribute("aria-hidden", "false");
  backdrop.setAttribute("role", "img");
  backdrop.setAttribute("aria-label", selection.alt);
  bindSceneInteraction(selection);
}

function render() {
  document.title = event ? `${APP_NAME} - ${event.name}` : APP_NAME;
  document.querySelector("#categoryText").textContent = event?.category || "새 탭";
  document.querySelector("#eventTitle").textContent = event?.name || "결과 없음";

  const message = document.querySelector("#eventMessage");
  const oracleBox = document.querySelector("#oracleBox");

  if (!event) {
    message.textContent = "결과를 찾지 못했습니다.";
    oracleBox.textContent = "이 페이지는 확장 프로그램 안에서 열렸습니다.";
    return;
  }

  if (event.id === "tab_exile") {
    if (contentSelection) {
      renderScene(event, contentSelection);
      return;
    }

    message.textContent = event.description;
    oracleBox.textContent = "풍경 이미지를 불러오지 못했습니다.";
    return;
  }

  if (event.id === "meaningless_oracle") {
    message.hidden = true;
    oracleBox.textContent = oracleLines[Math.floor(Math.random() * oracleLines.length)];
    return;
  }

  message.textContent = event.description;
  oracleBox.textContent = "결과를 불러왔습니다.";
}

document.querySelector("#closeButton").addEventListener("click", () => {
  window.close();
});

document.addEventListener("keydown", (keyboardEvent) => {
  if (keyboardEvent.key === "Escape") window.close();
});

void initTheme();
render();

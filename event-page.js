import { APP_NAME } from "./src/constants.js";
import { getEventById } from "./src/utils.js";

const params = new URLSearchParams(location.search);
const eventId = params.get("eventId");
const event = getEventById(eventId);

const oracleLines = [
  "오늘의 계시: 버튼은 버튼일 뿐인데, 우리는 또 졌습니다.",
  "위대한 무작위성은 아무 책임도 지지 않습니다.",
  "이 탭은 생산성을 해치지 않습니다. 이미 늦었기 때문입니다.",
  "확률은 차갑고 버튼은 뜨겁습니다.",
  "방금 당신은 작고 의미 없는 역사를 만들었습니다."
];

function setMessageLines(message, lines) {
  message.textContent = "";
  lines.forEach((line) => {
    const lineElement = document.createElement("span");
    lineElement.textContent = line;
    message.append(lineElement);
  });
}

function render() {
  document.title = event ? `${APP_NAME} - ${event.name}` : APP_NAME;
  document.querySelector("#categoryText").textContent = event?.category || "새 탭 이벤트";
  document.querySelector("#eventTitle").textContent = event?.name || "알 수 없는 이벤트";

  const message = document.querySelector("#eventMessage");
  const oracleBox = document.querySelector("#oracleBox");

  if (!event) {
    message.textContent = "이벤트 ID를 찾을 수 없습니다. 버튼의 계보가 살짝 꼬였습니다.";
    oracleBox.textContent = "오류가 발생했지만 적어도 외부 사이트는 열지 않았습니다.";
    return;
  }

  if (event.id === "tab_exile") {
    setMessageLines(message, [
      "당신은 잠시 이 탭으로 유배되었습니다.",
      "형량은 닫기 버튼 한 번입니다."
    ]);
    oracleBox.textContent = "유배 사유: 누르지 말라는 버튼을 눌렀음.";
    return;
  }

  if (event.id === "meaningless_oracle") {
    setMessageLines(message, [
      "무의미하지만 어쩐지 중요한 문장이",
      "도착했습니다."
    ]);
    oracleBox.textContent = oracleLines[Math.floor(Math.random() * oracleLines.length)];
    return;
  }

  message.textContent = event.description;
  oracleBox.textContent = "새 탭 이벤트가 정상적으로 열렸습니다.";
}

document.querySelector("#closeButton").addEventListener("click", () => {
  window.close();
});

render();

export const APP_NAME = "깜짝!";
export const APP_DESCRIPTION = "한 시간마다 한 번씩 열어볼 수 있습니다.";
//export const COOLDOWN_MS = 60 * 60 * 1000;
export const COOLDOWN_MS = 1 * 1000;
export const COOLDOWN_ALARM_NAME = "dopamine_button_cooldown_ready";
export const DEV_UNLOCK_ALL_EVENTS = false;
export const DEV_SHOW_DEBUG_TOOLS = true;

export const NOTIFICATION_TITLE = "다시 열 수 있어요";
export const NOTIFICATION_MESSAGE = "깜짝!이 다시 준비됐습니다.";

export const STORAGE_KEYS = {
  collection: "collection",
  cooldown: "cooldown",
  lastResult: "lastResult",
  contentNoRepeat: "contentNoRepeat",
  contentDrawState: "contentDrawState",
  theme: "theme"
};

export const CATEGORIES = [
  "웹페이지 변화",
  "이미지",
  "새 탭",
  "텍스트",
  "기타",
  "특수 효과"
];

export const RARITY_ORDER = ["Common", "Rare", "Epic", "Legendary", "Mythic"];

export const RARITY_LABELS = {
  Common: "Common",
  Rare: "Rare",
  Epic: "Epic",
  Legendary: "Legendary",
  Mythic: "Mythic"
};

export const RARITY_WEIGHTS = {
  Common: 50,
  Rare: 35,
  Epic: 10,
  Legendary: 4,
  Mythic: 1
};

export function formatProbabilityLabel(probability) {
  return `${probability.toFixed(2).replace(/0$/, "")}%`;
}

const EVENT_DEFINITIONS = [
  {
    id: "spin_world",
    category: "웹페이지 변화",
    name: "빙글빙글",
    fullName: "웹페이지 변화 - 빙글빙글",
    description: "페이지가 한 바퀴 돌았다가 돌아옵니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "browser_quake",
    category: "웹페이지 변화",
    name: "브라우저 지진",
    fullName: "웹페이지 변화 - 브라우저 지진",
    description: "페이지가 잠깐 흔들립니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "color_doom",
    category: "웹페이지 변화",
    name: "색감 뒤집기",
    fullName: "웹페이지 변화 - 색감 뒤집기",
    description: "페이지 색상이 잠깐 반전됩니다.",
    rarity: "Rare",
    target: "page"
  },
  {
    id: "gray_world",
    category: "웹페이지 변화",
    name: "흑백 세상",
    fullName: "웹페이지 변화 - 흑백 세상",
    description: "페이지가 잠깐 흑백으로 변합니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "blur_truth",
    category: "웹페이지 변화",
    name: "액정에 습기가..",
    fullName: "웹페이지 변화 - 액정에 습기가..",
    description: "모든 것이 살짝 흐려집니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "zoom_illusion",
    category: "웹페이지 변화",
    name: "확대 착시",
    fullName: "웹페이지 변화 - 확대 착시",
    description: "페이지가 가까워졌다가 원래 자리로 돌아옵니다.",
    rarity: "Rare",
    target: "page"
  },
  {
    id: "snow_browser",
    category: "웹페이지 변화",
    name: "눈 오는 브라우저",
    fullName: "웹페이지 변화 - 눈 오는 브라우저",
    description: "화면 위로 눈송이가 내려옵니다.",
    rarity: "Rare",
    target: "page"
  },
  {
    id: "rain_browser",
    category: "웹페이지 변화",
    name: "비 오는 브라우저",
    fullName: "웹페이지 변화 - 비 오는 브라우저",
    description: "화면 위로 빗방울이 내려옵니다.",
    rarity: "Rare",
    target: "page"
  },
  {
    id: "sudden_cat",
    category: "이미지",
    name: "발견",
    fullName: "이미지 - 발견",
    description: "동물이나 공룡 하나가 나타납니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "giant_emoji",
    category: "이미지",
    name: "빅 이모지",
    fullName: "이미지 - 빅 이모지",
    description: "큰 이모지가 화면 중앙을 장악합니다.",
    rarity: "Rare",
    target: "page"
  },
  {
    id: "odd_stamp",
    category: "이미지",
    name: "도장 쾅",
    fullName: "이미지 - 도장 쾅",
    description: "화면 아무 데나 도장이 하나 찍힙니다.",
    rarity: "Epic",
    target: "page"
  },
  {
    id: "tab_exile",
    category: "새 탭",
    name: "랜선 여행",
    fullName: "새 탭 - 랜선 여행",
    description: "숲, 바다, 폭포 중 한 곳이 새 탭에서 열립니다.",
    rarity: "Rare",
    target: "tab"
  },
  {
    id: "meaningless_oracle",
    category: "새 탭",
    name: "오늘의 한마디",
    fullName: "새 탭 - 오늘의 한마디",
    description: "새 탭에 문장 하나가 표시됩니다.",
    rarity: "Epic",
    target: "tab"
  },
  {
    id: "tone_pollution",
    category: "텍스트",
    name: "누구세요?",
    fullName: "텍스트 - 누구세요?",
    description: "페이지 일부 문장이 바뀝니다. 새로고침하면 돌아옵니다.",
    rarity: "Epic",
    target: "page"
  },
  {
    id: "button_mockery",
    category: "텍스트",
    name: "포춘 쿠키",
    fullName: "텍스트 - 포춘 쿠키",
    description: "화면 중앙에 문장 하나가 나타납니다.",
    rarity: "Rare",
    target: "page"
  },
  {
    id: "nothing_happened",
    category: "기타",
    name: "Nothing",
    fullName: "기타 - Nothing",
    description: "정말 아무 일도 일어나지 않습니다.",
    rarity: "Legendary",
    target: "page"
  },
  {
    id: "delayed_disaster",
    category: "기타",
    name: "늦게 온 선물",
    fullName: "기타 - 늦게 온 선물",
    description: "몇 초 뒤에 효과가 시작됩니다.",
    rarity: "Legendary",
    target: "page"
  },
  {
    id: "button_judgement",
    category: "특수 효과",
    name: "한꺼번에",
    fullName: "특수 효과 - 한꺼번에",
    description: "여러 효과가 한 번에 실행됩니다.",
    rarity: "Mythic",
    target: "page"
  }
];

const RARITY_EVENT_COUNTS = EVENT_DEFINITIONS.reduce((counts, event) => {
  counts[event.rarity] = (counts[event.rarity] || 0) + 1;
  return counts;
}, {});

export const EVENTS = EVENT_DEFINITIONS.map((event) => {
  const probability = RARITY_WEIGHTS[event.rarity]
    / RARITY_EVENT_COUNTS[event.rarity];

  return {
    ...event,
    weight: probability,
    probability,
    probabilityLabel: formatProbabilityLabel(probability)
  };
});

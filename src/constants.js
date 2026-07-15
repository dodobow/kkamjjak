export const APP_NAME = "도파민 버튼";
export const APP_DESCRIPTION = "오늘은 어떤 작은 우연을 만나게 될까요?";
//export const COOLDOWN_MS = 60 * 60 * 1000;
export const COOLDOWN_MS = 1 * 1000;
export const COOLDOWN_ALARM_NAME = "dopamine_button_cooldown_ready";
export const DEV_UNLOCK_ALL_EVENTS = false;
export const DEV_SHOW_DEBUG_TOOLS = true;

export const NOTIFICATION_TITLE = "다음 한 장이 준비됐어요";
export const NOTIFICATION_MESSAGE =
  "호기심이 이끄는 대로, 새로운 장면을 열어 보세요.";

export const STORAGE_KEYS = {
  collection: "collection",
  cooldown: "cooldown",
  lastResult: "lastResult",
  theme: "theme"
};

export const CATEGORIES = [
  "웹페이지 변화",
  "이미지",
  "사운드",
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
    description: "현재 페이지가 잠깐 회전합니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "browser_quake",
    category: "웹페이지 변화",
    name: "브라우저 지진",
    fullName: "웹페이지 변화 - 브라우저 지진",
    description: "페이지가 몇 초 동안 덜덜 흔들립니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "color_doom",
    category: "웹페이지 변화",
    name: "색감 뒤집기",
    fullName: "웹페이지 변화 - 색감 뒤집기",
    description: "화면의 색감이 잠깐 뒤집혀 새로운 분위기를 만듭니다.",
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
    name: "흐릿한 진실",
    fullName: "웹페이지 변화 - 흐릿한 진실",
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
    description: "무언가가 화면에 나타납니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "giant_emoji",
    category: "이미지",
    name: "거대 이모지 습격",
    fullName: "이미지 - 거대 이모지 습격",
    description: "큰 이모지가 화면 중앙을 장악합니다.",
    rarity: "Rare",
    target: "page"
  },
  {
    id: "odd_stamp",
    category: "이미지",
    name: "수상한 표식",
    fullName: "이미지 - 수상한 표식",
    description: "정체를 알 수 없는 도장이 화면에 찍힙니다.",
    rarity: "Epic",
    target: "page"
  },
  {
    id: "mystery_sound",
    category: "사운드",
    name: "정체불명의 효과음",
    fullName: "사운드 - 정체불명의 효과음",
    description: "외부 파일 없이 짧고 낯선 효과음이 재생됩니다.",
    rarity: "Common",
    target: "page"
  },
  {
    id: "failed_fanfare",
    category: "사운드",
    name: "삐끗한 팡파르",
    fullName: "사운드 - 삐끗한 팡파르",
    description: "조금 삐끗하지만 기분 좋은 팡파르가 울립니다.",
    rarity: "Epic",
    target: "page"
  },
  {
    id: "tab_exile",
    category: "새 탭",
    name: "작은 외출",
    fullName: "새 탭 - 작은 외출",
    description: "확장프로그램 내부의 작은 랜덤 탭으로 잠시 초대합니다.",
    rarity: "Rare",
    target: "tab"
  },
  {
    id: "meaningless_oracle",
    category: "새 탭",
    name: "오늘의 한마디",
    fullName: "새 탭 - 오늘의 한마디",
    description: "새 탭에서 오늘의 엉뚱한 한마디를 보여줍니다.",
    rarity: "Epic",
    target: "tab"
  },
  {
    id: "tone_pollution",
    category: "텍스트",
    name: "말투 바꾸기",
    fullName: "텍스트 - 말투 바꾸기",
    description: "현재 페이지의 일부 문장에 엉뚱한 한마디가 더해집니다. 새로고침하면 복구됩니다.",
    rarity: "Epic",
    target: "page"
  },
  {
    id: "button_mockery",
    category: "텍스트",
    name: "버튼의 한마디",
    fullName: "텍스트 - 버튼의 한마디",
    description: "버튼이 사용자의 호기심에 짧은 답장을 보냅니다.",
    rarity: "Rare",
    target: "page"
  },
  {
    id: "nothing_happened",
    category: "기타",
    name: "Nothing",
    fullName: "기타 - Nothing",
    description: "아무 일도 일어나지 않은 듯합니다. 다음 한 장은 다를지도 모릅니다.",
    rarity: "Legendary",
    target: "page"
  },
  {
    id: "delayed_disaster",
    category: "기타",
    name: "늦게 온 선물",
    fullName: "기타 - 늦게 온 선물",
    description: "처음에는 조용하다가 몇 초 뒤 작은 깜짝 장면이 도착합니다.",
    rarity: "Legendary",
    target: "page"
  },
  {
    id: "button_judgement",
    category: "특수 효과",
    name: "버튼의 선택",
    fullName: "특수 효과 - 버튼의 선택",
    description: "화면 전체에 버튼이 고른 특별한 장면이 펼쳐집니다.",
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

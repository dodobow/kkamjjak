export const APP_NAME = "도파민 버튼";
export const APP_DESCRIPTION = "누르면 무슨 일이 일어날지 모릅니다.";
//export const COOLDOWN_MS = 60 * 60 * 1000;
export const COOLDOWN_MS = 1 * 1000;
export const COOLDOWN_ALARM_NAME = "dopamine_button_cooldown_ready";
export const DEV_UNLOCK_ALL_EVENTS = false;
export const DEV_SHOW_DEBUG_TOOLS = true;

export const NOTIFICATION_TITLE = "도파민 충전 완료";
export const NOTIFICATION_MESSAGE =
  "다시 누를 준비가 끝났습니다. 현명한 선택은 아니겠지만요.";

export const STORAGE_KEYS = {
  collection: "collection",
  cooldown: "cooldown",
  lastResult: "lastResult"
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

export const EVENTS = [
  {
    id: "spin_world",
    category: "웹페이지 변화",
    name: "빙글빙글",
    fullName: "웹페이지 변화 - 빙글빙글",
    description: "현재 페이지가 잠깐 회전합니다.",
    rarity: "Common",
    weight: 90,
    probabilityLabel: "9.0%",
    target: "page"
  },
  {
    id: "browser_quake",
    category: "웹페이지 변화",
    name: "브라우저 지진",
    fullName: "웹페이지 변화 - 브라우저 지진",
    description: "페이지가 몇 초 동안 덜덜 흔들립니다.",
    rarity: "Common",
    weight: 90,
    probabilityLabel: "9.0%",
    target: "page"
  },
  {
    id: "color_doom",
    category: "웹페이지 변화",
    name: "색감 멸망",
    fullName: "웹페이지 변화 - 색감 멸망",
    description: "화면 색상이 잠깐 반전됩니다.",
    rarity: "Rare",
    weight: 60,
    probabilityLabel: "6.0%",
    target: "page"
  },
  {
    id: "gray_world",
    category: "웹페이지 변화",
    name: "흑백 세상",
    fullName: "웹페이지 변화 - 흑백 세상",
    description: "페이지가 잠깐 흑백으로 변합니다.",
    rarity: "Common",
    weight: 80,
    probabilityLabel: "8.0%",
    target: "page"
  },
  {
    id: "blur_truth",
    category: "웹페이지 변화",
    name: "흐릿한 진실",
    fullName: "웹페이지 변화 - 흐릿한 진실",
    description: "모든 것이 살짝 흐려집니다.",
    rarity: "Common",
    weight: 80,
    probabilityLabel: "8.0%",
    target: "page"
  },
  {
    id: "zoom_illusion",
    category: "웹페이지 변화",
    name: "확대 착시",
    fullName: "웹페이지 변화 - 확대 착시",
    description: "페이지가 커졌다가 아무 일 없던 척 돌아옵니다.",
    rarity: "Rare",
    weight: 60,
    probabilityLabel: "6.0%",
    target: "page"
  },
  {
    id: "snow_browser",
    category: "웹페이지 변화",
    name: "눈 오는 브라우저",
    fullName: "웹페이지 변화 - 눈 오는 브라우저",
    description: "화면 위로 눈송이가 내려옵니다.",
    rarity: "Rare",
    weight: 50,
    probabilityLabel: "5.0%",
    target: "page"
  },
  {
    id: "rain_browser",
    category: "웹페이지 변화",
    name: "비 오는 브라우저",
    fullName: "웹페이지 변화 - 비 오는 브라우저",
    description: "화면 위로 빗방울이 내려옵니다.",
    rarity: "Rare",
    weight: 50,
    probabilityLabel: "5.0%",
    target: "page"
  },
  {
    id: "sudden_cat",
    category: "이미지",
    name: "갑분고양이",
    fullName: "이미지 - 갑분고양이",
    description: "고양이 느낌의 이모지가 나타나 잠깐 시선을 빼앗습니다.",
    rarity: "Common",
    weight: 75,
    probabilityLabel: "7.5%",
    target: "page"
  },
  {
    id: "giant_emoji",
    category: "이미지",
    name: "거대 이모지 습격",
    fullName: "이미지 - 거대 이모지 습격",
    description: "큰 이모지가 화면 중앙을 장악합니다.",
    rarity: "Rare",
    weight: 55,
    probabilityLabel: "5.5%",
    target: "page"
  },
  {
    id: "odd_stamp",
    category: "이미지",
    name: "수상한 표식",
    fullName: "이미지 - 수상한 표식",
    description: "정체를 알 수 없는 도장이 화면에 찍힙니다.",
    rarity: "Epic",
    weight: 30,
    probabilityLabel: "3.0%",
    target: "page"
  },
  {
    id: "mystery_sound",
    category: "사운드",
    name: "정체불명의 효과음",
    fullName: "사운드 - 정체불명의 효과음",
    description: "외부 파일 없이 짧고 이상한 효과음이 재생됩니다.",
    rarity: "Common",
    weight: 70,
    probabilityLabel: "7.0%",
    target: "page"
  },
  {
    id: "failed_fanfare",
    category: "사운드",
    name: "실패한 팡파르",
    fullName: "사운드 - 실패한 팡파르",
    description: "성공한 듯하지만 어딘가 허술한 팡파르가 울립니다.",
    rarity: "Epic",
    weight: 35,
    probabilityLabel: "3.5%",
    target: "page"
  },
  {
    id: "tab_exile",
    category: "새 탭",
    name: "유배",
    fullName: "새 탭 - 유배",
    description: "확장프로그램 내부 새 탭으로 잠시 유배됩니다.",
    rarity: "Rare",
    weight: 45,
    probabilityLabel: "4.5%",
    target: "tab"
  },
  {
    id: "meaningless_oracle",
    category: "새 탭",
    name: "무의미한 계시",
    fullName: "새 탭 - 무의미한 계시",
    description: "새 탭에서 쓸데없이 장엄한 문장을 보여줍니다.",
    rarity: "Epic",
    weight: 30,
    probabilityLabel: "3.0%",
    target: "tab"
  },
  {
    id: "tone_pollution",
    category: "텍스트",
    name: "말투 오염",
    fullName: "텍스트 - 말투 오염",
    description: "현재 페이지의 일부 문장이 이상하게 변합니다. 새로고침하면 복구됩니다.",
    rarity: "Epic",
    weight: 35,
    probabilityLabel: "3.5%",
    target: "page"
  },
  {
    id: "button_mockery",
    category: "텍스트",
    name: "버튼의 조롱",
    fullName: "텍스트 - 버튼의 조롱",
    description: "버튼이 사용자의 선택을 조용히 비웃습니다.",
    rarity: "Rare",
    weight: 55,
    probabilityLabel: "5.5%",
    target: "page"
  },
  {
    id: "nothing_happened",
    category: "기타",
    name: "Nothing",
    fullName: "기타 - Nothing",
    description: "아무 일도 일어나지 않은 것처럼 보입니다. 정말 그럴까요?",
    rarity: "Legendary",
    weight: 10,
    probabilityLabel: "1.0%",
    target: "page"
  },
  {
    id: "delayed_disaster",
    category: "기타",
    name: "지연된 재앙",
    fullName: "기타 - 지연된 재앙",
    description: "처음에는 조용하다가 몇 초 뒤 작게 사고가 납니다.",
    rarity: "Legendary",
    weight: 15,
    probabilityLabel: "1.5%",
    target: "page"
  },
  {
    id: "button_judgement",
    category: "특수 효과",
    name: "버튼의 심판",
    fullName: "특수 효과 - 버튼의 심판",
    description: "화면 전체가 버튼 앞에서 잠깐 심판받습니다.",
    rarity: "Mythic",
    weight: 5,
    probabilityLabel: "0.5%",
    target: "page"
  }
];

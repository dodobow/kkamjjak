export const TMI_ENTRIES = [
  { id: "developer-mbti", text: "개발자의 MBTI는 ENTP입니다." },
  { id: "shiba-name", text: "시바견은 이름과 달리 욕설을 하지 않습니다." },
  { id: "lemon-vitamin-c", text: "레몬 하나에는 레몬 1개 분량의 비타민 C가 들어 있습니다." },
  { id: "venus-day", text: "금성에서는 하루가 1년보다 깁니다." },
  { id: "octopus-hearts", text: "문어는 심장이 세 개입니다." },
  { id: "wombat-cube", text: "웜뱃은 네모난 똥을 쌉니다." },
  { id: "eiffel-temperature", text: "에펠탑의 높이는 기온에 따라 달라집니다." },
  { id: "barn-owl-hearing", text: "가면올빼미는 완전한 어둠 속에서도 소리만으로 먹이의 위치를 찾아낼 수 있습니다." },
  { id: "capybara-size", text: "카피바라는 현존하는 설치류 중 가장 큽니다." },
  { id: "crested-gecko-eyelids", text: "크레스티드 게코는 눈꺼풀이 없어 혀로 눈을 닦습니다." },
  { id: "dog-nose-print", text: "개의 코무늬는 사람의 지문처럼 개체마다 다릅니다." },
  { id: "emperor-penguin", text: "황제펭귄 수컷은 알을 발등 위에 올린 채 약 두 달 동안 품습니다." },
  { id: "fennec-fox-ears", text: "사막여우는 개과 동물 중 몸집에 비해 가장 큰 귀를 가지고 있습니다." },
  { id: "green-sea-turtle-name", text: "푸른바다거북이라는 이름은 등딱지가 아니라 체지방이 녹색인 데서 유래했습니다." },
  { id: "red-panda-thumb", text: "레서판다는 대나무를 잡기 위한 가짜 엄지를 가지고 있습니다." },
  { id: "spinosaurus-length", text: "스피노사우루스는 현재까지 알려진 육식공룡 중 몸길이가 가장 길었습니다." }
];

export function getTmiEntryById(entryId) {
  return TMI_ENTRIES.find((entry) => entry.id === entryId) || null;
}

export function selectTmiEntry(preferredEntryId, random = Math.random) {
  return getTmiEntryById(preferredEntryId)
    || TMI_ENTRIES[Math.floor(random() * TMI_ENTRIES.length)];
}

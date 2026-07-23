# AGENTS.md

## 프로젝트 문서 위치

- `AGENTS.md`: 에이전트가 자동으로 읽는 공통 지침이므로 프로젝트 루트에 유지한다.
- `.agents/skills/`: 프로젝트 전용 skill을 모아 둔다.
- `KANBAN.md`: 프로젝트 전반을 지휘하며 사용자와 에이전트가 함께 보는 작업 보드이므로 프로젝트 루트에 유지한다.

## 프로젝트 기본 규칙

이 프로젝트는 순수 HTML, CSS, JavaScript 프로젝트다.

- React, Vue, Svelte, Next.js, Tailwind, Bootstrap, shadcn, Radix, GSAP, Motion 같은 프레임워크나 라이브러리를 새로 추가하지 마라.
- 기존 HTML 구조, CSS 파일, JS 파일을 최대한 유지하면서 수정해라.
- 기능 변경이 목적이 아니면 JavaScript 로직은 건드리지 마라.
- UI 수정은 가능한 한 CSS 파일 중심으로 처리해라.
- HTML은 시맨틱 구조 개선이 필요할 때만 최소 수정해라.
- 외부 폰트, 아이콘, 이미지 CDN을 추가하기 전에 반드시 이유를 설명하고 확인을 받아라.
- 모든 변경은 작은 단위로 하라.
- 한 번에 전체를 갈아엎지 말고, 먼저 진단한 뒤 수정 계획을 제시하라.

## 디자인 목표

AI가 만든 것 같은 흔한 UI 느낌을 제거하고, 사람이 정리한 듯한 차분하고 실용적인 웹앱 UI를 유지한다.

피해야 할 것:

- 보라색/파란색 AI 그라데이션
- 네온 글로우
- 과한 glassmorphism
- 의미 없는 빛나는 카드
- 똑같은 3열 카드 레이아웃
- 이모지 남발
- 둥근 pill 버튼 남발
- `Elevate`, `Seamless`, `Unleash`, `Next-gen`, `Game-changer` 같은 AI 마케팅 문구
- Lorem Ipsum, Acme, John Doe 같은 가짜 placeholder
- 필요 없는 애니메이션
- 너무 큰 그림자
- 모든 섹션이 중앙 정렬된 구조

선호하는 것:

- 명확한 정보 위계
- 일관된 여백
- 한 가지 accent color
- 한 가지 border-radius 규칙
- 얇고 절제된 border
- 무거운 shadow보다 배경색, 선, 여백으로 구분
- 읽기 쉬운 한글 문구
- hover, active, focus-visible 상태가 있는 버튼
- 모바일에서도 깨지지 않는 반응형 구조

## 순수 HTML/CSS/JS 구현 규칙

- CSS 변수(`:root`)로 색상, 여백, radius, shadow를 관리해라.
- 중복 스타일은 class로 정리해라.
- `!important`는 쓰지 마라.
- `px`만 남발하지 말고 `rem`, `%`, `max-width`, `clamp()`를 적절히 사용해라.
- `height: 100vh` 대신 필요한 경우 `min-height: 100dvh`를 사용해라.
- 복잡한 다단 레이아웃은 flex보다 CSS Grid를 우선 고려해라.
- 버튼, input, card, section 간 radius와 border 스타일을 통일해라.
- 접근성을 위해 focus-visible 상태를 반드시 유지해라.

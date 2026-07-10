---
name: vanilla-anti-ai-ui
description: 순수 HTML/CSS/JavaScript 프로젝트의 UI에서 흔한 AI 느낌을 제거하고, 기존 기능을 보존하면서 차분하고 실용적인 디자인으로 정리할 때 사용한다. React, Tailwind, 프레임워크, 새 라이브러리를 추가하지 않는다.
---

# Vanilla Anti-AI UI Skill

## 목적

순수 HTML/CSS/JavaScript 프로젝트의 UI를 개선한다.

목표는 "화려한 랜딩페이지"가 아니라, 실제 사람이 정리한 듯한 믿을 만한 웹앱 UI다.

기존 기능, 파일 구조, DOM 구조를 최대한 유지한다.  
프레임워크, 빌드 도구, 외부 UI 라이브러리를 추가하지 않는다.

## 작업 순서

항상 아래 순서로 진행한다.

1. 현재 파일 구조를 확인한다.
2. `index.html`, 주요 HTML 파일, CSS 파일, JS 파일을 읽는다.
3. UI에서 AI스러워 보이는 패턴을 목록화한다.
4. 기능을 건드리지 않는 수정 계획을 먼저 제시한다.
5. 사용자가 구현을 요청하면 작은 단위로 수정한다.
6. 수정 후 어떤 파일을 왜 바꿨는지 요약한다.

## 절대 금지

- React, Vue, Svelte, Next.js, Tailwind, Bootstrap, shadcn, Radix, GSAP, Motion 추가 금지
- npm 패키지 추가 금지
- 기존 JS 로직 대규모 재작성 금지
- 화면 전체를 새로 갈아엎기 금지
- 의미 없는 hero section 추가 금지
- AI 보라/파랑 그라데이션 금지
- 네온 glow, blur blob, mesh gradient 남발 금지
- glassmorphism 카드 남발 금지
- 똑같은 3열 카드 레이아웃 반복 금지
- 이모지 남발 금지
- `Lorem Ipsum`, `John Doe`, `Acme Corp` 금지
- `Elevate`, `Seamless`, `Unleash`, `Next-gen`, `Game-changer`, `Delve` 같은 AI 카피 금지
- 의미 없는 숫자 지표, fake metric 추가 금지
- `!important` 남발 금지
- hover/focus 제거 금지
- 접근성에 필요한 label, alt, button 의미 제거 금지

## 디자인 방향

선호하는 스타일:

- 조용한 미니멀 웹앱
- 명확한 정보 위계
- 중립적인 배경
- 한 가지 accent color
- 일관된 border radius
- 얇은 border
- 절제된 shadow
- 읽기 쉬운 한글 문구
- 충분한 여백
- 명확한 버튼 상태
- 모바일 대응이 되는 레이아웃

## CSS 설계 규칙

가능하면 `:root`에 디자인 토큰을 만든다.

예시:

```css
:root {
  --color-bg: #f7f7f5;
  --color-surface: #ffffff;
  --color-text: #1f2328;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-accent: #2563eb;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 10px 30px rgba(15, 23, 42, 0.08);

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}
```

규칙:

- 색상은 CSS 변수로 통일한다.
- radius scale은 2~3개만 사용한다.
- shadow는 약하게 사용한다.
- card는 border + background 중심으로 표현한다.
- 버튼은 hover, active, focus-visible 상태를 가진다.
- 레이아웃은 `max-width`와 `margin: 0 auto`로 폭을 제어한다.
- 복잡한 카드 배열은 CSS Grid를 사용한다.
- 모바일 breakpoint를 반드시 고려한다.

## HTML 규칙

- 의미 없는 div 남발을 줄인다.
- 가능한 경우 `header`, `main`, `section`, `nav`, `footer`, `button`, `form`, `label`을 사용한다.
- 클릭 가능한 요소는 `div`가 아니라 `button` 또는 `a`로 만든다.
- 이미지가 의미를 가지면 alt를 작성한다.
- 폼 input은 placeholder만 쓰지 말고 label을 둔다.

## JavaScript 규칙

- UI 디자인 수정이 목적이면 JS 로직은 최소 수정한다.
- class 토글, aria-expanded, disabled 상태처럼 UI 상태에 필요한 부분만 수정한다.
- 기존 함수명, 이벤트 흐름, 데이터 구조를 보존한다.
- 불필요한 애니메이션 로직을 추가하지 않는다.

## 감사 체크리스트

수정 전후로 아래를 확인한다.

- 보라/파랑 AI 그라데이션이 제거되었는가?
- 카드가 전부 똑같은 border + shadow + white box 패턴은 아닌가?
- 버튼 텍스트 대비가 충분한가?
- hover, active, focus-visible 상태가 있는가?
- 모바일에서 nav, card, form이 깨지지 않는가?
- radius와 accent color가 일관적인가?
- 문구가 과장된 AI 마케팅 말투가 아닌가?
- JS 기능이 기존과 동일하게 동작하는가?
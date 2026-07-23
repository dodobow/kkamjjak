# 깜짝!

서비스 이름은 `깜짝!`입니다. 코드에서는 `src/constants.js`의 `APP_NAME`을 중심으로 이름을 관리합니다.

## 프로젝트 소개

한 시간마다 버튼을 한 번 열어 16개 결과 중 하나를 확인하는 Manifest V3 확장프로그램입니다. 결과는 현재 페이지 또는 확장프로그램 내부 새 탭에서 실행됩니다.

## 주요 기능

- 팝업의 메인 버튼으로 가중치 기반 랜덤 이벤트 실행
- 16개 이벤트 도감 수집, 카테고리별 진행률 및 정렬 기능
- 발견한 결과를 도감에서 다시 실행
- 하위 종류가 있는 현상의 미발견 우선·회차별 중복 방지
- 기본 1시간 쿨타임과 종료 브라우저 알림
- 팝업, 도감, 새 탭 화면에 동기화되는 라이트/다크 모드
- 외부 네트워크 요청이나 CDN 없이 동작

## 설치 및 실행 방법

### Chrome

1. Chrome에서 `chrome://extensions` 접속
2. 개발자 모드 활성화
3. `압축해제된 확장 프로그램 로드` 클릭
4. 이 프로젝트 폴더 선택
5. 확장프로그램 아이콘 클릭

### 네이버 Whale

1. Whale에서 `whale://extensions` 접속
2. 개발자 모드 활성화
3. `압축해제된 확장앱 설치` 또는 비슷한 로드 버튼 클릭
4. 이 프로젝트 폴더 선택
5. 확장프로그램 아이콘 클릭

## 사용 방법

팝업에서 `열어보기`를 누르면 무작위 결과가 실행됩니다. 결과가 정상 실행되면 도감에 기록되고 1시간 쿨타임이 시작됩니다. `도감 보기`에서 발견한 결과를 확인하고 다시 실행할 수 있습니다. 도감 재생에는 쿨타임이 적용되지 않습니다.

## 파일 구조

```txt
manifest.json                 확장프로그램 설정
AGENTS.md                     에이전트 공통 지침
README.md                     프로젝트 안내
docs/KANBAN.md                공유 작업 보드
.agents/skills/               프로젝트 전용 에이전트 skill
pages/popup/                  확장프로그램 팝업 화면
pages/collection/             도감 화면
pages/event/                  새 탭 현상 화면
src/background.js             확장프로그램 service worker
src/                          공통 기능과 데이터 모듈
styles/tokens.css             공통 디자인 토큰
assets/icons/                 확장프로그램 아이콘
assets/images/discoveries/    발견 이미지
assets/images/scenes/         랜선 여행 이미지
tests/                        Node 기반 자동 테스트
```

## 쿨타임 정책

메인 버튼은 기본 1시간 쿨타임을 가집니다. 쿨타임은 `chrome.storage.local`에 `nextAvailableAt`으로 저장되고, `chrome.alarms`로 종료 알림을 예약합니다. 알림은 `src/background.js`의 service worker에서 `chrome.notifications.create()`로 표시합니다.

개발 중에는 `src/constants.js`의 아래 값을 10초로 바꾸면 테스트가 쉽습니다.

```js
export const COOLDOWN_MS = 10 * 1000;
```

16개 이벤트를 모두 확률로 뽑아 확인하지 않아도 됩니다. 도감 페이지를 `pages/collection/index.html?debug=1`로 열면 숨겨진 개발자 테스트 패널이 나타나며, 모든 현상 해금 저장, 도감 초기화, 쿨타임 초기화를 실행할 수 있습니다.

도감에서 `다시 보기`로 페이지 효과를 확인하려면 일반 웹페이지에서 확장프로그램 팝업을 열고 `도감 보기`를 눌러야 합니다. 이때 팝업이 원래 웹 탭의 `targetTabId`를 도감에 넘기므로, 도감 탭이 `chrome-extension://` 또는 `whale-extension://` 주소여도 다시 재생 시 원래 웹 탭으로 자동 전환한 뒤 효과를 보여줍니다.

저장소를 건드리지 않고 도감 화면에서만 전부 해금된 것처럼 보고 싶다면 `src/constants.js`에서 아래 값을 잠시 `true`로 바꾸세요.

```js
export const DEV_UNLOCK_ALL_EVENTS = true;
```

항상 디버그 패널을 보이게 하려면 아래 값을 잠시 `true`로 바꿀 수 있습니다.

```js
export const DEV_SHOW_DEBUG_TOOLS = true;
```

## 도감 저장 방식

도감 데이터는 `chrome.storage.local`에 이벤트 ID별로 저장합니다.

```js
{
  discovered: true,
  firstDiscoveredAt: 1234567890,
  lastDiscoveredAt: 1234567890,
  count: 3,
  subItems: {
    dog: {
      discovered: true,
      firstDiscoveredAt: 1234567890,
      lastDiscoveredAt: 1234567890,
      count: 2,
      lastAssetId: "dog-01"
    }
  }
}
```

종류가 없는 이벤트에는 `subItems`가 생성되지 않습니다. 최근 결과에는 `eventId`와 함께 선택된 `contentItemId`, `contentAssetId`, 발견 여부와 실행 시각을 저장합니다.

## 이벤트 카테고리 구조

이벤트는 `카테고리 - 명칭` 구조를 유지합니다. 카테고리는 `웹페이지 변화`, `이미지`, `새 탭`, `텍스트`, `기타`, `특수 효과`입니다.

등급 확률은 `Common 50%`, `Rare 35%`, `Epic 10%`, `Legendary 4%`, `Mythic 1%`입니다. 같은 등급의 현상은 등급 확률을 `1/N`로 균등하게 나눕니다.

도감에서 하위 종류가 있는 현상마다 `안 나온 거 먼저!`를 설정할 수 있으며 기본값은 활성화입니다. 아직 발견하지 않은 종류를 먼저 뽑고, 전부 발견한 뒤에는 한 회차에 각 종류가 한 번씩 나오도록 후보를 관리합니다. 도감에서는 미발견 종류끼리 상위 현상의 확률을 균등하게 나눠 표시하고 이미 발견한 종류는 `0%`로 표시합니다. 모든 종류를 발견하면 다시 전체 종류에 동일한 확률을 표시합니다. 도감의 다시 보기와 디버그 재생은 후보를 소진하지 않습니다. 설정을 끈 현상은 모든 종류를 매번 `1/N`로 추첨하며 다른 현상의 설정에는 영향을 주지 않습니다.

## 이벤트 16개 목록

| 카테고리 | 이벤트 | 희귀도 | 확률 |
| --- | --- | --- | --- |
| 웹페이지 변화 | 빙글빙글 | Common | 10.0% |
| 웹페이지 변화 | 브라우저 지진 | Common | 10.0% |
| 웹페이지 변화 | 색감 뒤집기 | Rare | 5.83% |
| 웹페이지 변화 | 흑백 세상 | Common | 10.0% |
| 웹페이지 변화 | 액정에 습기가.. | Common | 10.0% |
| 웹페이지 변화 | 확대 착시 | Rare | 5.83% |
| 웹페이지 변화 | 눈 오는 브라우저 | Epic | 5.0% |
| 웹페이지 변화 | 비 오는 브라우저 | Rare | 5.83% |
| 이미지 | 발견 | Common | 10.0% |
| 이미지 | 빅 이모지 | Rare | 5.83% |
| 새 탭 | 랜선 여행 | Epic | 5.0% |
| 새 탭 | 오늘의 TMI | Rare | 5.83% |
| 텍스트 | 포춘 쿠키 | Rare | 5.83% |
| 기타 | Nothing | Legendary | 2.0% |
| 기타 | 늦게 온 선물 | Legendary | 2.0% |
| 특수 효과 | 한꺼번에 | Mythic | 1.0% |

## 권한 설명

- `storage`: 도감, 쿨타임, 최근 결과 저장
- `activeTab`: 사용자가 호출한 현재 탭에 이벤트 실행
- `scripting`: 현재 탭 DOM에 안전한 일시 효과 주입
- `tabs`: 내부 새 탭 이벤트와 도감 페이지 열기
- `notifications`: 쿨타임 종료 알림
- `alarms`: 쿨타임 종료 시각 예약
- `host_permissions` (`http://*/*`, `https://*/*`): 도감에서 일반 웹페이지 탭으로 돌아가 이벤트를 다시 재생할 수 있도록 허용

`<all_urls>`는 사용하지 않습니다. `chrome://`, `whale://`, Chrome Web Store, 확장프로그램 내부 페이지처럼 스크립트 주입이 불가능한 곳에서는 이벤트를 기록하지 않고 안내 메시지를 표시합니다.

## 개발 시 주의사항

- 외부 네트워크 요청을 추가하지 마세요.
- 외부 URL의 이미지, 사운드, CDN을 사용하지 마세요.
- 페이지 DOM을 영구적으로 삭제하지 마세요.
- 이벤트는 몇 초 후 정리되도록 유지하세요.
- 새 탭 이벤트는 반드시 `pages/event/index.html` 같은 확장프로그램 내부 페이지를 열어야 합니다.

## 작업 보드

남은 작업과 우선순위는 [`docs/KANBAN.md`](docs/KANBAN.md)에서 관리합니다.

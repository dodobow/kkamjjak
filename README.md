# 도파민 버튼

현재 서비스명은 임시이며 추후 변경될 수 있습니다. 코드에서는 `src/constants.js`의 `APP_NAME`을 중심으로 앱 이름을 관리합니다.

## 프로젝트 소개

버튼을 누르면 20개 작은 랜덤 장면 중 하나가 현재 페이지 또는 확장프로그램 내부 새 탭에서 열리는 Manifest V3 확장프로그램입니다. 랜덤성, 수집욕, 그리고 가벼운 호기심에 집중했습니다.

## 주요 기능

- 팝업의 메인 버튼으로 가중치 기반 랜덤 이벤트 실행
- 20개 이벤트 도감 수집 및 카테고리별 진행률 표시
- 발견한 이벤트 도감에서 다시 재생
- 기본 1시간 쿨타임과 종료 브라우저 알림
- 팝업, 도감, 새 탭 화면에 동기화되는 라이트/다크 모드
- 외부 서버, 외부 이미지, 외부 사운드, CDN 없이 동작

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

팝업을 열고 `오늘의 한 장 열기` 버튼을 누르면 장면이 열립니다. 장면이 정상 실행되면 도감에 기록되고 1시간 쿨타임이 시작됩니다. `도감 열기`에서 발견한 장면을 확인하고 한 번 더 볼 수 있습니다. 도감 재생에는 쿨타임이 적용되지 않습니다.

## 파일 구조

```txt
manifest.json
styles/tokens.css
popup.html / popup.css / popup.js
collection.html / collection.css / collection.js
event-page.html / event-page.css / event-page.js
background.js
src/constants.js
src/content.js
src/storage.js
src/effects.js
src/theme-init.js / src/theme.js
src/utils.js
assets/images/discoveries/
assets/images/scenes/
assets/icons/icon16.png
assets/icons/icon48.png
assets/icons/icon128.png
```

## 쿨타임 정책

메인 버튼은 기본 1시간 쿨타임을 가집니다. 쿨타임은 `chrome.storage.local`에 `nextAvailableAt`으로 저장되고, `chrome.alarms`로 종료 알림을 예약합니다. 알림은 `background.js`의 service worker에서 `chrome.notifications.create()`로 표시합니다.

개발 중에는 `src/constants.js`의 아래 값을 10초로 바꾸면 테스트가 쉽습니다.

```js
export const COOLDOWN_MS = 10 * 1000;
```

20개 이벤트를 모두 확률로 뽑아 확인하지 않아도 됩니다. 도감 페이지를 `collection.html?debug=1`로 열면 숨겨진 개발자 테스트 패널이 나타나며, 모든 현상 해금 저장, 도감 초기화, 쿨타임 초기화를 실행할 수 있습니다.

도감에서 `한 번 더 보기`로 페이지 효과를 확인하려면 일반 웹페이지에서 확장프로그램 팝업을 열고 `도감 열기`를 눌러야 합니다. 이때 팝업이 원래 웹 탭의 `targetTabId`를 도감에 넘기므로, 도감 탭이 `chrome-extension://` 또는 `whale-extension://` 주소여도 다시 재생 시 원래 웹 탭으로 자동 전환한 뒤 효과를 보여줍니다.

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

하위 항목이 없는 이벤트에는 `subItems`가 생성되지 않습니다. 최근 결과에는 `eventId`와 함께 선택된 `contentItemId`, `contentAssetId`, 발견 여부와 실행 시각을 저장합니다.

## 이벤트 카테고리 구조

이벤트는 `카테고리 - 명칭` 구조를 유지합니다. 카테고리는 `웹페이지 변화`, `이미지`, `사운드`, `새 탭`, `텍스트`, `기타`, `특수 효과`입니다.

등급 확률은 `Common 50%`, `Rare 35%`, `Epic 10%`, `Legendary 4%`, `Mythic 1%`입니다. 같은 등급의 현상은 등급 확률을 `1/N`로 균등하게 나누고, 현상에 하위 항목이 있으면 해당 현상의 확률을 다시 `1/N`로 나눕니다.

## 이벤트 20개 목록

| 카테고리 | 이벤트 | 희귀도 | 확률 |
| --- | --- | --- | --- |
| 웹페이지 변화 | 빙글빙글 | Common | 8.33% |
| 웹페이지 변화 | 브라우저 지진 | Common | 8.33% |
| 웹페이지 변화 | 색감 뒤집기 | Rare | 5.0% |
| 웹페이지 변화 | 흑백 세상 | Common | 8.33% |
| 웹페이지 변화 | 흐릿한 진실 | Common | 8.33% |
| 웹페이지 변화 | 확대 착시 | Rare | 5.0% |
| 웹페이지 변화 | 눈 오는 브라우저 | Rare | 5.0% |
| 웹페이지 변화 | 비 오는 브라우저 | Rare | 5.0% |
| 이미지 | 발견 | Common | 8.33% |
| 이미지 | 거대 이모지 습격 | Rare | 5.0% |
| 이미지 | 수상한 표식 | Epic | 2.5% |
| 사운드 | 정체불명의 효과음 | Common | 8.33% |
| 사운드 | 삐끗한 팡파르 | Epic | 2.5% |
| 새 탭 | 작은 외출 | Rare | 5.0% |
| 새 탭 | 오늘의 한마디 | Epic | 2.5% |
| 텍스트 | 말투 바꾸기 | Epic | 2.5% |
| 텍스트 | 버튼의 한마디 | Rare | 5.0% |
| 기타 | Nothing | Legendary | 2.0% |
| 기타 | 늦게 온 선물 | Legendary | 2.0% |
| 특수 효과 | 버튼의 선택 | Mythic | 1.0% |

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
- 외부 이미지, 사운드, CDN을 사용하지 마세요.
- 페이지 DOM을 영구적으로 삭제하지 마세요.
- 이벤트는 몇 초 후 정리되도록 유지하세요.
- 새 탭 이벤트는 반드시 `event-page.html` 같은 확장프로그램 내부 페이지를 열어야 합니다.

## 향후 개선 아이디어

- 이벤트별 전용 사운드 패턴 추가
- 도감 정렬과 검색
- 희귀도별 색상 테마 강화
- 도감 재생 전 대상 탭 선택 기능
- 이벤트별 재생 횟수와 마지막 재생 시각 별도 저장

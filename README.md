# 깜짝!

**한 시간에 한 번, 뭐가 나올지 모르는 버튼을 눌러보세요.**

`깜짝!`은 인터넷을 둘러보다가 한 시간마다 한 번 눌러볼 수 있는 랜덤 버튼입니다. 화면에 눈이 내리거나 동물 친구가 나타나고, 잠깐 랜선 여행을 떠날 수도 있습니다. 가끔은 정말 아무 일도 일어나지 않습니다.

<p align="center">
  <img src="docs/store/assets/promo/small-promo-440x280.png" width="440" alt="깜짝! 한 시간에 한 번 만나보는 재밌는 현상들">
</p>

## 주요 기능

- 한 시간마다 한 번 누를 수 있는 랜덤 버튼
- Common부터 Mythic까지 다섯 가지 등급으로 나뉜 16개 현상
- 웹페이지 변화, 친구 발견, 랜선 여행, 오늘의 TMI 등 다양한 결과
- 나온 현상과 세부 종류를 기록하고 정렬할 수 있는 도감
- 발견한 현상은 쿨타임 없이 다시 보기
- 라이트 모드와 다크 모드
- 광고, 분석 도구, 외부 데이터 전송 없이 브라우저 안에서만 동작

## 화면 미리보기

| 한 시간마다 한 번 | 지금까지 나온 것들 |
| --- | --- |
| ![깜짝! 확장 프로그램 팝업](docs/store/assets/screenshots/01-popup.png) | ![깜짝! 도감](docs/store/assets/screenshots/02-collection.png) |
| **오늘은 누굴 만날까?** | **잠깐 떠나는 랜선 여행** |
| ![깜짝! 친구 발견 목록](docs/store/assets/screenshots/03-discoveries.png) | ![깜짝! 랜선 여행](docs/store/assets/screenshots/04-random-trip.png) |

## 사용 방법

1. 브라우저 상단에서 `깜짝!` 아이콘을 누릅니다.
2. `열어보기`를 누르면 16개 현상 중 하나가 실행됩니다.
3. 나온 결과는 도감에 자동으로 기록됩니다.
4. 버튼은 한 시간 뒤에 다시 누를 수 있습니다.

도감에서는 발견한 현상과 아직 나오지 않은 현상, 각 등급과 등장 확률을 확인할 수 있습니다. 친구와 랜선 여행 장소처럼 종류가 여러 개인 현상도 하나씩 모을 수 있습니다.

---

## 개발자용 설치

소스에서 직접 실행하려면 저장소를 내려받은 뒤 압축을 풀고 아래 방법으로 불러옵니다. 별도의 빌드나 패키지 설치는 필요하지 않습니다.

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

## 자동 테스트

Node.js가 설치되어 있다면 프로젝트 루트에서 아래 명령으로 테스트를 실행할 수 있습니다.

```powershell
node --test tests\*.test.mjs
```

## 파일 구조

```txt
manifest.json                 확장프로그램 설정
AGENTS.md                     에이전트 공통 지침
README.md                     프로젝트 안내
PRIVACY.md                    개인정보 처리방침
LICENSE                       MIT 라이선스
KANBAN.md                     공유 작업 보드
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
docs/store/                   스토어 등록 문구, 체크리스트와 그래픽 자료
scripts/package-extension.ps1 배포 ZIP 생성 스크립트
```

## 배포 패키지

스토어 업로드용 ZIP은 프로젝트 루트에서 아래 명령으로 생성합니다.

```powershell
.\scripts\package-extension.ps1
```

결과물은 `dist/kkamjjak-<version>.zip`에 생성됩니다. ZIP에는 실행 파일과 MIT 라이선스만 포함되며 `manifest.json`이 최상위에 위치합니다. 스토어 등록 문구와 이미지, 제출 순서는 [`docs/store/SUBMISSION_CHECKLIST.md`](docs/store/SUBMISSION_CHECKLIST.md)를 확인하세요.

## 쿨타임 정책

메인 버튼은 기본 1시간 쿨타임을 가집니다. 쿨타임은 `chrome.storage.local`에 `nextAvailableAt`으로 저장되고, `chrome.alarms`로 종료 알림을 예약합니다. 알림은 `src/background.js`의 service worker에서 `chrome.notifications.create()`로 표시합니다.

개발 중에는 `src/constants.js`의 아래 값을 10초로 바꾸면 테스트가 쉽습니다.

```js
export const COOLDOWN_MS = 10 * 1000;
```

16개 이벤트를 모두 확률로 뽑아 확인하지 않아도 됩니다. `src/constants.js`의 `DEV_SHOW_DEBUG_TOOLS`를 잠시 `true`로 바꾸면 도감에 개발자 테스트 패널이 나타나며, 모든 현상 해금 저장, 도감 초기화, 쿨타임 초기화를 실행할 수 있습니다. 배포 전에는 반드시 다시 `false`로 바꿔야 합니다.

도감에서 `다시 보기`로 페이지 현상을 실행하면 도감을 열 때 기억한 일반 웹페이지 탭을 우선 사용합니다. 해당 탭을 사용할 수 없거나 도감을 직접 연 경우에는 현재 창에서 가장 최근에 사용한 실행 가능한 웹페이지 탭을 선택합니다. 대상 탭으로 전환한 뒤 효과를 재생하므로 도감이 `chrome-extension://` 또는 `whale-extension://` 주소여도 다시 보기가 가능합니다.

저장소를 건드리지 않고 도감 화면에서만 전부 해금된 것처럼 보고 싶다면 `src/constants.js`에서 아래 값을 잠시 `true`로 바꾸세요.

```js
export const DEV_UNLOCK_ALL_EVENTS = true;
```

디버그 패널 설정은 아래와 같습니다.

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
- `scripting`: 일반 웹페이지 DOM에 일시적인 시각 효과 주입
- `notifications`: 쿨타임 종료 알림
- `alarms`: 쿨타임 종료 시각 예약
- `host_permissions` (`http://*/*`, `https://*/*`): 일반 웹페이지에서 현상을 실행하고 도감의 다시 보기를 백그라운드 웹 탭에서 재생

확장프로그램은 현재 탭과 재생 대상 탭이 일반 웹페이지인지 확인할 때 URL을 일시적으로 사용하지만 저장하거나 외부로 전송하지 않습니다. 페이지 내용 역시 수집하거나 전송하지 않습니다. `<all_urls>`는 사용하지 않으며, `chrome://`, `whale://`, Chrome Web Store, 확장프로그램 내부 페이지처럼 스크립트 주입이 불가능한 곳에서는 이벤트를 기록하지 않고 안내 메시지를 표시합니다.

## 개발 시 주의사항

- 외부 네트워크 요청을 추가하지 마세요.
- 외부 URL의 이미지, 사운드, CDN을 사용하지 마세요.
- 페이지 DOM을 영구적으로 삭제하지 마세요.
- 이벤트는 몇 초 후 정리되도록 유지하세요.
- 새 탭 이벤트는 반드시 `pages/event/index.html` 같은 확장프로그램 내부 페이지를 열어야 합니다.

## 작업 보드

남은 작업과 우선순위는 [`KANBAN.md`](KANBAN.md)에서 관리합니다.

## 개인정보 처리방침

개인정보와 로컬 저장 데이터에 관한 내용은 [`PRIVACY.md`](PRIVACY.md)를 확인하세요.

## 라이선스

이 프로젝트는 [MIT License](LICENSE)로 배포됩니다.

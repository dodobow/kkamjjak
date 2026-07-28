# 깜짝! 개발 문서

이 문서는 소스에서 확장 프로그램을 실행하거나 수정하려는 사람을 위한 기술 정보를 모아 둡니다.

## 로컬 설치

별도의 빌드나 패키지 설치는 필요하지 않습니다.

### Chrome

1. `chrome://extensions` 접속
2. 개발자 모드 활성화
3. `압축해제된 확장 프로그램 로드` 클릭
4. 프로젝트 루트 폴더 선택

### 네이버 Whale

1. `whale://extensions` 접속
2. 개발자 모드 활성화
3. `압축해제된 확장앱 설치` 클릭
4. 프로젝트 루트 폴더 선택

## 테스트

Node.js가 설치되어 있다면 프로젝트 루트에서 실행합니다.

```powershell
node --test tests\*.test.mjs
```

## 배포 패키지

```powershell
.\scripts\package-extension.ps1
```

결과물은 `dist/kkamjjak-<version>.zip`에 생성됩니다. ZIP 최상위에는 `manifest.json`이 있으며 개발용 문서는 포함되지 않습니다.

## 주요 구조

```txt
manifest.json                 확장 프로그램 설정
pages/popup/                  확장 프로그램 팝업
pages/collection/             도감
pages/event/                  새 탭 현상
src/background.js             Service Worker
src/                          공통 기능과 데이터
styles/tokens.css             공통 디자인 토큰
assets/icons/                 확장 프로그램 아이콘
assets/images/discoveries/    발견 이미지
assets/images/scenes/         랜선 여행 이미지
tests/                        Node 기반 자동 테스트
docs/store/                   스토어 등록 자료
scripts/package-extension.ps1 배포 ZIP 생성 스크립트
```

## 개발용 설정

쿨타임과 테스트 도구는 `src/constants.js`에서 관리합니다.

- `COOLDOWN_MS`: 기본 1시간
- `DEV_SHOW_DEBUG_TOOLS`: 도감의 개발자 테스트 패널 표시
- `DEV_UNLOCK_ALL_EVENTS`: 저장소를 바꾸지 않고 전체 현상 해금 표시

배포 전에는 두 개발용 플래그가 모두 `false`인지 확인해야 합니다.

## 저장과 추첨

쿨타임, 도감, 최근 결과와 설정은 `chrome.storage.local`에 저장합니다. Common, Rare, Epic, Legendary, Mythic 등급 확률은 각각 `50%`, `35%`, `10%`, `4%`, `1%`이며 같은 등급의 현상은 등급 확률을 균등하게 나눕니다.

하위 종류가 있는 현상은 기본적으로 미발견 종류를 먼저 추첨합니다. 모든 종류를 발견하면 한 회차에 각 종류가 한 번씩 나오도록 후보를 관리합니다.

## 권한

- `storage`: 도감, 쿨타임, 최근 결과와 설정 저장
- `scripting`: 일반 웹페이지에 일시적인 시각 효과 주입
- `notifications`: 쿨타임 종료 알림
- `alarms`: 쿨타임 종료 시각 예약
- `host_permissions`: 일반 웹페이지에서 현상 실행과 다시 보기 지원

확장 프로그램은 페이지 내용이나 URL을 외부로 전송하지 않습니다. `chrome://`, `whale://`, 스토어와 확장 프로그램 내부 페이지처럼 스크립트 주입이 불가능한 곳에서는 현상을 실행하지 않습니다.

## 수정 원칙

- 외부 네트워크 요청, 원격 코드와 CDN을 추가하지 않습니다.
- 페이지 DOM을 영구적으로 삭제하지 않습니다.
- 주입된 현상은 몇 초 뒤 정리되도록 유지합니다.
- 새 탭 현상은 확장 프로그램 내부 페이지를 사용합니다.

남은 작업과 우선순위는 [KANBAN.md](../KANBAN.md)에서 관리합니다.

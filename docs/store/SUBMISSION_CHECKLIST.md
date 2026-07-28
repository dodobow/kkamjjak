# 깜짝! 스토어 등록 체크리스트

## 현재 상태

- Chrome Web Store: 제출 완료, 심사 중
- Whale 스토어: 심사 통과, 출시 완료

## Codex 준비 항목

- [x] Manifest V3, 이름, 설명, 버전 확인
- [x] 16px, 48px, 128px 아이콘 확인
- [x] 한국어 상세 설명과 권한 사유 작성
- [x] 개인정보 처리방침 작성
- [x] 1280 x 800 스크린샷 3~4장 제작
- [x] Chrome용 440 x 280 소형 프로모션 이미지 제작
- [x] 배포 전용 ZIP 생성
- [x] ZIP에서 확장 프로그램 재설치 및 테스트

## 사용자 확인 항목

- [x] 스토어에 표시할 개발자 이름 확정
- [x] 상세 설명과 이미지 최종 확인
- [x] GitHub 저장소를 Public으로 전환
- [x] 개인정보 처리방침과 Issues URL이 로그아웃 상태에서도 열리는지 확인
- [x] Chrome Web Store 개발자 계정과 2단계 인증 준비
- [x] Whale 스토어 개발자 등록

## Chrome Web Store 입력

- [x] `dist/kkamjjak-1.0.0.zip` 업로드
- [x] 기본 언어를 한국어로 선택
- [x] 분류를 Fun 또는 가장 가까운 엔터테인먼트 분류로 선택
- [x] `docs/store/LISTING_KO.md`의 상세 설명 입력
- [x] 128px 아이콘 확인
- [x] 1280 x 800 스크린샷 업로드
- [x] 440 x 280 소형 프로모션 이미지 업로드
- [x] 단일 목적과 권한별 사용 사유 입력
- [x] 원격 코드 사용 안 함 선택
- [x] 데이터 처리 항목이 실제 동작 및 `PRIVACY.md`와 일치하는지 확인
- [x] 개인정보 처리방침 URL 입력
- [x] 배포 지역과 공개 범위 선택
- [x] 미리보기 확인 후 심사 요청

## Whale 스토어 입력

- [x] `dist/kkamjjak-1.0.0.zip` 업로드
- [x] 언어를 한국어로 선택
- [x] 128px PNG 아이콘 업로드
- [x] 1280 x 800 스크린샷 1~4장 업로드
- [x] `docs/store/LISTING_KO.md`의 상세 설명을 평문으로 입력
- [x] 엔터테인먼트에 가장 가까운 분류 선택
- [x] 공개 설정 선택
- [x] 성인용 콘텐츠 포함 안 함 확인
- [x] 미리보기 확인 후 리뷰 요청

## 제출 직전 공통 점검

- [x] `manifest.json` 버전이 1.0.0인지 확인
- [x] 쿨타임이 1시간인지 확인
- [x] 디버그 패널과 전체 해금 설정이 꺼져 있는지 확인
- [x] 팝업, 도감, 다시 보기와 새 탭 현상 점검
- [x] 다크 모드 점검
- [x] 개인정보 처리방침 시행일 확인
- [x] ZIP 최상위에 `manifest.json`이 있는지 확인
- [x] ZIP에 `.git`, `.agents`, `tests`, `docs`와 개발용 파일이 없는지 확인

## 공식 참고 문서

- Chrome 확장 프로그램 준비: https://developer.chrome.com/docs/webstore/prepare
- Chrome 등록 정보: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- Chrome 개인정보 입력: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Whale 스토어 등록: https://developers.whale.naver.com/distribution/
- Whale 심사 가이드: https://developers.whale.naver.com/review_guides/

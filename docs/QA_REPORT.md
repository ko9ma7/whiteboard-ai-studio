# QA Report — v4

## 구조 변경

- 예제 데이터를 여러 파일 묶음으로 흩어 보여주던 방식을 제거하고 `sample-project/` 한 폴더로 통합했습니다.
- `project.json` 안에서 `cueIds`와 `image`를 같은 scene 객체에 배치했습니다.
- 앱에서 폴더 전체 선택, 자동 연결, 장면별 수동 이미지 재연결을 지원합니다.
- Scene Link Strip에서 장면 1·2·3 연결 상태가 데스크톱에서 한눈에 보이도록 했습니다.

## Export 변경

- WebM의 UI 문구에서 `녹화 중`을 제거했습니다.
- WebM 저장 진행률을 0–100%로 표시합니다.
- Animated SVG 현재 장면/전체 프로젝트 export를 추가했습니다.
- GIF 현재 장면/전체 프로젝트 export를 추가했습니다.
- GIF는 외부 런타임 dependency 없이 GIF89a/LZW encoder를 사용합니다.

## Automated checks

`npm test`에서 확인합니다.

- JavaScript syntax
- HTML duplicate IDs
- static DOM ID references
- required build files
- sample project exactly 3 scenes
- each scene has cueIds and mapped image
- SRT cue IDs exist
- mapped image files exist
- reveal regions are inside 1280×720 sample canvas
- GitHub Pages build placeholders are resolved
- Service Worker cache entries exist

## GIF encoder validation

개발 검수 시 encoder가 만든 2-frame GIF를 Pillow로 다시 열어 frame count, loop, frame color 변화를 확인했습니다.

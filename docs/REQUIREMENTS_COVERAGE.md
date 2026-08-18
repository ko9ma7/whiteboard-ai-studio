# Requirements Coverage — v4 delta

| 요구 | 상태 | 구현 |
|---|---|---|
| SRT와 이미지를 한 폴더에서 관리 | 완료 | `project-bundle.js`, `sample-project/` |
| 장면별 연결 관계를 쉽게 확인 | 완료 | `bundleMappingList`, `sceneLinkStrip` |
| 장면 1·2·3 예제 모두 표시 | 완료 | `sample-project/project.json`, 3개 SVG, Scene Link Strip |
| WebM 외 Animated SVG 저장 | 완료 | `exporters.js` |
| GIF 저장 | 완료 | `exporters.js` 내 GIF89a/LZW encoder |
| 저장 시 ‘녹화 중’ 문구 제거 | 완료 | WebM 진행률 UI로 변경 |
| 현재 장면 / 전체 프로젝트 저장 | 완료 | Export dialog 6개 포맷/범위 조합 |
| 예제 구조를 쉽게 복제 | 완료 | `sample-project/README.md`, 루트 README |
| GitHub Pages 정적 실행 | 완료 | server-side dependency 없음 |
| 자동 배포 | 완료 | `.github/workflows/deploy.yml` |
| API key 프론트 노출 방지 | 완료 | optional Worker Gateway 유지 |

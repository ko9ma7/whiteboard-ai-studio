# v5 변경점 — Blueprint-first

- SRT-first 흐름을 **Blueprint-first**로 변경
- 첫 탭을 `AI 설계 / 컴파일`로 변경
- Text / SRT / JSON / SVG / HTML / Image 다중 입력
- API 없이 로컬 기본 설계 생성
- Gateway AI를 통한 구조화 Blueprint 생성
- `whiteboard-blueprint/v1` 스키마 추가
- 동일 Blueprint에서 장면별 SVG + HTML composition 생성
- 장면 narration/duration에서 SRT 자동 파생
- Blueprint → 기존 Studio scene/reveal 데이터 변환
- 브라우저에서 compiled project ZIP 생성
- Whiteboard preset: Ink→Color→Gaze / Grid / Skeleton / Contour wipe / Brush / pause
- 기존 project-folder/SRT-first 방식은 호환 모드로 유지
- sample-project에 `blueprint.json` 추가 및 3장면 SRT/project manifest 재정렬

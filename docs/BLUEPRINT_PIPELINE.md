# Blueprint-first 제작 파이프라인

## 왜 SRT가 기준이 아닌가

SRT는 **자막과 시간**을 표현하기에는 좋지만 화면 레이아웃, 오브젝트, 드로잉 순서, 전환, SVG path, HTML composition 같은 시각 설계를 담기에는 부족합니다.

v5는 `blueprint.json`을 제작의 기준 데이터로 사용합니다.

```text
어떤 입력이든
Text / Markdown / SRT / JSON / SVG / HTML / Images / Folder
        ↓
whiteboard-blueprint/v1
        ↓
┌────────────┬────────────┬─────────────┐
│ SVG scenes │ HTML comps │ Studio data │
└────────────┴────────────┴─────────────┘
        ↓
SRT / Project JSON / GIF / WebM / Animated SVG / HyperFrames
```

## Blueprint 핵심 구조

```json
{
  "format": "whiteboard-blueprint/v1",
  "canvas": { "width": 1280, "height": 720 },
  "style": { "paper": "#F5EBD7", "ink": "#383A36" },
  "scenes": [
    {
      "id": "scene-01",
      "narration": "...",
      "durationMs": 6500,
      "visualMode": "whiteboard",
      "animation": {
        "preset": "ink-color-gaze",
        "inkPath": "grid",
        "colorFill": "contour-wipe"
      },
      "objects": [
        { "id": "subject", "type": "box", "x": 100, "y": 150, "w": 320, "h": 250, "drawOrder": 1 }
      ]
    }
  ]
}
```

## 입력 방식

- **대본/문서**: 문장을 의미 단위 장면으로 나눠 Blueprint 생성
- **SRT**: 기존 자막의 텍스트와 duration을 보존하면서 Blueprint 생성
- **JSON**: 기존 Blueprint를 그대로 다시 편집
- **SVG/HTML**: 화면 마크업을 입력 자료로 삼아 Blueprint를 재구성할 수 있는 출발점
- **이미지 여러 장**: 파일을 함께 불러와 장면 자산으로 활용
- **프로젝트 폴더**: 기존 `project.json + story.srt + images/` 방식도 계속 지원

## 제작 방법

1. **기본값 자동 설계**: API 없이 즉시 장면 초안 생성
2. **AI 설계**: Gateway를 통해 장면 수, visualMode, objects, timing을 JSON으로 생성
3. **SVG 컴파일**: 브라우저에서 즉시 벡터 화면 생성
4. **HTML 컴파일**: HyperFrames식 `data-start`, `data-duration`, `data-track-index`와 paused GSAP timeline을 가진 composition 생성
5. **SRT 파생**: `scenes[].narration + durationMs`에서 자동 생성
6. **Studio 세부조정**: 필요한 경우에만 reveal 영역과 타이밍을 직접 조정

## 장점

- SRT가 없어도 시작 가능
- SVG/HTML을 먼저 만든 뒤 자막을 나중에 생성 가능
- AI가 구조를 만들어주므로 사용자가 좌표와 타임라인을 처음부터 손으로 만들 필요가 적음
- 동일 Blueprint로 여러 출력 포맷을 만들 수 있어 결과가 서로 어긋나는 문제가 줄어듦
- API 없이도 기본값으로 동작하고, API 연결 시 정교한 설계만 AI에게 맡길 수 있음

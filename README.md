# Whiteboard AI Motion Studio v5

GitHub Pages에서 실행되는 **Blueprint-first 화이트보드/모션 제작 웹서비스**입니다.

v5의 핵심은 **SRT를 제작의 출발점으로 강제하지 않는 것**입니다. 사용자가 대본, 기존 SRT, JSON, SVG/HTML, 이미지, 프로젝트 폴더 중 무엇을 가지고 있든 먼저 하나의 `whiteboard-blueprint/v1` 데이터로 통합하고, 그 설계에서 SVG/HTML/Studio/SRT/영상 결과를 파생합니다.

```text
Text / Markdown / SRT / JSON / SVG / HTML / Images / Folder
                         ↓
              whiteboard-blueprint/v1
                         ↓
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
   SVG scenes      HTML compositions    Studio data
       └─────────────────┼─────────────────┘
                         ↓
      SRT / Project JSON / GIF / WebM / Animated SVG / HyperFrames
```

## Preview / 첫 실행

첫 탭은 **AI 설계 / 컴파일**입니다.

1. 입력 자료를 붙여넣거나 여러 파일을 선택합니다.
2. **기본값으로 자동 설계** 또는 **연결된 AI로 정교하게 설계**를 선택합니다.
3. 생성된 Blueprint JSON을 확인합니다.
4. 같은 Blueprint에서 SVG와 HTML composition을 즉시 미리봅니다.
5. 필요하면 **스튜디오로 보내기**로 세부 reveal/timing을 수정합니다.
6. SRT, SVG, HTML, 프로젝트 ZIP, GIF, WebM, HyperFrames 결과로 저장합니다.

## 왜 Blueprint가 기준인가

SRT는 `텍스트 + 시간`에는 적합하지만 화면의 다음 정보를 표현하기 어렵습니다.

- 레이아웃
- 화면 오브젝트
- draw order
- hand path
- Ink → Color → Gaze 방식
- SVG path / mask
- HTML composition
- 장면 전환
- multi-track timing

v5에서는 이런 내용을 Blueprint가 보유하고, SRT는 `scenes[].narration + durationMs`에서 자동 파생할 수 있습니다. 반대로 기존 SRT를 Blueprint 입력으로 사용하는 것도 가능합니다.

자세한 구조: [`docs/BLUEPRINT_PIPELINE.md`](./docs/BLUEPRINT_PIPELINE.md)

## 다양한 시작 방법

### 1. 대본 / 문서

가장 쉬운 방식입니다. 문장을 장면으로 나눈 뒤 레이아웃·오브젝트·duration을 자동 구성합니다.

### 2. 기존 SRT

SRT의 자막 텍스트와 duration을 보존하면서 시각 Blueprint를 추가합니다.

### 3. Blueprint JSON

이전에 작업한 설계를 그대로 다시 열고 수정합니다.

### 4. SVG / HTML

이미 만든 화면을 입력 자료로 사용할 수 있습니다. v5 UI에서는 마크업을 그대로 보관하거나 AI 재설계의 입력으로 사용할 수 있습니다.

### 5. 이미지 여러 장

이미지 파일을 다른 입력과 함께 불러와 장면 자산으로 사용할 수 있습니다.

### 6. 기존 프로젝트 폴더

v4 방식도 유지됩니다.

```text
project-folder/
├─ blueprint.json      # v5 권장: 장면 설계의 기준
├─ project.json        # Studio/폴더 연결용 manifest
├─ story.srt
├─ script.txt
└─ images/
   ├─ scene-01.svg
   ├─ scene-02.svg
   └─ scene-03.svg
```

## Blueprint 기본 스키마

```json
{
  "format": "whiteboard-blueprint/v1",
  "canvas": { "width": 1280, "height": 720 },
  "style": {
    "paper": "#F5EBD7",
    "ink": "#383A36",
    "accent": "#FFA500",
    "allowText": false
  },
  "scenes": [
    {
      "id": "scene-01",
      "title": "입력에서 설계 만들기",
      "narration": "...",
      "durationMs": 6500,
      "visualMode": "whiteboard",
      "animation": {
        "preset": "ink-color-gaze",
        "inkPath": "grid",
        "colorFill": "contour-wipe",
        "pause": "heavy"
      },
      "objects": [
        {
          "id": "subject",
          "type": "box",
          "x": 120,
          "y": 210,
          "w": 310,
          "h": 260,
          "drawOrder": 1
        }
      ]
    }
  ]
}
```

## 쉬운 제작 프리셋

UI에서 복잡한 기술명을 목적 중심 프리셋으로 묶었습니다.

- **손그림 설명** — Ink → Color → Gaze, Grid/Skeleton, Contour wipe/Brush
- **도식 설명** — 박스, 화살표, 단계, mask reveal
- **텍스트 중심** — word pop / kinetic text
- **AI 자동 혼합** — 장면별 적합한 visualMode를 AI가 결정

기본 설계는 API 없이 동작합니다. AI Gateway를 연결하면 같은 스키마의 더 정교한 Blueprint를 생성합니다.

## 컴파일 결과

### SVG

Blueprint의 오브젝트와 style을 브라우저에서 SVG로 생성합니다. 장면별 SVG를 바로 저장할 수 있습니다.

### HTML Composition

장면별 HTML에는 `data-composition-id`, `data-start`, `data-duration`, `data-track-index`와 paused GSAP timeline을 구성하여 HyperFrames식 composition으로 확장하기 쉽게 만들었습니다.

### SRT

각 장면의 `narration`과 `durationMs`에서 자동 파생합니다.

### 프로젝트 ZIP

**프로젝트 ZIP** 버튼은 브라우저에서 다음 구조를 한 번에 생성합니다.

```text
compiled-project.zip
├─ blueprint.json
├─ story.srt
├─ project.json
├─ scenes/
│  ├─ scene-01.svg
│  ├─ scene-02.svg
│  └─ ...
└─ compositions/
   ├─ scene-01.html
   ├─ scene-02.html
   └─ ...
```

따라서 파일을 하나씩 내려받아 다시 연결할 필요가 없습니다.

## Studio 기능

Blueprint로 자동 초안을 만든 뒤 필요한 경우에만 Studio에서 다음을 미세 조정합니다.

- 프로젝트 폴더 전체 불러오기
- SRT 파일/직접 편집
- Scene Link Strip
- 장면별 이미지 연결/교체
- AI 이미지 생성
- 영역 직접 드래그 지정
- reveal 시작/지속/방향/순서
- 현재 장면/전체 프로젝트 재생
- 자막 Burn-in
- JSON / annotation.json / HyperFrames HTML

## 내보내기

- WebM
- Animated SVG
- GIF
- SRT
- Blueprint JSON
- 장면 SVG
- 장면 HTML
- 프로젝트 ZIP
- Studio Project JSON
- HyperFrames HTML

WebM은 내부적으로 MediaRecorder를 사용하지만 UI에는 “녹화 중” 대신 렌더 진행률만 표시합니다.

## Sample Project

`sample-project/`는 3장면 예제이며 Blueprint와 파생 결과의 연결을 같은 폴더에서 확인할 수 있습니다.

```text
sample-project/
├─ blueprint.json
├─ project.json
├─ story.srt
├─ script.txt
└─ images/
   ├─ scene-01.svg
   ├─ scene-02.svg
   └─ scene-03.svg
```

먼저 [`sample-project/blueprint.json`](./sample-project/blueprint.json)을 보고, 이후 `story.srt`와 `project.json`을 비교하면 데이터 흐름을 이해하기 쉽습니다.

## AI Gateway

GitHub Pages 코드에는 OpenAI / Gemini / Anthropic / xAI 비밀 키를 넣지 않습니다.

```text
GitHub Pages
      │
      ▼
Cloudflare Worker Gateway
      ├─ OPENAI_API_KEY
      ├─ GEMINI_API_KEY
      ├─ ANTHROPIC_API_KEY
      └─ XAI_API_KEY
```

Gateway 코드는 `worker/`에 있습니다.

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript ES6+
- Canvas 2D
- SVG / HTML composition compiler
- GSAP-compatible generated HTML
- IndexedDB
- MediaRecorder / Canvas Capture Stream
- Native SVG animation
- Built-in GIF89a/LZW encoder
- Browser ZIP writer (store method)
- Service Worker / Web App Manifest
- Cloudflare Worker AI Gateway (optional)

## Project Structure

```text
/
├─ index.html
├─ styles.css
├─ app.js
├─ blueprint-engine.js   # 입력 → Blueprint → SVG/HTML/SRT/ZIP
├─ project-bundle.js     # 기존 폴더 import / SRT↔이미지 연결
├─ exporters.js          # WebM / Animated SVG / GIF
├─ enhancements.js       # autosave / theme / onboarding
├─ site-config.js
│
├─ sample-project/
│  ├─ blueprint.json
│  ├─ project.json
│  ├─ story.srt
│  ├─ script.txt
│  └─ images/
│
├─ worker/
├─ docs/
├─ assets/
├─ scripts/
└─ .github/workflows/deploy.yml
```

## Local Development

```bash
npm install
npm run dev
```

기본 URL:

```text
http://localhost:5173/
```

## Test

```bash
npm test
```

검사 범위:

- JavaScript 문법
- HTML 중복 ID
- JavaScript 정적 DOM ID 참조
- 3장면 sample manifest
- SRT cue ↔ scene mapping
- scene image 존재 여부
- Reveal 영역 범위
- Build 결과 asset 링크
- Service Worker cache 대상

## Build

```bash
npm run build
```

GitHub Pages repository path:

```bash
GITHUB_REPOSITORY=USERNAME/REPOSITORY npm run build
```

## GitHub Pages Deployment

1. 새 GitHub Repository를 만듭니다.
2. 프로젝트 전체를 push합니다.
3. **Settings → Pages → Source → GitHub Actions**를 선택합니다.
4. `main`에 push하면 `.github/workflows/deploy.yml`이 test/build/deploy를 실행합니다.
5. 배포 주소는 보통 다음 형태입니다.

```text
https://USERNAME.github.io/REPOSITORY/
```

## Export Notes

### WebM

Chrome/Edge 계열을 권장합니다. 영상 길이가 길수록 처리 시간이 늘어날 수 있습니다.

### GIF

기본 10fps / 최대 720px을 권장합니다.

### Animated SVG

raster image가 data URL로 포함될 수 있으므로 모든 이미지가 순수 벡터로 변환되는 것은 아닙니다.

## Custom Domain

GitHub Pages Settings에서 custom domain을 설정한 뒤 필요하면 `CNAME`을 추가하세요. `SITE_URL` 환경 변수를 사용하면 canonical / Open Graph / sitemap URL도 원하는 도메인으로 빌드할 수 있습니다.

## License

프로젝트 코드는 `LICENSE`를 확인하세요. 참고 오픈소스는 `ATTRIBUTION.md`에 정리했습니다.

## v6 — Simple First UI

기본 화면에서는 모든 기능을 한꺼번에 보여주지 않습니다. 처음에는 다음 네 가지 시작 방식만 표시됩니다.

1. **설명만으로 만들기** — 원하는 장면을 자연어로 설명하고 로컬 자동설계 또는 외부 AI용 제작 지시서를 생성합니다.
2. **대본 · SRT로 만들기** — 대본/SRT만 넣고 장면을 자동 구성합니다.
3. **이미지 · SVG · HTML로 만들기** — 기존 시각 자료를 장면으로 가져옵니다.
4. **기존 프로젝트 열기** — 프로젝트 폴더/JSON으로 이어서 작업합니다.

선택한 방식에 필요한 입력만 표시되며, Blueprint/API/SRT/Studio의 세부 탭은 **고급 편집**을 열었을 때만 보입니다.

### 외부 AI 사용

`설명만으로 만들기 → 외부 AI에서 만들기`를 선택하면 앱이 현재 장면 설명과 제작 방식에 맞는 **완성형 Blueprint JSON 요청 프롬프트**를 자동 작성합니다. ChatGPT, Gemini, Claude, Grok에 그대로 복사한 뒤 결과 JSON/SVG/HTML을 다시 붙여넣으면 앱이 검증하여 미리보기로 연결합니다.

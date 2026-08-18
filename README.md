# Whiteboard AI Motion Studio v4

GitHub Pages에서 실행되는 브라우저 기반 화이트보드 애니메이션 제작 도구입니다.

**권장 흐름은 하나의 프로젝트 폴더를 통째로 불러오는 방식**입니다.

```text
project-folder/
├─ project.json        # SRT ↔ 장면 ↔ 이미지 연결표
├─ story.srt           # 전체 자막
├─ script.txt          # 원본 대본(선택)
└─ images/
   ├─ scene-01.png
   ├─ scene-02.png
   └─ scene-03.png
```

앱에서 **폴더 통째로 불러오기**를 선택하면 `project.json`을 기준으로 SRT 구간과 장면 이미지를 자동 연결합니다. `project.json`이 없어도 `.srt`와 `scene-01.*`, `scene-02.*` 같은 이미지 이름을 이용해 자동 연결할 수 있습니다.

## Preview

첫 실행 시 `sample-project/`의 3장면 예제를 바로 열 수 있습니다.

- Scene 01: 대본 → SRT
- Scene 02: SRT → 장면 / AI 프롬프트
- Scene 03: 이미지 → Reveal → 플레이 / 저장

스튜디오 상단에는 1·2·3 장면 연결 상태가 한 줄로 표시되고, 왼쪽 **장면 연결** 영역에서 각 SRT 구간에 연결할 이미지를 드롭다운 또는 개별 파일 선택으로 바꿀 수 있습니다.

## Features

### 프로젝트 / SRT

- 프로젝트 폴더 전체 불러오기 (`webkitdirectory`)
- `project.json` 기반 명시적 SRT ↔ 이미지 연결
- manifest가 없을 때 파일명 기반 자동 연결
- SRT 파일 업로드 / 직접 편집
- 대본 → 로컬 SRT 자동 생성
- AI SRT 생성 프롬프트
- Gateway를 통한 AI SRT 생성
- 음성/영상 전사 → SRT
- 장면 자동 분할

### 장면 / 이미지

- 장면 1·2·3 연결 상태를 항상 확인할 수 있는 Scene Link Strip
- 장면별 연결 이미지 드롭다운
- 장면별 직접 이미지 교체
- AI 이미지 생성 결과 즉시 연결
- 이미지 영역 직접 드래그 지정
- Reveal 순서 / 시작 / 지속 / 방향 / 연결 자막 편집

### 재생 / 저장

- 현재 장면 재생
- 전체 프로젝트 연속 재생
- 타임라인 Scrub
- 자막 Burn-in
- **WebM 저장**
- **Animated SVG 저장**
- **GIF 저장**
- 현재 장면 / 전체 프로젝트 각각 저장 가능
- 프로젝트 JSON
- `annotation.json`
- HyperFrames HTML

WebM 저장은 브라우저의 `MediaRecorder`를 내부적으로 사용하지만 사용자 UI에는 **“녹화 중”을 표시하지 않습니다.** 저장 창에는 `내보내는 중 · 0–100%` 진행률만 표시됩니다.

GIF는 별도 외부 라이브러리 없이 포함된 GIF89a encoder로 생성합니다. 기본값은 메모리와 파일 크기를 고려해 10fps / 최대 720px입니다.

Animated SVG는 Reveal 타이밍을 SVG clipPath animation으로 저장합니다. 이미지가 SVG가 아니어도 data URL로 SVG 컨테이너 안에 포함할 수 있습니다.

## sample-project — 먼저 이것부터 보세요

```text
sample-project/
├─ project.json
├─ story.srt
├─ script.txt
└─ images/
   ├─ scene-01.svg
   ├─ scene-02.svg
   └─ scene-03.svg
```

자료를 여러 폴더로 나누지 않았습니다. **예제 하나의 폴더만 보면 연결 관계를 전부 확인할 수 있습니다.**

### project.json의 핵심

```json
{
  "projectName": "sample-whiteboard-3-scenes",
  "srt": "story.srt",
  "scenes": [
    {
      "id": "scene-01",
      "cueIds": [1, 2],
      "image": "images/scene-01.svg",
      "prompt": "...",
      "elements": []
    },
    {
      "id": "scene-02",
      "cueIds": [3, 4],
      "image": "images/scene-02.svg"
    },
    {
      "id": "scene-03",
      "cueIds": [5, 6],
      "image": "images/scene-03.svg"
    }
  ]
}
```

이 구조에서 관계는 단순합니다.

```text
story.srt #1, #2 → scene-01 → images/scene-01.svg
story.srt #3, #4 → scene-02 → images/scene-02.svg
story.srt #5, #6 → scene-03 → images/scene-03.svg
```

## 내 프로젝트 만드는 가장 쉬운 방법

1. `sample-project/` 폴더를 복사합니다.
2. `story.srt`를 내 SRT로 바꿉니다.
3. `images/`에 내 이미지를 넣습니다.
4. `project.json`에서 각 장면의 `cueIds`와 `image` 경로를 수정합니다.
5. 웹앱 → **폴더 통째로 불러오기**에서 해당 폴더를 선택합니다.
6. 왼쪽 **장면 연결** 표에서 매핑을 확인합니다.
7. `▶ 전체`로 확인합니다.
8. **내보내기**에서 WebM / Animated SVG / GIF 중 원하는 형식으로 저장합니다.

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

- HTML5
- CSS3
- Vanilla JavaScript ES6+
- Canvas 2D
- IndexedDB
- MediaRecorder / Canvas Capture Stream
- Native SVG SMIL animation
- Built-in GIF89a/LZW encoder
- Service Worker / Web App Manifest
- Cloudflare Worker (optional AI Gateway)

## Project Structure

```text
/
├─ index.html
├─ styles.css
├─ app.js
├─ project-bundle.js     # 폴더 import / SRT↔이미지 연결
├─ exporters.js          # WebM 외 Animated SVG / GIF
├─ enhancements.js       # autosave / theme / onboarding
├─ site-config.js
│
├─ sample-project/       # 3장면 완성 예제 — 한 폴더에 통합
│  ├─ project.json
│  ├─ story.srt
│  ├─ script.txt
│  └─ images/
│     ├─ scene-01.svg
│     ├─ scene-02.svg
│     └─ scene-03.svg
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

기본 개발 URL:

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
- Build 결과 로컬 asset 링크
- Service Worker cache 대상

## Build

```bash
npm run build
```

결과는 `dist/`에 생성됩니다.

GitHub Pages repository path도 자동 계산합니다.

```bash
GITHUB_REPOSITORY=USERNAME/REPOSITORY npm run build
```

## GitHub Pages Deployment

1. 새 GitHub Repository를 만듭니다.
2. 이 프로젝트 전체를 push합니다.
3. **Settings → Pages → Source → GitHub Actions**를 선택합니다.
4. `main`에 push하면 `.github/workflows/deploy.yml`이 test/build/deploy를 실행합니다.
5. 배포 주소:

```text
https://USERNAME.github.io/REPOSITORY/
```

## Export Notes

### WebM

Chrome/Edge 계열 권장. MediaRecorder가 실시간 타임라인을 처리하므로 영상 길이가 길면 처리 시간도 늘어날 수 있습니다. UI에서는 녹화 상태를 노출하지 않고 렌더 진행률로 표시합니다.

### GIF

GIF는 용량이 급격히 커질 수 있습니다. 기본 10fps / 720px을 권장합니다. 전체 프로젝트가 너무 긴 경우 앱이 메모리 보호를 위해 프레임 수 제한 안내를 표시합니다.

### Animated SVG

브라우저에서 바로 열어 애니메이션을 볼 수 있습니다. SVG 안에 raster image가 data URL로 포함될 수 있으므로 “모든 장면이 순수 벡터로 변환된다”는 의미는 아닙니다. 컨테이너와 애니메이션 타임라인이 SVG 형식으로 저장됩니다.

## Custom Domain

GitHub Pages Settings에서 custom domain을 설정한 뒤 필요하면 `CNAME` 파일을 추가하세요. `SITE_URL` 환경 변수를 사용하면 canonical / Open Graph / sitemap URL도 원하는 도메인으로 빌드할 수 있습니다.

## License

프로젝트 코드는 `LICENSE`를 확인하세요. 참고 오픈소스에 대한 설명은 `ATTRIBUTION.md`에 있습니다.

# Architecture

## Runtime

- **GitHub Pages**: 모든 편집 UI, SRT 파서, Canvas 플레이어, WebM 녹화, 프로젝트 저장
- **IndexedDB**: 대용량 이미지가 들어갈 수 있는 프로젝트 자동저장
- **Cloudflare Worker (선택)**: OpenAI / Gemini / Anthropic / xAI API 키를 Secret으로 보관하고 Provider 응답을 하나의 인터페이스로 정규화
- **HyperFrames (선택)**: Pages가 직접 실행할 수 없는 FFmpeg 기반 MP4 렌더링

## Data flow

```text
Script / Audio
  ↓
SRT Cue[]
  ↓ split
Scene[]
  ├─ prompt
  ├─ imageData / image URL
  └─ Element[]
       ├─ region {x,y,width,height}
       ├─ reveal {startMs,durationMs,direction}
       └─ subtitle / narrativeRole
  ↓
Canvas Player → WebM / annotation.json / HyperFrames HTML
```

## Security boundary

Provider secrets never enter the Pages bundle. The browser stores only the Gateway URL in LocalStorage and an optional gateway token in SessionStorage.

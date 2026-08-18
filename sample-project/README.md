# Sample Project — 3 scenes

이 폴더 하나만 보면 전체 연결 구조를 이해할 수 있습니다.

```text
sample-project/
├─ blueprint.json      # v5 권장: 장면 설계의 단일 기준
├─ project.json        # v4 호환: SRT 구간 ↔ 장면 이미지 ↔ 애니메이션 영역 연결
├─ story.srt           # 전체 자막
├─ script.txt          # 원본 대본(선택)
└─ images/
   ├─ scene-01.svg
   ├─ scene-02.svg
   └─ scene-03.svg
```

## 연결 규칙

`project.json`의 각 `scenes[]` 항목이 연결의 기준입니다.

- `cueIds`: `story.srt`에서 이 장면이 사용하는 자막 번호
- `image`: 해당 장면에 연결할 이미지 파일 경로
- `prompt`: 그 이미지를 AI로 만들 때 사용한/사용할 프롬프트
- `elements`: 이미지 내부에서 순서대로 reveal할 영역과 타이밍

예를 들어 `scene-02`는 `cueIds: [3,4]`와 `images/scene-02.svg`가 한 객체 안에 같이 들어 있습니다. 따라서 여러 JSON을 오가며 관계를 추측할 필요가 없습니다.

## 내 프로젝트로 바꾸기

1. `story.srt`를 내 자막으로 교체합니다.
2. `images/`에 장면 이미지를 넣습니다.
3. `project.json`의 `cueIds`와 `image`만 맞춰줍니다.
4. 웹앱에서 **폴더 통째로 불러오기**를 선택합니다.
5. 연결표에서 장면 1·2·3 이미지가 올바른지 확인하고 재생합니다.

`project.json` 없이도 불러올 수 있습니다. 이 경우 앱이 SRT를 장면으로 나눈 뒤 `scene-01.*`, `scene-02.*` 같은 파일명을 자동 연결합니다.


## v5 권장 흐름

새 프로젝트는 `blueprint.json`을 먼저 보고 시작하는 것을 권장합니다. Blueprint에서 SVG/HTML/Studio 데이터를 만들고, SRT는 `narration + durationMs`를 이용해 파생할 수 있습니다. 기존 `project.json + story.srt + images/` 방식도 호환을 위해 유지됩니다.

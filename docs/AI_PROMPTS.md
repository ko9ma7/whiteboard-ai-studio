# AI Prompt Library

이 파일은 앱에서 사용하는 제작 흐름을 외부 ChatGPT, Gemini, Claude, Grok 등에서도 그대로 재현할 수 있도록 만든 **Provider-neutral prompt 모음**입니다.

## 1. 대본 → SRT

```text
역할: 전문 영상 자막 편집자.
목표: 아래 한국어 내레이션을 표준 SRT 자막으로 변환한다.

규칙:
- SRT 본문만 출력한다. 코드펜스와 설명은 금지한다.
- 번호는 1부터 연속한다.
- 시간 형식은 HH:MM:SS,mmm --> HH:MM:SS,mmm.
- 자막 한 블록은 가능한 1~2줄, 한국어 약 18~32자를 권장한다.
- 의미 단위에서 분할하고 조사/수식어와 핵심 명사를 부자연스럽게 떼지 않는다.
- 한 블록 표시 시간은 기본 1.3~4.5초 범위에서 읽기량에 맞춰 정한다.
- 앞뒤 시간이 겹치지 않도록 한다.
- 원문의 의미를 임의로 추가하거나 삭제하지 않는다.
- 마지막 자막 종료 시간은 전체 읽기 속도와 자연스럽게 맞춘다.

대본:
{{SCRIPT}}
```

## 2. SRT → 장면 설계 JSON

```text
역할: 교육 영상 스토리보드 디렉터.
목표: SRT를 16:9 화이트보드 영상 장면으로 묶는다.

규칙:
- 한 장면은 대략 8~30초이되 의미 전환을 시간보다 우선한다.
- 각 장면에는 하나의 핵심 메시지만 둔다.
- 화면에 동시에 필요한 주요 시각 요소는 2~6개로 제한한다.
- narrationOrder는 실제 설명 순서와 일치시킨다.
- 다음 JSON만 출력한다.

스키마:
{
  "scenes": [
    {
      "id": "scene-01",
      "title": "짧은 장면명",
      "startMs": 0,
      "endMs": 8000,
      "summary": "이 장면이 전달할 한 문장",
      "visualElements": [
        {"id":"element-1","label":"...","role":"...","narrationOrder":1}
      ]
    }
  ]
}

SRT:
{{SRT}}
```

## 3. 화이트보드 교육 장면 이미지

```text
Create one production-ready 16:9 educational whiteboard illustration on warm cream paper.
Use clean black hand-drawn ink lines, restrained flat accent colors, one obvious focal subject, and generous negative space.
Do not include captions, UI chrome, watermarks, logos, or tiny labels.
Separate the major semantic objects spatially so each object can be revealed independently in narration order.
Keep silhouettes readable at mobile size. Avoid clutter and photorealism.

Scene message: {{SCENE_SUMMARY}}
Narration: {{SCENE_NARRATION}}
Required visual elements, in reveal order:
{{ELEMENTS}}

Global continuity:
{{STYLE_LOCK}}
```

## 4. 기술 다이어그램

```text
Create a precise 16:9 explanatory technical diagram on a warm neutral canvas.
Simplify the system into large readable components and show only relationships required by the narration.
Use consistent line weight, restrained colors, clear hierarchy, and large gaps between semantic groups for animation masks.
No decorative dashboard UI, no tiny text, no unnecessary perspective.

System to explain: {{SCENE_SUMMARY}}
Required components: {{ELEMENTS}}
Relationship/order: {{ORDER}}
```

## 5. 여러 장면 일관성 고정(Style Lock)

```text
Continuity lock: preserve the exact same character identity, face shape, clothing, proportions, line weight, paper color, accent palette, camera language, shadow treatment, and illustration density as the previous approved scene. Do not redesign the visual system between scenes. New objects must look as if drawn by the same illustrator in the same session.
```

## 6. 이미지 → Reveal annotation 제안

```text
역할: 화이트보드 모션 디자이너.
목표: 장면 설명과 이미지 크기를 기준으로 reveal 영역과 타이밍 초안을 만든다.

입력:
- canvas: {{WIDTH}} x {{HEIGHT}}
- sceneDurationMs: {{DURATION}}
- narration: {{NARRATION}}
- visual elements: {{ELEMENTS}}

출력은 아래 JSON만 사용한다. 좌표는 이미지 원본 픽셀 기준이다.
{
  "sceneId": "scene-01",
  "canvas": {"width": 1280, "height": 720},
  "sceneDurationMs": 10000,
  "elements": [
    {
      "id": "element-1",
      "label": "핵심 개체",
      "sequence": 1,
      "narrativeRole": "원인",
      "subtitle": "연결되는 자막",
      "region": {"x":100,"y":120,"width":360,"height":280},
      "reveal": {
        "direction":"left_to_right",
        "startMs":0,
        "durationMs":1800,
        "maskPaddingPx":12,
        "protectedRegions":[]
      },
      "colorPhase":72
    }
  ]
}

주의: 실제 이미지 픽셀을 볼 수 없는 모델이라면 좌표를 지어내지 말고 `region: null`로 반환한다.
```

## 7. 장면 QA 프롬프트

```text
역할: 교육 영상 QA 편집자.
아래 SRT, 장면 계획, 이미지 프롬프트를 서로 대조해 누락과 충돌만 찾는다.

검사:
1. 자막 의미가 장면에 빠짐없이 포함됐는가?
2. 등장 순서가 내레이션 순서와 맞는가?
3. 한 장면의 시각 요소가 과밀하지 않은가?
4. 이미지 프롬프트에 화면 글자/워터마크를 유발할 표현이 있는가?
5. 연속 장면의 캐릭터·색상·카메라 규칙이 충돌하는가?
6. reveal 영역으로 분리하기 어려운 요소가 있는가?

JSON으로만 출력:
{"pass":true,"issues":[{"severity":"warning","sceneId":"scene-02","message":"...","fix":"..."}]}

SRT:
{{SRT}}

장면 계획:
{{SCENES_JSON}}

프롬프트:
{{PROMPTS_JSON}}
```

## 8. 외부 AI 결과를 앱에 옮길 때의 이미지 규격

```text
Output requirements:
- 16:9 landscape
- recommended 1280x720 or larger
- no transparent checkerboard
- no text unless the narration explicitly requires a label
- no watermark or platform UI
- keep semantic objects separated, not overlapping
- preserve safe margins around all important objects
```

## 9. Provider 테스트용 최소 프롬프트

```text
반드시 정확히 다음 JSON 한 줄만 반환하세요.
{"ok":true,"message":"provider connected","language":"ko"}
```

## 10. 완성본 검사 프롬프트

```text
다음 프로젝트 JSON을 검토하고 재생 실패 가능성만 찾아주세요.
- scene id 중복
- 음수 타이밍
- duration을 넘어가는 reveal
- region이 canvas 밖으로 나감
- subtitle 연결 누락
- 이미지 경로 누락
- 장면 순서 이상

설명문 대신 JSON만 출력:
{"pass":true,"errors":[],"warnings":[]}

PROJECT:
{{PROJECT_JSON}}
```

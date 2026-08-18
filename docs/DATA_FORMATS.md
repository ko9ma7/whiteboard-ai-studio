# Data Formats v4

## Folder project manifest

권장 입력 형식은 `sample-project/project.json`과 같은 폴더 manifest입니다.

```json
{
  "format": "whiteboard-folder-project/v1",
  "projectName": "my-project",
  "srt": "story.srt",
  "script": "script.txt",
  "scenes": [
    {
      "id": "scene-01",
      "title": "장면 제목",
      "cueIds": [1, 2],
      "image": "images/scene-01.png",
      "prompt": "AI image prompt",
      "elements": []
    }
  ]
}
```

- `srt`: 폴더 안 SRT 파일 상대 경로
- `script`: 원본 대본 상대 경로(선택)
- `cueIds`: SRT 번호 중 이 장면에 포함되는 번호
- `image`: 해당 장면 이미지 상대 경로
- `prompt`: 장면 이미지 생성 프롬프트
- `elements`: Reveal 영역/순서/타이밍

## Runtime project JSON

앱에서 `프로젝트 JSON 저장`을 하면 이미지가 `data:` URL 형태로 포함될 수 있습니다. 폴더 manifest는 사람이 편집하기 쉬운 연결 정의이고, runtime JSON은 브라우저에서 다시 열기 쉬운 완성 상태 저장본입니다.

## Export formats

- `.webm`: Canvas + MediaRecorder 기반 동영상
- `.animated.svg`: SVG clipPath/SMIL 타임라인
- `.gif`: GIF89a + 3-3-2 palette + LZW
- `.annotation.json`: 현재 장면 영역/Reveal 정보
- `.json`: 전체 runtime project
- `-hyperframes.html`: HyperFrames용 HTML composition

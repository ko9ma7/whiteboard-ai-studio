# AI Gateway — Cloudflare Worker

GitHub Pages는 정적 호스팅이므로 Provider API secret을 프론트엔드에 넣지 않습니다. 이 Worker는 Pages와 AI API 사이의 얇은 프록시입니다.

## 지원 경로

- `GET /health`
- `GET /v1/models?provider=openai|gemini|anthropic|xai` — 현재 계정에서 조회 가능한 모델 목록
- `POST /v1/text` — OpenAI, Gemini, Anthropic, xAI
- `POST /v1/image` — OpenAI, Gemini, xAI
- `POST /v1/transcribe` — OpenAI Audio Transcription

## 배포

1. Cloudflare Workers 프로젝트를 준비합니다.
2. `worker.js`를 Worker 엔트리로 사용합니다.
3. `wrangler.toml.example`을 복사해 `wrangler.toml`을 만듭니다.
4. 실제 사용할 Provider key만 Secret으로 등록합니다.

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put XAI_API_KEY
npx wrangler secret put GATEWAY_TOKEN
npx wrangler deploy
```

`ALLOWED_ORIGIN`은 Pages 실제 Origin으로 제한합니다.

```toml
[vars]
ALLOWED_ORIGIN = "https://YOURNAME.github.io"
```

프로젝트 Pages URL이 `/repo/`를 포함해도 브라우저 Origin은 `https://YOURNAME.github.io`입니다.

## 모델 이름이 바뀌는 경우

Studio의 **API 연결 → 모델 새로고침**을 사용하세요. Gateway가 각 Provider의 모델 목록 API를 조회합니다. 기본 모델 문자열은 예시일 뿐이며, 실제 계정/시점에서 노출되는 모델을 우선 사용할 수 있게 설계되어 있습니다.

## 보안

- Provider key는 Worker Secret에만 둡니다.
- `GATEWAY_TOKEN`은 브라우저의 `sessionStorage`에만 저장합니다.
- `ALLOWED_ORIGIN`을 지정합니다.
- 공개 다중 사용자 서비스라면 인증, 사용자별 quota, rate limiting, 비용 상한과 abuse 방어를 추가해야 합니다.
- 업로드 파일은 Gateway가 영구 저장하지 않도록 구현되어 있습니다.

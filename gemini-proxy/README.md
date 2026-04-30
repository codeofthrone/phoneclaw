# Gemini Proxy for PhoneClaw

OpenAI-compatible proxy endpoint for PhoneClaw:

- `POST /v1/chat/completions`
- `GET /health`

Supports 2 backend modes:

1. `apikey` (Gemini REST API)
2. `oauth` (Gemini CLI with OAuth login)

---

## 1) Install

```bash
cd gemini-proxy
npm install
cp .env.example .env
```

---

## 2) Configure `.env`

### A) OAuth mode (你要的)

```env
GEMINI_MODE=oauth
GEMINI_MODEL=gemini-2.5-flash
GEMINI_CLI_PATH=gemini
GEMINI_CLI_TIMEOUT_MS=120000
GEMINI_CLI_USE_MODEL=false
PROXY_BEARER_TOKEN=replace_with_long_random_secret
GEMINI_API_KEY=
```

First-time OAuth login on server machine:

```bash
gemini auth login
# or: gemini login
```

(依你安裝版本，指令名稱可能略有差異。)

### B) API key mode (fallback)

```env
GEMINI_MODE=apikey
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
PROXY_BEARER_TOKEN=replace_with_long_random_secret
```

---

## 3) Run proxy

```bash
npm start
```

Health:

```bash
curl http://localhost:8787/health
```

---

## 4) Android app config

Put these in `local.properties` (repo root) or `~/.gradle/gradle.properties`:

```properties
GEMINI_PROXY_URL=http://10.0.2.2:8787
GEMINI_PROXY_AUTH_TOKEN=replace_with_long_random_secret
```

- Emulator uses `10.0.2.2` to reach host
- Real device: use host LAN IP

---

## 5) Quick test

```bash
curl -s -X POST http://localhost:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer replace_with_long_random_secret' \
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [{"role": "user", "content": "say hello"}],
    "temperature": 0.2,
    "max_tokens": 64
  }'
```

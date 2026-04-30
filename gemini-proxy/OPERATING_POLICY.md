# Gemini Proxy Operating Policy

## Decision: Keep `apikey` fallback mode, but disable by default in normal operation

Date: 2026-04-29
Owner: PhoneClaw integration workstream

### Why

- OAuth (`GEMINI_MODE=oauth`) is the primary path and matches current security/operations preference.
- `apikey` mode is still useful as emergency fallback when:
  - Gemini CLI OAuth is temporarily broken,
  - OAuth session expires during an incident window,
  - CI/automation environment cannot complete interactive OAuth.

### Default policy

- **Default mode:** `oauth`
- **Fallback mode:** `apikey` (manual switch only, incident/maintenance use)
- **Do not keep `GEMINI_API_KEY` in `.env` during normal OAuth operations.**

### Runtime guardrails

1. Production/staging should start proxy with `GEMINI_MODE=oauth`.
2. Only designated maintainers can switch to `apikey` mode.
3. If switched to `apikey`, create an incident note with:
   - switch timestamp,
   - reason,
   - operator,
   - rollback timestamp.
4. Roll back to `oauth` once incident is resolved.

### Config baseline

```env
GEMINI_MODE=oauth
GEMINI_CLI_PATH=gemini
GEMINI_CLI_TIMEOUT_MS=120000
GEMINI_CLI_USE_MODEL=false
GEMINI_API_KEY=
```

### Verification checklist after mode changes

- `curl /health` shows expected `mode`.
- `curl /v1/chat/completions` returns 200 with valid bearer token.
- Wrong bearer token returns 401.
- Android app still reaches proxy endpoint successfully.

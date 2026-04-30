# Gemini Proxy Troubleshooting (OAuth / Model / ADB)

## Scope

This guide covers common failures for:
- OAuth mode (`GEMINI_MODE=oauth`)
- model routing / Gemini CLI behavior
- Android emulator/device connectivity (ADB + proxy reachability)

---

## 1) OAuth failures

### Symptom A: `/v1/chat/completions` returns 500 with `Gemini OAuth CLI execution failed`

Checks:
1. Verify CLI exists:
   ```bash
   which gemini
   gemini --help
   ```
2. Verify login session:
   ```bash
   gemini auth login
   # or: gemini login
   ```
3. Verify direct prompt works:
   ```bash
   gemini -p "say hello"
   ```
4. Restart proxy after login:
   ```bash
   npm start
   ```

Likely cause:
- CLI not installed, login expired, or runtime env conflict.

Fix:
- Re-login and ensure `GEMINI_CLI_PATH` points to the right binary.

---

### Symptom B: OAuth mode works in shell, fails in proxy

Checks:
1. Confirm `.env`:
   ```env
   GEMINI_MODE=oauth
   GEMINI_API_KEY=
   ```
2. Ensure no conflicting env vars in process manager:
   - `GEMINI_API_KEY`
   - `GOOGLE_API_KEY`
   - `GOOGLE_GENAI_API_KEY`

Likely cause:
- stale API key env variables leak into CLI process.

Fix:
- Clear conflicting env vars and restart proxy process.

---

## 2) Model/response issues

### Symptom C: Model mismatch or unexpected routing

Checks:
1. Health check mode/model:
   ```bash
   curl -s http://localhost:8787/health
   ```
2. In OAuth mode, `GEMINI_CLI_USE_MODEL=false` means CLI auto routing.
3. If you need fixed model for debugging, set:
   ```env
   GEMINI_CLI_USE_MODEL=true
   GEMINI_MODEL=gemini-2.5-flash
   ```

Fix:
- Decide auto vs fixed model and keep it consistent with test expectations.

---

### Symptom D: Empty response or timeout

Checks:
1. Increase timeout:
   ```env
   GEMINI_CLI_TIMEOUT_MS=180000
   ```
2. Retry with a short prompt via curl.
3. Check server stderr/log output.

Fix:
- Increase timeout and reduce prompt size for smoke validations.

---

## 3) Proxy auth / 401 behavior

### Symptom E: Always gets 401

Checks:
1. Compare token from request and `.env` `PROXY_BEARER_TOKEN`.
2. Curl sample:
   ```bash
   curl -s -X POST http://localhost:8787/v1/chat/completions \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer <token>' \
     -d '{"messages":[{"role":"user","content":"hello"}]}'
   ```

Fix:
- Correct token in Android config:
  - `GEMINI_PROXY_AUTH_TOKEN`

---

## 4) Android emulator/device connectivity (ADB)

### Symptom F: Emulator cannot reach proxy

Checks:
1. Emulator should use host alias:
   - `GEMINI_PROXY_URL=http://10.0.2.2:8787`
2. Proxy process running locally:
   ```bash
   curl -s http://localhost:8787/health
   ```

Fix:
- Use `10.0.2.2` for emulator, not `localhost`.

---

### Symptom G: Real device cannot reach proxy

Checks:
1. Device and host on same LAN.
2. Use host LAN IP in app config:
   - `http://<host_lan_ip>:8787`
3. Verify adb device list:
   ```bash
   adb devices
   ```

Fix:
- Update `GEMINI_PROXY_URL` to host LAN IP and allow local firewall inbound traffic.

---

## 5) Quick end-to-end smoke commands

```bash
# 1) Health
curl -s http://localhost:8787/health

# 2) Authorized chat
curl -s -X POST http://localhost:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"messages":[{"role":"user","content":"say hello"}]}'

# 3) Unauthorized check (should be 401)
curl -i -s -X POST http://localhost:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer wrong-token' \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

---

## 6) Escalation data to capture

When reporting issues, include:
- `.env` mode-related fields (mask secrets)
- output of `/health`
- failing curl command + HTTP status
- proxy server logs around failure timestamp
- `adb devices` output (for device connectivity issues)

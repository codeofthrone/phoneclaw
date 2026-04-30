# PR Evidence (2026-04-29)

## 1) Proxy health

Command:
```bash
curl -s http://localhost:8787/health
```

Observed:
```json
{"ok":true,"model":"gemini-2.5-flash","mode":"oauth"}
```

## 2) Proxy token verification (401 path)

Wrong token command:
```bash
curl -s -o /tmp/a3_wrong_token_body.json -w '%{http_code}' -X POST http://localhost:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer wrong-token' \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

HTTP status:
```text
401
```

Body:
```json
{"error":"Unauthorized proxy token"}
```

## 3) Proxy success path (authorized)

Authorized command:
```bash
curl -s -o /tmp/a3_right_token_body.json -w '%{http_code}' -X POST http://localhost:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer replace_with_long_random_secret' \
  -d '{"messages":[{"role":"user","content":"say hello in one short line"}]}'
```

HTTP status:
```text
200
```

Body excerpt:
```json
{"id":"gemini-...","choices":[{"message":{"content":"Hello!"}}]}
```

## 4) Pytest collect-only (CI-safe)

Command:
```bash
python3 -m pytest --collect-only -q appium-tests
```

Observed:
```text
5 tests collected
```

Test IDs:
- test_phoneclaw_fixed_scenarios.py::test_scenario_1_launch_and_fixed_prompt_ui
- test_phoneclaw_fixed_scenarios.py::test_scenario_2_switch_model_ui
- test_phoneclaw_fixed_scenarios.py::test_scenario_3_proxy_down_error_path
- test_phoneclaw_smoke.py::test_phoneclaw_launch_smoke
- test_phoneclaw_smoke.py::test_phoneclaw_model_button_present

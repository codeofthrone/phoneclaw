# PhoneClaw Appium tests (pytest)

## Prerequisites

- Appium server + UiAutomator2 driver
- Android device connected via ADB (`adb devices`)
- PhoneClaw app installed on device

## Run

```bash
cd /Users/thortron/source/phoneclaw/appium-tests
python3 -m pip install -r requirements.txt
appium
# in another terminal
python3 -m pytest -q
```

## Optional env vars

```bash
export APPIUM_SERVER_URL=http://127.0.0.1:4723
export ANDROID_UDID=<device_udid>
export PHONECLAW_APP_PACKAGE=com.example.universal
export PHONECLAW_APP_ACTIVITY=com.example.universal.MainActivity
export APPIUM_NO_RESET=true
```

## CI-safe checks (no device required)

```bash
cd /Users/thortron/source/phoneclaw
python3 -m pip install -r appium-tests/requirements.txt
python3 -m py_compile appium-tests/conftest.py appium-tests/test_phoneclaw_smoke.py
python3 -m pytest --collect-only -q appium-tests
```

GitHub Actions workflow: `.github/workflows/appium-smoke-ci.yml`

## Notes

- `test_phoneclaw_launch_smoke.py` is a deterministic smoke baseline.
- Fixed scenarios are in `test_phoneclaw_fixed_scenarios.py` (b1/b2/b3).
- Proxy-down scenario requires intentionally unreachable `GEMINI_PROXY_URL` in test env.
- Add workflow replay tests by scripting explicit taps/inputs and asserting expected UI states.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**PhoneClaw** is an Android automation app that runs on-device workflows using ClawScript (a JavaScript-based DSL). Phones act as personal assistants by automating tasks across apps via Android's Accessibility Service. The repo contains three components: the Android app, a Gemini LLM proxy service, and an Appium test suite.

## Commands

### Android App

```bash
./gradlew assembleDebug              # Build debug APK
./gradlew assembleRelease            # Build release APK
./gradlew testDebugUnitTest          # Run unit tests
./gradlew connectedAndroidTest       # Run instrumented tests (requires device/emulator)
./gradlew lint                       # Lint

# Single test class or method
./gradlew testDebugUnitTest --tests com.example.universal.ExampleUnitTest
./gradlew testDebugUnitTest --tests com.example.universal.ExampleUnitTest.addition_isCorrect
```

### Gemini Proxy (Node.js)

```bash
cd gemini-proxy
npm install
npm start        # Port 8787
npm run dev      # Watch mode
```

### Appium Tests (Python)

```bash
cd appium-tests
pip install -r requirements.txt

# CI-safe checks (no device required)
python -m py_compile conftest.py test_phoneclaw_smoke.py
pytest --collect-only -q

# Run against a device (requires Appium server running separately)
appium &
pytest test_phoneclaw_smoke.py::test_launch_app_smoke -v
pytest test_phoneclaw_fixed_scenarios.py::test_scenario_1_launch_and_fixed_prompt_ui -v
```

## Architecture

### Android App (`app/src/main/java/com/example/universal/`)

The app has three runtime layers:

1. **UI / LLM Layer** — `MainActivity.kt` handles voice input (Android SpeechRecognizer), sends prompts to the Gemini proxy via OkHttp, and executes the returned ClawScript using Mozilla Rhino (embedded JS engine).

2. **Accessibility Layer** — `MyAccessibilityService.kt` performs all actual UI automation: clicks, scrolls, text extraction, and node traversal on the live accessibility tree. Scripts call into this service indirectly through the JS bridge exposed in `MainActivity`.

3. **Vision Layer** — `ScreenCaptureService.kt` runs a background MediaProjection service that provides screenshots. Frames can be sent to Moondream (vision model) for visual grounding.

Key config values are injected at build time via `BuildConfig` fields defined in `app/build.gradle.kts`:
- `MOONDREAM_AUTH` — auth token for the vision model
- `GEMINI_PROXY_URL` — URL of the local Gemini proxy
- `GEMINI_PROXY_AUTH_TOKEN` — bearer token for the proxy

Set these in `local.properties` or `~/.gradle/gradle.properties` before building.

### Gemini Proxy (`gemini-proxy/server.js`)

A thin Express server that exposes an OpenAI-compatible endpoint (`POST /v1/chat/completions`) so the Android app doesn't need to embed Gemini credentials. It supports two modes controlled by `gemini-proxy/.env`:

- **OAuth mode** (`GEMINI_MODE=oauth`): shells out to the `gemini` CLI (assumes user is already authenticated via `gemini auth`).
- **API Key mode** (`GEMINI_MODE=apikey`): calls the Gemini REST API directly with `GEMINI_API_KEY`.

Copy `gemini-proxy/.env.example` to `gemini-proxy/.env` before running. See `gemini-proxy/TROUBLESHOOTING.md` for common issues.

### Appium Tests (`appium-tests/`)

Python/pytest suite using the Appium UiAutomator2 driver. `conftest.py` sets up the device fixture. `test_phoneclaw_smoke.py` covers app launch and basic UI presence. `test_phoneclaw_fixed_scenarios.py` runs deterministic replay scenarios with assertions.

The CI workflow (`.github/workflows/appium-smoke-ci.yml`) only runs the syntax check and `--collect-only` — it does not require a real device.

### ClawScript (`clawscripts/`)

Sample automation scripts for Instagram, TikTok, Twitter, YouTube, and Medium. They use helper functions injected by `MainActivity`: `magicClicker()`, `magicScraper()`, `delay()`, `speakText()`, `schedule()`. These files demonstrate the scripting API available to end users.

### Pipeline Data (`pipeline/`)

CSV files containing Android UI locator candidates, canonical actions, and step-mapping data. Used for training and understanding UI automation patterns — not runtime code.

## Commit Style

Conventional commits: `type(scope): description`  
Scopes in use: `app`, `proxy`, `ci`

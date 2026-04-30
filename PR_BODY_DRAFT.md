## Summary
- Integrate PhoneClaw app with Gemini proxy (OAuth-first, API key fallback policy)
- Remove hardcoded credentials from app code and move to injected config
- Add Appium smoke + fixed scenario test skeletons and CI-safe collect workflow
- Add locator pipeline artifacts for PhoneClaw -> Appium mapping

## Key Changes
- `app/src/main/java/com/example/universal/MainActivity.kt`
- `app/build.gradle.kts`
- `gemini-proxy/*`
- `appium-tests/*`
- `.github/workflows/appium-smoke-ci.yml`
- `pipeline/*`
- `DEVELOPMENT_STATUS_2026-04-29.md`

## Validation Evidence
- Health check: `/health` mode=oauth ok
- 401 check: wrong proxy token -> 401
- Authorized chat completion -> 200
- `python3 -m pytest --collect-only -q appium-tests` -> 5 collected

## Notes
- Physical-device execution remains pending (a1/a4).
- PR evidence file: `PR_EVIDENCE_2026-04-29.md`

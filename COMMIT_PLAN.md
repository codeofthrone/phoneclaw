# Commit Plan (proxy / app / tests)

## Commit 1 — proxy
```bash
git add gemini-proxy .gitignore
git commit -m "feat(proxy): add gemini oauth/apikey proxy, policy, troubleshooting"
```

## Commit 2 — app
```bash
git add app/build.gradle.kts app/src/main/java/com/example/universal/MainActivity.kt gradlew
git commit -m "feat(app): route llm to gemini proxy and externalize auth config"
```

## Commit 3 — tests/ci/pipeline/docs
```bash
git add appium-tests .github/workflows/appium-smoke-ci.yml pipeline DEVELOPMENT_STATUS_2026-04-29.md PR_EVIDENCE_2026-04-29.md
git commit -m "test(ci): add appium smoke scenarios, CI collect checks, and mapping pipeline artifacts"
```

# PhoneClaw 開發進度總結（2026-04-29）

## 本次目標
1. 把 PhoneClaw 的 LLM 呼叫從 OpenRouter 改成 Gemini Proxy
2. 建立可切換的 Gemini Proxy（OAuth / API Key）
3. 移除硬編碼 Moondream Token
4. 建立 Appium 可重現測試骨架
5. 安裝必要開發工具

---

## 已完成項目

### A) Android App 端（PhoneClaw）

#### 1) 新增 BuildConfig 參數
檔案：`app/build.gradle.kts`

- `MOONDREAM_AUTH`
- `GEMINI_PROXY_URL`
- `GEMINI_PROXY_AUTH_TOKEN`

用途：避免把敏感資訊硬編碼在 Kotlin 原始碼。

#### 2) LLM 呼叫改走 Proxy
檔案：`app/src/main/java/com/example/universal/MainActivity.kt`

- 原本：`https://openrouter.ai/api/v1/chat/completions`
- 現在：`BuildConfig.GEMINI_PROXY_URL`（預設 fallback: `http://10.0.2.2:8787`）
- 若有設定 `GEMINI_PROXY_AUTH_TOKEN`，會帶 `Authorization: Bearer <token>`

#### 3) 移除硬編碼 Moondream Token
檔案：`MainActivity.kt`

- `X-Moondream-Auth` 改為 `BuildConfig.MOONDREAM_AUTH`
- 若缺少 token，加入 guard 並安全返回，避免送出錯誤請求

---

### B) Gemini Proxy（新建）
新目錄：`gemini-proxy/`

新增檔案：
- `gemini-proxy/server.js`
- `gemini-proxy/package.json`
- `gemini-proxy/.env.example`
- `gemini-proxy/README.md`

#### 功能
- OpenAI-compatible endpoint：`POST /v1/chat/completions`
- 健康檢查：`GET /health`
- 支援雙模式：
  - `GEMINI_MODE=oauth`（透過 gemini CLI OAuth）
  - `GEMINI_MODE=apikey`（透過 Gemini REST API Key）

#### 已驗證
- OAuth 模式可成功回傳內容（proxy 實測通過）

#### 目前 OAuth 建議設定
`.env`:
- `GEMINI_MODE=oauth`
- `GEMINI_MODEL=gemini-2.5-flash`
- `GEMINI_CLI_USE_MODEL=false`（跟隨 CLI auto model）
- `PROXY_BEARER_TOKEN=<your-secret>`

---

### C) Appium 測試骨架（新建）
新目錄：`appium-tests/`

新增檔案：
- `appium-tests/requirements.txt`
- `appium-tests/conftest.py`
- `appium-tests/test_phoneclaw_smoke.py`
- `appium-tests/README.md`

內容：
- 基礎 driver fixture
- app 啟動 smoke test
- model 按鈕存在檢查

已驗證：
- `pytest --collect-only -q` 可收集 2 個測試

---

## 開發環境安裝狀態
已安裝：
- `openjdk@17`
- `android-platform-tools`（adb）
- `appium`
- `appium-uiautomator2-driver`
- Python: `Appium-Python-Client`, `pytest`

---

## 目前 Git 變更概況
- Modified:
  - `.gitignore`
  - `app/build.gradle.kts`
  - `app/src/main/java/com/example/universal/MainActivity.kt`
  - `gradlew`（執行權限）
- New:
  - `gemini-proxy/`
  - `appium-tests/`

---

## 待續工作（下一步建議）
1. 在真機/模擬器上跑一次 PhoneClaw 端到端（App -> Proxy -> Gemini）
2. 把 `appium-tests` 擴成「固定腳本回放 + 驗證」測試
3. 決定是否保留 `apikey` 模式作緊急 fallback
4. 提交 commit 與 PR，附上本檔作為 changelog

---

## 快速啟動命令（參考）

### 啟動 proxy
```bash
cd /Users/thortron/source/phoneclaw/gemini-proxy
npm start
```

### 檢查 proxy
```bash
curl http://localhost:8787/health
```

### 跑 Appium smoke
```bash
cd /Users/thortron/source/phoneclaw/appium-tests
pytest -q
```

---

## TODO Checklist（可勾選追蹤）

### Sprint A：連線與穩定性
- [x] 實機驗證 PhoneClaw -> Gemini Proxy -> Gemini OAuth 完整成功一次（2026-04-30：實機說話 → proxy 回應 speakText("哈囉哈囉哈囉")，全程 HTTP 200）
- [x] 模擬器驗證同流程（10.0.2.2）**已取消**（2026-04-29：依使用者決策「不需要模擬器」）
- [x] 驗證 `GEMINI_PROXY_AUTH_TOKEN` 錯誤時回傳 401（2026-04-29：wrong token -> 401，body=`{"error":"Unauthorized proxy token"}`）
- [x] 驗證 `MOONDREAM_AUTH` 缺失時 app 端錯誤訊息（2026-04-30：實機執行 magicClicker("back button") → Screenshot loaded 1440x3120 → `E/MainActivity: MOONDREAM_AUTH is missing`，guard 正常觸發）

### Sprint B：可重現自動化
- [x] 新增固定測試場景 1（啟動 app + 發送固定 prompt）（2026-04-29：`appium-tests/test_phoneclaw_fixed_scenarios.py::test_scenario_1_launch_and_fixed_prompt_ui`）
- [x] 新增固定測試場景 2（切換 model UI + 驗證狀態）（2026-04-29：`...::test_scenario_2_switch_model_ui`）
- [x] 新增固定測試場景 3（錯誤路徑：proxy 掛掉時 fallback 行為）（2026-04-29：`...::test_scenario_3_proxy_down_error_path`）
- [x] 將 smoke tests 升級為 CI 可執行格式（2026-04-29：新增 `.github/workflows/appium-smoke-ci.yml`，執行 `py_compile + python -m pytest --collect-only`）

### Sprint C：安全與維運
- [x] 將所有敏感設定確認只存在 `.env` / `local.properties` / `~/.gradle/gradle.properties`（2026-04-29：已掃描 source tree，未發現 app/src 硬編碼 token）
- [x] 確認 `.gitignore` 可阻擋 secret 檔案提交（2026-04-29：`gemini-proxy/.env`、`local.properties` 已被 ignore 規則命中）
- [x] 決定是否保留 `apikey` 模式作為緊急 fallback（2026-04-29：保留但預設停用，正常營運一律 `oauth`，僅事故時人工切換）
- [x] 補一份「故障排查手冊」（OAuth 失效、CLI 模型錯誤、adb 連線問題）（檔案：`gemini-proxy/TROUBLESHOOTING.md`）

### Sprint D：交付
- [x] 整理 commit（proxy / app / tests 分開）（2026-04-29：`COMMIT_PLAN.md`）
- [x] 建立 PR 並附上本進度文件（2026-04-30：PR #1 已建立 https://github.com/codeofthrone/phoneclaw/pull/1）
- [x] 在 PR 附上實測證據（health、chat completion、pytest 結果）（2026-04-29：`PR_EVIDENCE_2026-04-29.md`）

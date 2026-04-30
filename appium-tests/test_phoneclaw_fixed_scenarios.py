import os
import pytest
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def wait_visible(driver, by, value, timeout=20):
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, value))
    )


@pytest.mark.scenario
def test_scenario_1_launch_and_fixed_prompt_ui(driver):
    """b1: 啟動 app + 固定 prompt（先做 UI 層固定場景）"""
    package = os.getenv("PHONECLAW_APP_PACKAGE", "com.example.universal")
    assert driver.current_package == package

    # 尋找輸入框（依當前 UI 調整）
    input_box = wait_visible(
        driver,
        AppiumBy.ANDROID_UIAUTOMATOR,
        'new UiSelector().classNameMatches(".*EditText")',
        timeout=20,
    )
    input_box.click()
    input_box.clear()
    input_box.send_keys("固定測試 prompt: ping")

    # 只驗證輸入成功，不依賴後端回覆內容
    assert "固定測試 prompt" in input_box.text


@pytest.mark.scenario
def test_scenario_2_switch_model_ui(driver):
    """b2: 切換 model UI + 驗證"""
    model_button = wait_visible(driver, AppiumBy.ID, "com.example.universal:id/selectModelButton", timeout=20)
    model_button.click()

    # 嘗試尋找常見 model 名稱項目（若 UI 變更可調整）
    candidate = wait_visible(
        driver,
        AppiumBy.ANDROID_UIAUTOMATOR,
        'new UiSelector().textContains("gemini")',
        timeout=20,
    )
    assert candidate is not None
    candidate.click()


@pytest.mark.scenario
def test_scenario_3_proxy_down_error_path(driver):
    """b3: proxy 掛掉錯誤路徑（UI 有錯誤訊息）"""
    # 這個場景假設測試前把 GEMINI_PROXY_URL 指向不可達位址
    # 例如: http://127.0.0.1:1 或錯誤 host。
    # 驗證 app 在送出後有可見錯誤提示。

    input_box = wait_visible(
        driver,
        AppiumBy.ANDROID_UIAUTOMATOR,
        'new UiSelector().classNameMatches(".*EditText")',
        timeout=20,
    )
    input_box.click()
    input_box.clear()
    input_box.send_keys("proxy down path")

    send_btn = wait_visible(
        driver,
        AppiumBy.ANDROID_UIAUTOMATOR,
        'new UiSelector().textContains("Send")',
        timeout=20,
    )
    send_btn.click()

    # 錯誤提示（文字可能依 UI 調整）
    err = wait_visible(
        driver,
        AppiumBy.ANDROID_UIAUTOMATOR,
        'new UiSelector().textContains("error")',
        timeout=25,
    )
    assert err is not None

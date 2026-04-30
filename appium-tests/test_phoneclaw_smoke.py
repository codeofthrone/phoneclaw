import os
import time

from appium.webdriver.common.appiumby import AppiumBy
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def wait_visible(driver, by, value, timeout=20):
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, value))
    )


def test_phoneclaw_launch_smoke(driver):
    # Wait app boot
    time.sleep(2)

    package = os.getenv("PHONECLAW_APP_PACKAGE", "com.example.universal")
    current_package = driver.current_package
    assert current_package == package, f"Unexpected package: {current_package}"

    # Optional sanity: ensure at least one view is present
    views = driver.find_elements(AppiumBy.XPATH, "//*")
    assert len(views) > 0


def test_phoneclaw_model_button_present(driver):
    # This resource-id should match current layout; if app changes, update here.
    try:
        wait_visible(driver, AppiumBy.ID, "com.example.universal:id/selectModelButton", timeout=15)
    except TimeoutException:
        # fallback by visible text if id changes
        btn = wait_visible(driver, AppiumBy.ANDROID_UIAUTOMATOR,
                           'new UiSelector().textContains("Model")', timeout=15)
        assert btn is not None

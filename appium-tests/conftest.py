import os
import pytest
from appium import webdriver
from appium.options.android import UiAutomator2Options


def _bool_env(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


@pytest.fixture(scope="session")
def driver():
    server_url = os.getenv("APPIUM_SERVER_URL", "http://127.0.0.1:4723")

    caps = {
        "platformName": "Android",
        "appium:automationName": "UiAutomator2",
        "appium:deviceName": os.getenv("ANDROID_DEVICE_NAME", "AndroidDevice"),
        "appium:udid": os.getenv("ANDROID_UDID", ""),
        "appium:appPackage": os.getenv("PHONECLAW_APP_PACKAGE", "com.example.universal"),
        "appium:appActivity": os.getenv("PHONECLAW_APP_ACTIVITY", "com.example.universal.MainActivity"),
        "appium:noReset": _bool_env("APPIUM_NO_RESET", True),
        "appium:newCommandTimeout": int(os.getenv("APPIUM_NEW_COMMAND_TIMEOUT", "180")),
    }

    caps = {k: v for k, v in caps.items() if v != ""}
    options = UiAutomator2Options().load_capabilities(caps)

    d = webdriver.Remote(server_url, options=options)
    yield d
    d.quit()

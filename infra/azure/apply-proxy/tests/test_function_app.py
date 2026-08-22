import importlib.util
import json
import re
import sys
import urllib.parse
from pathlib import Path
from types import ModuleType, SimpleNamespace

FUNCTION_PATH = Path(__file__).resolve().parents[1] / "function_app.py"


def _load_function_app():
    if "azure.functions" not in sys.modules:
        azure = ModuleType("azure")
        azure.__path__ = []
        functions = ModuleType("azure.functions")

        class HttpResponse:
            def __init__(self, body="", status_code=200, headers=None, mimetype=None):
                self.body = body
                self.status_code = status_code
                self.headers = headers or {}
                self.mimetype = mimetype

        class FunctionApp:
            def __init__(self, **_kwargs):
                pass

            def route(self, **_kwargs):
                return lambda handler: handler

        functions.AuthLevel = SimpleNamespace(ANONYMOUS="anonymous")
        functions.FunctionApp = FunctionApp
        functions.HttpRequest = object
        functions.HttpResponse = HttpResponse
        azure.functions = functions
        sys.modules["azure"] = azure
        sys.modules["azure.functions"] = functions

    spec = importlib.util.spec_from_file_location("apply_proxy_function_app", FUNCTION_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


function_app = _load_function_app()


class Request:
    def __init__(self, body=b"", *, method="POST", url="https://stay.mtcottages.com/api/apply", headers=None):
        self._body = body
        self.method = method
        self.url = url
        self.headers = headers or {}

    def get_body(self):
        return self._body

    def get_json(self):
        return json.loads(self._body.decode("utf-8"))


def _valid_payload():
    return {
        "firstName": "Ada",
        "lastName": "Lovelace",
        "email": "ada@example.com",
        "phone": "555-555-1212",
        "moveInDate": "2026-09-01",
        "duration": "One to three months",
        "occupants": "2",
        "preferredLocation": "Marietta, OH",
        "homeSize": "Studio or one-bedroom",
        "stayType": "Work or relocation",
        "pets": "No pets",
        "message": "A short inquiry.",
        "screeningConsent": "",
        "termsAccepted": "yes",
        "sourceUrl": "https://stay.mtcottages.com/?property=frederick#form",
        "cf-turnstile-response": "turnstile-token",
    }


def _form_request(payload, **kwargs):
    body = urllib.parse.urlencode(payload).encode("utf-8")
    headers = {"Content-Type": "application/x-www-form-urlencoded", "Origin": "https://stay.mtcottages.com"}
    headers.update(kwargs.pop("headers", {}))
    return Request(body, headers=headers, **kwargs)


def test_source_url_is_origin_and_path_only():
    assert function_app._privacy_safe_source_url(
        "https://stay.mtcottages.com/apply?property=frederick#form"
    ) == "https://stay.mtcottages.com/apply"
    assert function_app._privacy_safe_source_url("https://stay.mtcottages.com/") == "https://stay.mtcottages.com/"


def test_source_url_rejects_untrusted_origins(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://stay.mtcottages.com")
    assert function_app._privacy_safe_source_url("https://evil.example/inquiry") == ""


def test_configured_origins_and_hostnames_reject_unsafe_values(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://stay.mtcottages.com,*,https://evil.example/path")
    monkeypatch.setenv("TURNSTILE_ALLOWED_HOSTNAMES", "stay.mtcottages.com,*.evil.example,https://bad.example")
    assert function_app._allowed_origins() == {"https://stay.mtcottages.com"}
    assert function_app._turnstile_hostnames() == {"stay.mtcottages.com"}


def test_client_ip_uses_valid_bounded_front_door_compatible_values():
    request = Request(headers={"X-Forwarded-For": "198.51.100.20, 203.0.113.9"})
    assert function_app._client_ip(request) == "203.0.113.9"
    request.headers["X-Azure-ClientIP"] = "192.0.2.7"
    assert function_app._client_ip(request) == "192.0.2.7"
    request.headers["X-Azure-ClientIP"] = "not-an-ip"
    assert function_app._client_ip(request) == "203.0.113.9"


def test_submission_validation_enforces_choices_dates_and_occupants():
    payload = _valid_payload()
    payload["duration"] = "custom"
    assert function_app._validate_submission(payload) == "Please choose a valid option"
    payload = _valid_payload()
    payload["moveInDate"] = "2101-01-01"
    assert function_app._validate_submission(payload) == "Please provide a valid move-in date"
    payload = _valid_payload()
    payload["occupants"] = "21"
    assert function_app._validate_submission(payload) == "Please provide a valid occupant count"
    payload = _valid_payload()
    payload["firstName"] = "A" * (function_app.FIELD_LIMITS["firstName"] + 1)
    assert function_app._validate_submission(payload) == "One or more fields are too long"


def test_oversized_turnstile_token_is_rejected_before_network(monkeypatch):
    monkeypatch.setenv("TURNSTILE_SITE_KEY", "site-key")
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "secret-key")
    monkeypatch.setenv("TURNSTILE_ALLOWED_HOSTNAMES", "stay.mtcottages.com")
    monkeypatch.setattr(function_app.urllib.request, "urlopen", lambda *_args, **_kwargs: (_ for _ in ()).throw(AssertionError("network call")))
    request = Request()
    result = function_app._verify_turnstile(
        request,
        {"cf-turnstile-response": "x" * (function_app.MAX_TURNSTILE_TOKEN_LENGTH + 1)},
    )
    assert result == (400, "Please complete the human verification")


def test_form_csp_has_nonce_and_turnstile_sources(monkeypatch):
    monkeypatch.setenv("TURNSTILE_SITE_KEY", "site-key")
    response = function_app.application_form(Request(method="GET", url="https://stay.mtcottages.com/"))
    csp = response.headers["Content-Security-Policy"]
    assert "frame-ancestors 'none'" in csp
    assert "script-src 'self' https://challenges.cloudflare.com 'nonce-" in csp
    assert "connect-src 'self' https://challenges.cloudflare.com" in csp
    assert "frame-src 'self' https://challenges.cloudflare.com" in csp
    assert "'unsafe-inline'" not in csp
    nonce = re.search(r'<script nonce="([^"]+)"', response.body).group(1)
    assert f"'nonce-{nonce}'" in csp
    assert "https://challenges.cloudflare.com/turnstile/v0/api.js" in response.body


def test_missing_site_key_keeps_form_disabled(monkeypatch):
    monkeypatch.delenv("TURNSTILE_SITE_KEY", raising=False)
    response = function_app.application_form(Request(method="GET", url="https://stay.mtcottages.com/"))
    assert response.status_code == 200
    assert 'class="cf-turnstile"' not in response.body
    assert 'data-turnstile-state="configuration-required"' in response.body
    assert "disabled data-turnstile-config-required" in response.body


def test_legacy_apply_host_redirect_is_preserved():
    response = function_app.application_form(
        Request(
            method="GET",
            url="https://apply.mtcottages.com/?property=frederick",
            headers={"Host": "apply.mtcottages.com"},
        )
    )
    assert response.status_code == 301
    assert response.headers["Location"] == "https://stay.mtcottages.com/?property=frederick"


def test_health_endpoint_retains_contract_and_security_headers():
    response = function_app.health(
        Request(method="GET", url="https://stay.mtcottages.com/api/health", headers={"Origin": "https://stay.mtcottages.com"})
    )
    assert response.status_code == 200
    assert json.loads(response.body) == {"status": "ok", "service": "mtcottages-apply-proxy"}
    assert response.headers["Access-Control-Allow-Origin"] == "https://stay.mtcottages.com"
    assert "frame-ancestors 'none'" in response.headers["Content-Security-Policy"]


def test_malformed_probe_is_not_rate_limited_and_valid_repeat_gets_retry_after(monkeypatch):
    function_app._last_submission.clear()
    bot_response = function_app.apply(_form_request({"website": "ci-probe"}))
    assert bot_response.status_code == 400
    assert not function_app._last_submission

    monkeypatch.setenv("LOGICAPP_URL_APPLICATION", "https://logic.example.test/callback")
    monkeypatch.setattr(function_app, "_verify_turnstile", lambda _req, _payload: None)

    class CallbackResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return b'{"success": true, "message": "Application received"}'

    callback_payload = {}

    def callback(_request, timeout):
        del timeout
        callback_payload.update(json.loads(_request.data.decode("utf-8")))
        return CallbackResponse()

    monkeypatch.setattr(function_app.urllib.request, "urlopen", callback)
    request_headers = {"X-Azure-ClientIP": "192.0.2.15"}
    first = function_app.apply(_form_request(_valid_payload(), headers=request_headers))
    second = function_app.apply(_form_request(_valid_payload(), headers=request_headers))
    assert first.status_code == 200
    assert second.status_code == 429
    assert int(second.headers["Retry-After"]) >= 1
    assert callback_payload["sourceUrl"] == "https://stay.mtcottages.com/"

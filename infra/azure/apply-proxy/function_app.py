import html
import json
import logging
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import azure.functions as func

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
logger = logging.getLogger(__name__)
_last_submission = {}
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
}
ALLOWED_FIELDS = {
    "firstName", "lastName", "email", "phone", "moveInDate", "duration", "occupants",
    "preferredLocation", "homeSize", "stayType", "pets", "employment", "monthlyBudget",
    "furnishedNeeds", "message", "screeningConsent", "termsAccepted", "website", "sourceUrl",
    "propertyId",
}
FIELD_LIMITS = {"message": 4000, "sourceUrl": 500, "furnishedNeeds": 1000}


def _allowed_origins():
    values = os.environ.get(
        "ALLOWED_ORIGINS",
        "https://stay.mtcottages.com",
    )
    return {value.strip() for value in values.split(",") if value.strip()}


def _cors_headers(origin):
    allowed = _allowed_origins()
    headers = {
        **SECURITY_HEADERS,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Vary": "Origin",
        "Content-Type": "application/json",
    }
    if origin in allowed:
        headers["Access-Control-Allow-Origin"] = origin
    return headers


def _response(payload, status_code, origin):
    return func.HttpResponse(json.dumps(payload), status_code=status_code, headers=_cors_headers(origin))


def _request_payload(req):
    content_type = req.headers.get("Content-Type", "").lower()
    if "application/json" in content_type:
        value = req.get_json()
        return value if isinstance(value, dict) else {}
    parsed = urllib.parse.parse_qs(req.get_body().decode("utf-8", errors="replace"), keep_blank_values=True)
    return {key: values[-1] if values else "" for key, values in parsed.items()}


def _turnstile_hostnames():
    configured = os.environ.get(
        "TURNSTILE_ALLOWED_HOSTNAMES",
        "stay.mtcottages.com",
    )
    return {value.strip().lower() for value in configured.split(",") if value.strip()}


def _verify_turnstile(req, payload):
    """Return an error response tuple, or None when Turnstile accepts the token."""
    secret = os.environ.get("TURNSTILE_SECRET_KEY", "").strip()
    if not secret:
        logger.error("Turnstile validation is not configured")
        return 503, "Human verification is not configured"

    token = str(payload.get("cf-turnstile-response", "")).strip()
    if not token:
        return 400, "Please complete the human verification"

    verification_data = {"secret": secret, "response": token}
    client_ip = (
        req.headers.get("CF-Connecting-IP", "").strip()
        or req.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    )
    if client_ip:
        verification_data["remoteip"] = client_ip

    verification_request = urllib.request.Request(
        TURNSTILE_VERIFY_URL,
        data=urllib.parse.urlencode(verification_data).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(verification_request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8", errors="replace"))
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        logger.error("Turnstile validation request failed: %s", type(error).__name__)
        return 503, "Human verification is temporarily unavailable"

    if not isinstance(result, dict) or not result.get("success"):
        error_codes = result.get("error-codes", []) if isinstance(result, dict) else []
        logger.warning("Turnstile rejected an inquiry: %s", error_codes)
        return 400, "Please complete the human verification"

    hostname = str(result.get("hostname", "")).strip().lower()
    if hostname not in _turnstile_hostnames():
        logger.warning("Turnstile returned an unexpected hostname: %s", hostname or "missing")
        return 400, "Please complete the human verification"

    expected_action = os.environ.get("TURNSTILE_EXPECTED_ACTION", "stay-inquiry").strip()
    if expected_action and result.get("action") != expected_action:
        logger.warning("Turnstile returned an unexpected action: %s", result.get("action", "missing"))
        return 400, "Please complete the human verification"

    return None


@app.route(route="{*route}", methods=["GET"])
def application_form(req: func.HttpRequest) -> func.HttpResponse:
    requested_path = urllib.parse.urlparse(req.url).path.rstrip("/")
    if requested_path.endswith("/api/health") or requested_path.endswith("/health"):
        return _response({"status": "ok", "service": "mtcottages-apply-proxy"}, 200, req.headers.get("Origin", ""))
    forwarded_host = req.headers.get("X-Forwarded-Host", "")
    request_host = (forwarded_host.split(",")[0] or req.headers.get("Host", "")).strip().lower()
    if request_host == "apply.mtcottages.com" and not requested_path.startswith("/api/"):
        parsed = urllib.parse.urlparse(req.url)
        destination = "https://stay.mtcottages.com" + (parsed.path or "/")
        if parsed.query:
            destination += "?" + parsed.query
        return func.HttpResponse(
            status_code=301,
            headers={**SECURITY_HEADERS, "Location": destination, "Cache-Control": "public, max-age=300"},
        )
    form_path = Path(__file__).with_name("index.html")
    try:
        markup = form_path.read_text(encoding="utf-8")
    except OSError:
        return func.HttpResponse("Application form unavailable", status_code=503)

    turnstile_site_key = os.environ.get("TURNSTILE_SITE_KEY", "").strip()
    turnstile_widget = '<div class="cf-turnstile" data-sitekey="__TURNSTILE_SITE_KEY__" data-action="stay-inquiry" data-theme="light" data-language="en"></div>'
    if turnstile_site_key:
        markup = markup.replace("<!-- TURNSTILE_SCRIPT -->", '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>')
        markup = markup.replace("__TURNSTILE_SITE_KEY__", html.escape(turnstile_site_key, quote=True))
    else:
        markup = markup.replace("<!-- TURNSTILE_SCRIPT -->", "")
        markup = markup.replace(turnstile_widget, "")
        markup = markup.replace('data-turnstile-state="ready"', 'data-turnstile-state="configuration-required"')
        markup = markup.replace(" data-turnstile-unavailable hidden", " data-turnstile-unavailable")
        markup = markup.replace(" data-requires-turnstile", " disabled data-turnstile-config-required")
    return func.HttpResponse(
        markup,
        status_code=200,
        mimetype="text/html",
        headers={**SECURITY_HEADERS, "Cache-Control": "no-store"},
    )


@app.route(route="api/apply", methods=["POST", "OPTIONS"])
def apply(req: func.HttpRequest) -> func.HttpResponse:
    origin = req.headers.get("Origin", "")
    if req.method == "OPTIONS":
        # Keep a body so the worker does not collapse this response to 204;
        # native Function App CORS also handles preflight at the platform edge.
        return func.HttpResponse("OK", status_code=200, headers=_cors_headers(origin))
    if origin and origin not in _allowed_origins():
        return _response({"success": False, "message": "Origin not allowed"}, 403, origin)

    max_body = int(os.environ.get("MAX_BODY_BYTES", "200000"))
    body = req.get_body()
    if len(body) > max_body:
        return _response({"success": False, "message": "Submission is too large"}, 413, origin)

    client_key = req.headers.get("X-Forwarded-For", "unknown").split(",")[0].strip()
    now = time.time()
    window = float(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "5"))
    if now - _last_submission.get(client_key, 0) < window:
        return _response({"success": False, "message": "Please wait before trying again"}, 429, origin)
    _last_submission[client_key] = now

    try:
        payload = _request_payload(req)
    except (ValueError, json.JSONDecodeError):
        return _response({"success": False, "message": "Invalid submission"}, 400, origin)

    if payload.get("website", "").strip():
        return _response({"success": False, "message": "Invalid submission"}, 400, origin)

    turnstile_error = _verify_turnstile(req, payload)
    if turnstile_error:
        status_code, message = turnstile_error
        return _response({"success": False, "message": message}, status_code, origin)

    required = ("firstName", "lastName", "email", "phone", "stayType", "preferredLocation", "moveInDate", "duration", "occupants", "message", "termsAccepted")
    if any(not str(payload.get(field, "")).strip() for field in required):
        return _response({"success": False, "message": "Please complete the required fields"}, 400, origin)
    if str(payload.get("termsAccepted", "")).strip().lower() not in {"yes", "true", "on"}:
        return _response({"success": False, "message": "Please confirm the application information"}, 400, origin)
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", str(payload.get("email", ""))):
        return _response({"success": False, "message": "Please provide a valid email"}, 400, origin)
    if not re.fullmatch(r"[0-9+().\-\s]{7,30}", str(payload.get("phone", ""))):
        return _response({"success": False, "message": "Please provide a valid phone number"}, 400, origin)
    try:
        occupants = int(str(payload.get("occupants", "")))
    except ValueError:
        return _response({"success": False, "message": "Please provide a valid occupant count"}, 400, origin)
    if occupants < 1 or occupants > 20:
        return _response({"success": False, "message": "Please provide a valid occupant count"}, 400, origin)

    callback_url = os.environ.get("LOGICAPP_URL_APPLICATION", "")
    if not callback_url:
        return _response({"success": False, "message": "Application intake is not configured"}, 503, origin)

    outbound = {
        str(key): str(value)[:FIELD_LIMITS.get(str(key), 500)]
        for key, value in payload.items()
        if str(key) in ALLOWED_FIELDS
    }
    request = urllib.request.Request(
        callback_url,
        data=json.dumps(outbound).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_body = response.read().decode("utf-8", errors="replace")
            try:
                result = json.loads(response_body)
            except json.JSONDecodeError:
                result = {"success": response.status < 300, "message": "Application received"}
            return _response(result, response.status, origin)
    except urllib.error.HTTPError as error:
        response_body = error.read().decode("utf-8", errors="replace")
        try:
            result = json.loads(response_body)
        except json.JSONDecodeError:
            result = {"success": False, "message": "Application intake failed"}
        return _response(result, error.code if error.code < 600 else 502, origin)
    except (urllib.error.URLError, TimeoutError):
        return _response({"success": False, "message": "Application intake unavailable"}, 502, origin)


@app.route(route="api/health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    return _response({"status": "ok", "service": "mtcottages-apply-proxy"}, 200, req.headers.get("Origin", ""))

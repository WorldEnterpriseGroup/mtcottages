import base64
import hashlib
import html
import ipaddress
import json
import logging
import math
import os
import re
import secrets
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

import azure.functions as func

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
logger = logging.getLogger(__name__)
_last_submission = {}
_rate_limit_lock = threading.Lock()
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
DEFAULT_ALLOWED_ORIGINS = "https://stay.mtcottages.com"
CANONICAL_HOSTNAME = "stay.mtcottages.com"
DEFAULT_TURNSTILE_HOSTNAMES = "stay.mtcottages.com"
DEFAULT_TURNSTILE_ACTION = "stay-inquiry"
MAX_BODY_BYTES = 200_000
MAX_CONFIG_LIST_BYTES = 4_096
MAX_TURNSTILE_TOKEN_LENGTH = 2_048
MAX_TURNSTILE_RESPONSE_BYTES = 64 * 1_024
MAX_CLIENT_IP_LENGTH = 64
MAX_RATE_LIMIT_ENTRIES = 4_096
MIN_MOVE_IN_DATE = date(1900, 1, 1)
MAX_MOVE_IN_DATE = date(2100, 12, 31)
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
FIELD_LIMITS = {
    "firstName": 100,
    "lastName": 100,
    "email": 254,
    "phone": 30,
    "moveInDate": 10,
    "duration": 64,
    "occupants": 2,
    "preferredLocation": 64,
    "homeSize": 64,
    "stayType": 80,
    "pets": 64,
    "employment": 200,
    "monthlyBudget": 100,
    "message": 4000,
    "screeningConsent": 10,
    "termsAccepted": 10,
    "website": 128,
    "sourceUrl": 500,
    "propertyId": 64,
    "furnishedNeeds": 1000,
}
CHOICE_FIELDS = {
    "duration": frozenset({
        "One to three months", "Three to twelve months", "A year or more", "Flexible / not sure",
    }),
    "preferredLocation": frozenset({
        "Marietta, OH", "Parkersburg, WV", "Ravenswood, WV", "Grantsville, WV", "Racine, OH",
        "Athens, OH", "Open to options",
    }),
    "homeSize": frozenset({
        "Studio or one-bedroom", "Two-bedroom", "Three-bedroom", "Four-bedroom", "Open to options",
    }),
    "stayType": frozenset({
        "Travel or healthcare assignment", "Work or relocation", "Insurance housing",
        "Family or furnished stay", "Research or fellowship", "Personal transition", "Something else",
    }),
    "pets": frozenset({"No pets", "Yes — I’ll share details below", "Prefer to discuss"}),
}
REQUIRED_FIELDS = (
    "firstName", "lastName", "email", "phone", "stayType", "preferredLocation", "moveInDate",
    "duration", "occupants", "message", "termsAccepted",
)
VALID_BOOLEAN_VALUES = frozenset({"yes", "true", "on"})


def _content_security_policy(script_nonce=None, style_source=None):
    script_sources = "'self' https://challenges.cloudflare.com"
    if script_nonce:
        script_sources += f" 'nonce-{script_nonce}'"
    style_sources = "'self'"
    if style_source:
        style_sources += f" {style_source}"
    return (
        "default-src 'self'; "
        "base-uri 'self'; "
        "object-src 'none'; "
        "frame-ancestors 'none'; "
        "form-action 'self'; "
        f"script-src {script_sources}; "
        f"style-src {style_sources}; "
        "connect-src 'self' https://challenges.cloudflare.com; "
        "frame-src 'self' https://challenges.cloudflare.com; "
        "img-src 'self'; "
        "font-src 'self'"
    )


SECURITY_HEADERS["Content-Security-Policy"] = _content_security_policy()


def _normalize_hostname(value):
    if not isinstance(value, str):
        return None
    candidate = value.strip().lower().rstrip(".")
    if not candidate or len(candidate) > 253 or any(character.isspace() for character in candidate):
        return None
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        pass
    labels = candidate.split(".")
    if any(
        not label
        or len(label) > 63
        or not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", label)
        for label in labels
    ):
        return None
    return candidate


def _normalize_origin(value):
    if not isinstance(value, str):
        return None
    candidate = value.strip()
    if not candidate or len(candidate) > MAX_CONFIG_LIST_BYTES:
        return None
    try:
        parsed = urllib.parse.urlsplit(candidate)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError:
        return None
    if (
        parsed.scheme.lower() not in {"http", "https"}
        or not hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
    ):
        return None
    normalized_hostname = _normalize_hostname(hostname)
    if not normalized_hostname:
        return None
    host = f"[{normalized_hostname}]" if ":" in normalized_hostname else normalized_hostname
    scheme = parsed.scheme.lower()
    if port is not None and port not in {80 if scheme == "http" else 443}:
        host += f":{port}"
    return f"{scheme}://{host}"


def _configured_values(environment_name, default, normalizer):
    configured = os.environ.get(environment_name, default)
    if not isinstance(configured, str) or len(configured) > MAX_CONFIG_LIST_BYTES:
        return set()
    return {
        normalized
        for value in configured.split(",")
        if (normalized := normalizer(value)) is not None
    }


def _allowed_origins():
    return _configured_values("ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS, _normalize_origin)


def _origin_allowed(origin):
    normalized = _normalize_origin(origin)
    return normalized is not None and normalized in _allowed_origins()


def _cors_headers(origin):
    headers = {
        **SECURITY_HEADERS,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Vary": "Origin",
        "Content-Type": "application/json",
    }
    normalized_origin = _normalize_origin(origin)
    if normalized_origin and normalized_origin in _allowed_origins():
        headers["Access-Control-Allow-Origin"] = normalized_origin
    return headers


def _response(payload, status_code, origin, extra_headers=None):
    headers = {**_cors_headers(origin), **(extra_headers or {})}
    return func.HttpResponse(json.dumps(payload), status_code=status_code, headers=headers)


def _style_csp_source(markup):
    match = re.search(r"<style(?:\s[^>]*)?>(.*?)</style>", markup, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    digest = base64.b64encode(hashlib.sha256(match.group(1).encode("utf-8")).digest()).decode("ascii")
    return f"'sha256-{digest}'"


def _page_security_headers(markup, script_nonce):
    return {
        **SECURITY_HEADERS,
        "Content-Security-Policy": _content_security_policy(
            script_nonce=script_nonce,
            style_source=_style_csp_source(markup),
        ),
    }


def _request_payload(req):
    content_type = req.headers.get("Content-Type", "").lower()
    if "application/json" in content_type:
        value = req.get_json()
        return value if isinstance(value, dict) else {}
    parsed = urllib.parse.parse_qs(req.get_body().decode("utf-8", errors="replace"), keep_blank_values=True)
    return {key: values[-1] if values else "" for key, values in parsed.items()}


def _turnstile_hostnames():
    return _configured_values("TURNSTILE_ALLOWED_HOSTNAMES", DEFAULT_TURNSTILE_HOSTNAMES, _normalize_hostname)


def _request_hostname(req):
    """Return the normalized public hostname for the current request."""
    forwarded_host = req.headers.get("X-Forwarded-Host", "")
    candidates = [value.strip() for value in forwarded_host.split(",") if value.strip()]
    candidates.append(req.headers.get("Host", "").strip())
    candidates.append(urllib.parse.urlsplit(req.url).hostname or "")
    for candidate in candidates:
        try:
            hostname = urllib.parse.urlsplit(f"//{candidate}").hostname
        except ValueError:
            hostname = None
        normalized = _normalize_hostname(hostname or "")
        if normalized:
            return normalized
    return ""


def _canonical_host(req):
    return _request_hostname(req) == CANONICAL_HOSTNAME


def _turnstile_site_key():
    value = os.environ.get("TURNSTILE_SITE_KEY", "").strip()
    if not value or len(value) > 256 or any(character.isspace() for character in value):
        return ""
    return value


def _turnstile_expected_action():
    value = os.environ.get("TURNSTILE_EXPECTED_ACTION", DEFAULT_TURNSTILE_ACTION).strip()
    if not value or len(value) > 64 or not re.fullmatch(r"[A-Za-z0-9_-]+", value):
        return None
    return value


def _turnstile_is_configured():
    site_key = _turnstile_site_key()
    secret = os.environ.get("TURNSTILE_SECRET_KEY", "").strip()
    return bool(
        site_key
        and secret
        and len(secret) <= 256
        and not any(character.isspace() for character in secret)
        and _turnstile_hostnames()
        and _turnstile_expected_action()
    )


def _valid_ip(value):
    if not isinstance(value, str):
        return None
    candidate = value.strip()
    if not candidate or len(candidate) > MAX_CLIENT_IP_LENGTH or "," in candidate:
        return None
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None


def _client_ip(req):
    """Return a bounded, parsed IP for advisory rate limiting and Turnstile.

    Azure Front Door supplies X-Azure-ClientIP and appends the socket address
    to X-Forwarded-For.  Only a single valid address is accepted, and the last
    X-Forwarded-For hop is used so a caller cannot choose an arbitrary first
    value.  These headers remain advisory; they are never an authorization
    signal.
    """
    headers = req.headers
    for header_name in ("X-Azure-ClientIP", "CF-Connecting-IP", "X-Azure-SocketIP"):
        candidate = _valid_ip(headers.get(header_name, ""))
        if candidate:
            return candidate
    forwarded = headers.get("X-Forwarded-For", "")
    if isinstance(forwarded, str) and forwarded:
        return _valid_ip(forwarded.rsplit(",", 1)[-1]) or "unknown"
    return "unknown"


def _verify_turnstile(req, payload):
    """Return an error response tuple, or None when Turnstile accepts the token."""
    if not _turnstile_is_configured():
        logger.error("Turnstile validation is not configured")
        return 503, "Human verification is not configured"

    token_value = payload.get("cf-turnstile-response", "")
    if not isinstance(token_value, str):
        return 400, "Please complete the human verification"
    token = token_value.strip()
    if not token or len(token) > MAX_TURNSTILE_TOKEN_LENGTH:
        return 400, "Please complete the human verification"

    secret = os.environ["TURNSTILE_SECRET_KEY"].strip()
    verification_data = {"secret": secret, "response": token}
    client_ip = _client_ip(req)
    if client_ip != "unknown":
        verification_data["remoteip"] = client_ip

    verification_request = urllib.request.Request(
        TURNSTILE_VERIFY_URL,
        data=urllib.parse.urlencode(verification_data).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(verification_request, timeout=10) as response:
            result = json.loads(response.read(MAX_TURNSTILE_RESPONSE_BYTES).decode("utf-8", errors="replace"))
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        logger.error("Turnstile validation request failed: %s", type(error).__name__)
        return 503, "Human verification is temporarily unavailable"

    if not isinstance(result, dict) or result.get("success") is not True:
        logger.warning("Turnstile rejected an inquiry")
        return 400, "Please complete the human verification"

    hostname = _normalize_hostname(result.get("hostname", ""))
    if hostname not in _turnstile_hostnames():
        logger.warning("Turnstile returned an unexpected hostname")
        return 400, "Please complete the human verification"

    expected_action = _turnstile_expected_action()
    if expected_action is None or result.get("action") != expected_action:
        logger.warning("Turnstile returned an unexpected action")
        return 400, "Please complete the human verification"

    return None


def _text_value(payload, field_name):
    value = payload.get(field_name, "")
    return value.strip() if isinstance(value, str) else ""


def _validate_submission(payload):
    known_fields = ALLOWED_FIELDS | {"cf-turnstile-response"}
    if any(field in payload and not isinstance(payload[field], str) for field in known_fields):
        return "Invalid submission"
    if _text_value(payload, "website"):
        return "Invalid submission"
    if any(not _text_value(payload, field) for field in REQUIRED_FIELDS):
        return "Please complete the required fields"

    terms_accepted = _text_value(payload, "termsAccepted").lower()
    if terms_accepted not in VALID_BOOLEAN_VALUES:
        return "Please confirm the application information"
    screening_consent = _text_value(payload, "screeningConsent").lower()
    if screening_consent and screening_consent not in VALID_BOOLEAN_VALUES:
        return "Invalid submission"

    for field_name, choices in CHOICE_FIELDS.items():
        value = payload.get(field_name, "")
        if value and value not in choices:
            return "Please choose a valid option"

    email = _text_value(payload, "email")
    if len(email) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        return "Please provide a valid email"
    phone = _text_value(payload, "phone")
    if not re.fullmatch(r"[0-9+().\-\s]{7,30}", phone):
        return "Please provide a valid phone number"

    move_in_date = payload.get("moveInDate", "")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", move_in_date):
        return "Please provide a valid move-in date"
    try:
        parsed_move_in_date = date.fromisoformat(move_in_date)
    except ValueError:
        return "Please provide a valid move-in date"
    if not MIN_MOVE_IN_DATE <= parsed_move_in_date <= MAX_MOVE_IN_DATE:
        return "Please provide a valid move-in date"

    occupants = payload.get("occupants", "")
    if not re.fullmatch(r"\d{1,2}", occupants) or not 1 <= int(occupants) <= 20:
        return "Please provide a valid occupant count"
    for field_name, limit in FIELD_LIMITS.items():
        if len(_text_value(payload, field_name)) > limit:
            return "One or more fields are too long"
    return None


def _privacy_safe_source_url(value):
    if not isinstance(value, str) or not value.strip():
        return ""
    try:
        parsed = urllib.parse.urlsplit(value.strip())
        if (
            parsed.scheme.lower() not in {"http", "https"}
            or not parsed.netloc
            or parsed.username is not None
            or parsed.password is not None
        ):
            return ""
        safe_origin = _normalize_origin(f"{parsed.scheme}://{parsed.netloc}")
    except ValueError:
        return ""
    if not safe_origin:
        return ""
    if safe_origin not in _allowed_origins():
        return ""
    path = parsed.path or "/"
    if not path.startswith("/"):
        return ""
    return f"{safe_origin}{path}"[:FIELD_LIMITS["sourceUrl"]]


def _outbound_payload(payload):
    outbound = {}
    for key, value in payload.items():
        field_name = str(key)
        if field_name not in ALLOWED_FIELDS or not isinstance(value, str):
            continue
        if field_name == "sourceUrl":
            value = _privacy_safe_source_url(value)
        outbound[field_name] = value[:FIELD_LIMITS.get(field_name, 500)]
    return outbound


def _max_body_size():
    configured = os.environ.get("MAX_BODY_BYTES", str(MAX_BODY_BYTES))
    try:
        value = int(configured)
    except (TypeError, ValueError):
        return MAX_BODY_BYTES
    return value if 1 <= value <= 1_000_000 else MAX_BODY_BYTES


def _rate_limit_window():
    configured = os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "5")
    try:
        value = float(configured)
    except (TypeError, ValueError):
        return 5.0
    if not math.isfinite(value) or value < 1 or value > 86_400:
        return 5.0
    return value


def _record_submission(client_key):
    now = time.monotonic()
    window = _rate_limit_window()
    with _rate_limit_lock:
        last_submission = _last_submission.get(client_key)
        if last_submission is not None:
            remaining = window - (now - last_submission)
            if remaining > 0:
                return max(1, math.ceil(remaining))
        _last_submission[client_key] = now
        if len(_last_submission) > MAX_RATE_LIMIT_ENTRIES:
            cutoff = now - window
            stale_keys = [key for key, timestamp in _last_submission.items() if timestamp < cutoff]
            for key in stale_keys:
                _last_submission.pop(key, None)
            while len(_last_submission) > MAX_RATE_LIMIT_ENTRIES:
                oldest_key = min(_last_submission, key=_last_submission.get)
                _last_submission.pop(oldest_key, None)
    return None


@app.route(route="{*route}", methods=["GET"])
def application_form(req: func.HttpRequest) -> func.HttpResponse:
    requested_path = urllib.parse.urlparse(req.url).path.rstrip("/")
    if not _canonical_host(req):
        return func.HttpResponse("Not found", status_code=404, headers=SECURITY_HEADERS)
    if requested_path.endswith("/api/health") or requested_path.endswith("/health"):
        return _response({"status": "ok", "service": "mtcottages-apply-proxy"}, 200, req.headers.get("Origin", ""))
    form_path = Path(__file__).with_name("index.html")
    try:
        markup = form_path.read_text(encoding="utf-8")
    except OSError:
        return func.HttpResponse("Application form unavailable", status_code=503, headers=SECURITY_HEADERS)

    if not _turnstile_is_configured():
        logger.error("Turnstile validation is not configured")
        return func.HttpResponse("Application form unavailable", status_code=503, headers=SECURITY_HEADERS)
    turnstile_site_key = _turnstile_site_key()
    script_nonce = secrets.token_urlsafe(18)
    turnstile_script = (
        f'<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" '
        f'nonce="{script_nonce}" async defer></script>'
    )
    markup = markup.replace("<!-- TURNSTILE_SCRIPT -->", turnstile_script)
    markup = markup.replace("__TURNSTILE_SITE_KEY__", html.escape(turnstile_site_key, quote=True))
    markup = markup.replace('nonce="__INLINE_SCRIPT_NONCE__"', f'nonce="{script_nonce}"')
    return func.HttpResponse(
        markup,
        status_code=200,
        mimetype="text/html",
        headers={**_page_security_headers(markup, script_nonce), "Cache-Control": "no-store"},
    )


@app.route(route="api/apply", methods=["POST", "OPTIONS"])
def apply(req: func.HttpRequest) -> func.HttpResponse:
    origin = req.headers.get("Origin", "").strip()
    if not _canonical_host(req):
        return _response({"success": False, "message": "Not found"}, 404, origin)
    if req.method == "OPTIONS":
        # Keep a body so the worker does not collapse this response to 204;
        # native Function App CORS also handles preflight at the platform edge.
        return func.HttpResponse("OK", status_code=200, headers=_cors_headers(origin))
    if origin and not _origin_allowed(origin):
        return _response({"success": False, "message": "Origin not allowed"}, 403, origin)

    body = req.get_body()
    if len(body) > _max_body_size():
        return _response({"success": False, "message": "Submission is too large"}, 413, origin)

    try:
        payload = _request_payload(req)
    except (TypeError, ValueError, UnicodeError, json.JSONDecodeError):
        return _response({"success": False, "message": "Invalid submission"}, 400, origin)

    validation_error = _validate_submission(payload)
    if validation_error:
        return _response({"success": False, "message": validation_error}, 400, origin)

    turnstile_error = _verify_turnstile(req, payload)
    if turnstile_error:
        status_code, message = turnstile_error
        return _response({"success": False, "message": message}, status_code, origin)

    callback_url = os.environ.get("LOGICAPP_URL_APPLICATION", "")
    if not callback_url:
        return _response({"success": False, "message": "Application intake is not configured"}, 503, origin)

    retry_after = _record_submission(_client_ip(req))
    if retry_after is not None:
        return _response(
            {"success": False, "message": "Please wait before trying again"},
            429,
            origin,
            {"Retry-After": str(retry_after)},
        )

    outbound = _outbound_payload(payload)
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

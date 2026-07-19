import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import azure.functions as func


app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
_last_submission = {}


def _allowed_origins():
    values = os.environ.get(
        "ALLOWED_ORIGINS",
        "https://mtcottages.com,https://www.mtcottages.com,https://stay.mtcottages.com,https://apply.mtcottages.com",
    )
    return {value.strip() for value in values.split(",") if value.strip()}


def _cors_headers(origin):
    allowed = _allowed_origins()
    return {
        "Access-Control-Allow-Origin": origin if origin in allowed else next(iter(allowed), "https://mtcottages.com"),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Vary": "Origin",
        "Content-Type": "application/json",
    }


def _response(payload, status_code, origin):
    return func.HttpResponse(json.dumps(payload), status_code=status_code, headers=_cors_headers(origin))


def _request_payload(req):
    content_type = req.headers.get("Content-Type", "").lower()
    if "application/json" in content_type:
        value = req.get_json()
        return value if isinstance(value, dict) else {}
    parsed = urllib.parse.parse_qs(req.get_body().decode("utf-8", errors="replace"), keep_blank_values=True)
    return {key: values[-1] if values else "" for key, values in parsed.items()}


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
            headers={"Location": destination, "Cache-Control": "public, max-age=300"},
        )
    form_path = Path(__file__).with_name("index.html")
    try:
        markup = form_path.read_text(encoding="utf-8")
    except OSError:
        return func.HttpResponse("Application form unavailable", status_code=503)
    return func.HttpResponse(markup, status_code=200, mimetype="text/html")


@app.route(route="api/apply", methods=["POST", "OPTIONS"])
def apply(req: func.HttpRequest) -> func.HttpResponse:
    origin = req.headers.get("Origin", "")
    if req.method == "OPTIONS":
        return func.HttpResponse(status_code=204, headers=_cors_headers(origin))
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

    required = ("firstName", "lastName", "email", "phone", "stayType", "preferredLocation", "moveInDate", "duration", "occupants", "message", "termsAccepted")
    if any(not str(payload.get(field, "")).strip() for field in required):
        return _response({"success": False, "message": "Please complete the required fields"}, 400, origin)
    if str(payload.get("termsAccepted", "")).strip().lower() not in {"yes", "true", "on"}:
        return _response({"success": False, "message": "Please confirm the application information"}, 400, origin)
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", str(payload.get("email", ""))):
        return _response({"success": False, "message": "Please provide a valid email"}, 400, origin)

    callback_url = os.environ.get("LOGICAPP_URL_APPLICATION", "")
    if not callback_url:
        return _response({"success": False, "message": "Application intake is not configured"}, 503, origin)

    outbound = {str(key): str(value)[:4000] for key, value in payload.items()}
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

#!/usr/bin/env python3
"""Validate the canonical stay form, redirect alias, and Logic App contract.

The application is intentionally rendered only by the Azure Function at
``stay.mtcottages.com``.  The Astro ``apply.html`` artifact is a compatibility
redirect and must never grow a second form.  This check keeps the canonical
HTML form aligned with the Logic App request schema instead of maintaining two
public copies of the form.
"""

import json
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEGACY_HTML = ROOT / "dist" / "apply.html"
PROXY_HTML = ROOT / "infra" / "azure" / "apply-proxy" / "index.html"
LOGIC_APP = ROOT / "infra" / "azure" / "mtcottages-intake.definition.json"
FIELD_TAGS = {"input", "select", "textarea"}

EXPECTED_SELECTS = {
    "duration": ["", "One to three months", "Three to twelve months", "A year or more", "Flexible / not sure"],
    "preferredLocation": ["", "Marietta, OH", "Parkersburg, WV", "Ravenswood, WV", "Grantsville, WV", "Racine, OH", "Athens, OH", "Open to options"],
    "homeSize": ["", "Studio or one-bedroom", "Two-bedroom", "Three-bedroom", "Four-bedroom", "Open to options"],
    "stayType": ["", "Travel or healthcare assignment", "Work or relocation", "Insurance housing", "Family or furnished stay", "Research or fellowship", "Personal transition", "Something else"],
    "pets": ["", "No pets", "Yes — I’ll share details below", "Prefer to discuss"],
}


class ApplicationFormExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.form_depth = 0
        self.target_form_depth = None
        self.fields = []
        self.select_options = {}
        self._current_select_name = None
        self._current_option_value = None
        self._current_option_text = None

    @property
    def in_target_form(self):
        return self.target_form_depth is not None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "form":
            self.form_depth += 1
            if self.target_form_depth is None and "data-application-form" in attrs_dict:
                self.target_form_depth = self.form_depth
            return
        if not self.in_target_form:
            return
        if tag in FIELD_TAGS:
            name = attrs_dict.get("name")
            if name is None:
                return
            field_type = attrs_dict.get("type", "text") if tag == "input" else tag
            self.fields.append({"tag": tag, "name": name, "type": field_type, "required": "required" in attrs_dict})
            if tag == "select":
                self._current_select_name = name
                self.select_options[name] = []
        elif tag == "option" and self._current_select_name is not None:
            self._current_option_value = attrs_dict.get("value")
            self._current_option_text = []

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == "form":
            if self.in_target_form and self.form_depth == self.target_form_depth:
                self.target_form_depth = None
            self.form_depth = max(0, self.form_depth - 1)
            return
        if not self.in_target_form:
            return
        if tag == "select":
            self._current_select_name = None
        elif tag == "option" and self._current_option_text is not None:
            text = "".join(self._current_option_text).strip()
            value = self._current_option_value if self._current_option_value is not None else text
            self.select_options[self._current_select_name].append(value)
            self._current_option_value = None
            self._current_option_text = None

    def handle_data(self, data):
        if self._current_option_text is not None:
            self._current_option_text.append(data)


def extract(path: Path) -> ApplicationFormExtractor:
    parser = ApplicationFormExtractor()
    parser.feed(path.read_text(encoding="utf-8"))
    if parser.target_form_depth is not None:
        raise SystemExit(f"{path}: [data-application-form] element was never closed")
    if not parser.fields:
        raise SystemExit(f"{path}: no [data-application-form] element found")
    return parser


def main() -> int:
    for path in (LEGACY_HTML, PROXY_HTML, LOGIC_APP):
        if not path.is_file():
            print(f"error: {path} does not exist; run the build first", file=sys.stderr)
            return 1

    errors = []
    legacy = LEGACY_HTML.read_text(encoding="utf-8")
    proxy = PROXY_HTML.read_text(encoding="utf-8")
    if "data-application-form" in legacy:
        errors.append("dist/apply.html still contains an application form; the route must be redirect-only")
    if "https://stay.mtcottages.com/" not in legacy or "window.location.replace" not in legacy:
        errors.append("dist/apply.html is missing the canonical stay redirect")
    for marker in ("<link rel=\"canonical\" href=\"https://stay.mtcottages.com/\">", "Find a cottage that feels like home.", "Tell us what would make a cottage feel like yours.", "One small check", "cf-turnstile", "data-property-context", "optionAliases", "data-form-status"):
        if marker not in proxy:
            errors.append(f"stay form is missing canonical experience marker: {marker}")
    if 'action="https://stay.mtcottages.com/api/apply"' not in proxy:
        errors.append("stay form must post to https://stay.mtcottages.com/api/apply")

    form = extract(PROXY_HTML)
    definition = json.loads(LOGIC_APP.read_text(encoding="utf-8"))
    schema = definition["triggers"]["manual"]["inputs"]["schema"]
    properties = schema["properties"]
    form_names = [field["name"] for field in form.fields]
    schema_names = list(properties)
    if set(form_names) != set(schema_names):
        errors.append(f"stay form field names differ from Logic App schema: form={form_names} schema={schema_names}")

    wire_types = {"number": "string", "date": "string", "email": "string", "tel": "string", "text": "string", "checkbox": "string", "hidden": "string", "select": "string", "textarea": "string"}
    for field in form.fields:
        expected_type = properties.get(field["name"], {}).get("type")
        if expected_type and wire_types.get(field["type"], field["type"]) != expected_type:
            errors.append(f"field '{field['name']}' type differs: HTML={field['type']} Logic App={expected_type}")
    form_required = {field["name"] for field in form.fields if field["required"]}
    if form_required != set(schema.get("required", [])):
        errors.append(f"required fields differ: form={sorted(form_required)} schema={sorted(schema.get('required', []))}")
    if form.select_options != EXPECTED_SELECTS:
        errors.append(f"select options differ from the canonical stay contract: {form.select_options}")

    if errors:
        print("Canonical stay application contract FAILED:\n", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(f"OK: {len(form.fields)} canonical stay fields, {len(form.select_options)} selects, and redirect-only apply.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())

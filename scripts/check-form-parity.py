#!/usr/bin/env python3
"""Guard against drift between the two copies of the Mt Cottages application form.

``apply.html`` (served on mtcottages.com) and ``infra/azure/apply-proxy/index.html``
(the file the Azure Function serves live at stay.mtcottages.com) both embed the
same inquiry form and must stay in lock-step: same field names, same input
types, same required flags, same select option values in the same order.
This script parses the ``[data-application-form]`` element out of each file
and fails with a readable diff if the two have drifted apart.

The only differences allowed to exist between the two files are the ones
called out in FORM_PARITY_NOTES.md-equivalent documentation (a ``<base href>``
tag and absolute asset URLs in the proxy copy) -- neither of which touches
form fields, so this checker does not need to special-case them.
"""

import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APPLY_HTML = ROOT / "apply.html"
PROXY_HTML = ROOT / "infra" / "azure" / "apply-proxy" / "index.html"

VOID_INPUT_TAGS = {"input"}
FIELD_TAGS = {"input", "select", "textarea"}


class ApplicationFormExtractor(HTMLParser):
    """Extracts field metadata from the form marked with data-application-form."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.form_depth = 0
        self.target_form_depth = None
        self.fields = []  # ordered list of {tag, name, type, required}
        self.select_options = {}  # select name -> ordered list of {value, text}
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
            required = "required" in attrs_dict
            self.fields.append(
                {"tag": tag, "name": name, "type": field_type, "required": required}
            )
            if tag == "select":
                self._current_select_name = name
                self.select_options[name] = []
        elif tag == "option" and self._current_select_name is not None:
            self._current_option_value = attrs_dict.get("value")
            self._current_option_text = []

    def handle_startendtag(self, tag, attrs):
        # Self-closed void tags like <input ... /> never get handle_endtag.
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
            self.select_options[self._current_select_name].append({"value": value, "text": text})
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


def diff_forms(apply_parser: ApplicationFormExtractor, proxy_parser: ApplicationFormExtractor):
    errors = []

    apply_fields = {f["name"]: f for f in apply_parser.fields}
    proxy_fields = {f["name"]: f for f in proxy_parser.fields}

    apply_names = list(apply_fields)
    proxy_names = list(proxy_fields)

    only_in_apply = [n for n in apply_names if n not in proxy_fields]
    only_in_proxy = [n for n in proxy_names if n not in apply_fields]
    if only_in_apply:
        errors.append(f"fields only in apply.html: {only_in_apply}")
    if only_in_proxy:
        errors.append(f"fields only in apply-proxy/index.html: {only_in_proxy}")

    for name in apply_names:
        if name not in proxy_fields:
            continue
        a, p = apply_fields[name], proxy_fields[name]
        if a["tag"] != p["tag"]:
            errors.append(f"field '{name}': tag differs (apply={a['tag']!r} proxy={p['tag']!r})")
        if a["type"] != p["type"]:
            errors.append(f"field '{name}': type differs (apply={a['type']!r} proxy={p['type']!r})")
        if a["required"] != p["required"]:
            errors.append(
                f"field '{name}': required differs (apply={a['required']} proxy={p['required']})"
            )

    common_field_order = [n for n in apply_names if n in proxy_fields]
    proxy_common_order = [n for n in proxy_names if n in apply_fields]
    if common_field_order != proxy_common_order:
        errors.append(
            "field order differs:\n"
            f"    apply.html: {common_field_order}\n"
            f"    apply-proxy/index.html: {proxy_common_order}"
        )

    apply_selects = apply_parser.select_options
    proxy_selects = proxy_parser.select_options
    only_selects_apply = [n for n in apply_selects if n not in proxy_selects]
    only_selects_proxy = [n for n in proxy_selects if n not in apply_selects]
    if only_selects_apply:
        errors.append(f"selects only in apply.html: {only_selects_apply}")
    if only_selects_proxy:
        errors.append(f"selects only in apply-proxy/index.html: {only_selects_proxy}")

    for name in apply_selects:
        if name not in proxy_selects:
            continue
        a_opts = apply_selects[name]
        p_opts = proxy_selects[name]
        if a_opts != p_opts:
            errors.append(
                f"select '{name}': options differ\n"
                f"    apply.html:              {[o['text'] for o in a_opts]}\n"
                f"    apply-proxy/index.html:  {[o['text'] for o in p_opts]}"
            )

    return errors


def main() -> int:
    for path in (APPLY_HTML, PROXY_HTML):
        if not path.is_file():
            print(f"error: {path} does not exist", file=sys.stderr)
            return 1

    apply_parser = extract(APPLY_HTML)
    proxy_parser = extract(PROXY_HTML)

    errors = diff_forms(apply_parser, proxy_parser)
    if errors:
        print("Application form parity check FAILED:\n", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        print(
            "\napply.html and infra/azure/apply-proxy/index.html must keep the same "
            "field names, types, required flags, and select options (in order).",
            file=sys.stderr,
        )
        return 1

    print(
        f"OK: {len(apply_parser.fields)} fields and {len(apply_parser.select_options)} "
        "selects match between apply.html and infra/azure/apply-proxy/index.html"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

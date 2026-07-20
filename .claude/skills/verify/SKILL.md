---
name: verify
description: Run CI-compatible static checks and Playwright E2E tests locally before committing. Use before any push to gh-pages.
---

# /verify

Run the same checks the CI pipeline runs, locally, on the current working tree.

## 1. Static checks

Run these in order:

```bash
# Whitespace/diff hygiene
git diff --check

# Validate Azure JSON files
jq empty infra/azure/mtcottages-intake.definition.json
jq empty infra/azure/mtcottages-intake.parameters.json

# Py_compile all Python files (scripts/ and infra/)
python3 -m py_compile scripts/rebuild-hotelhub-pages.py
python3 -m py_compile scripts/import_sharepoint_photos.rb 2>/dev/null || true
for f in infra/azure/apply-proxy/*.py; do python3 -m py_compile "$f"; done

# HTML validation: every .html must link style.css
# HTML validation: no banned addresses
for f in *.html; do
  grep -q 'assets/css/style.css' "$f" || echo "MISSING style.css: $f"
  grep -qi '255 Court St' "$f" && echo "BANNED ADDRESS: $f" || true
done

# CNAME check
grep -qx 'mtcottages.com' CNAME || echo "CNAME is wrong"

# .nojekyll check
test -f .nojekyll || echo ".nojekyll is missing"
```

Report any failures immediately. Do not proceed to E2E if static checks fail.

## 2. Playwright E2E tests

Start a local server and run site tests:

```bash
cd e2e
npm ci
npx playwright install chromium 2>/dev/null
python3 -m http.server 4173 &
SERVER_PID=$!
cd e2e && npx playwright test tests/site.spec.js
kill $SERVER_PID 2>/dev/null
```

Report the test results. If the user wants to also run live smoke tests (against stay.mtcottages.com):

```bash
cd e2e && BASE_URL=https://stay.mtcottages.com npx playwright test tests/live.spec.js
```

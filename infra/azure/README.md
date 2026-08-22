# Mt Cottages application intake

The application flow has one canonical public surface:

- `https://stay.mtcottages.com/` is the only application page. The Azure Function proxy in `apply-proxy/` serves the complete page, validates submissions, and forwards them to the Logic App.
- The marketing site does not emit `/apply.html`, and the Front Door route does not attach `apply.mtcottages.com`.

## Cloudflare Turnstile

Create a Turnstile widget for the canonical stay host and allow this hostname:

```text
stay.mtcottages.com
```

Set these Azure Function application settings. Keep the secret in the Function App configuration or a referenced secret store; do not commit it.

```text
TURNSTILE_SITE_KEY=<site-key>
TURNSTILE_SECRET_KEY=<secret-key>
TURNSTILE_EXPECTED_ACTION=stay-inquiry
TURNSTILE_ALLOWED_HOSTNAMES=stay.mtcottages.com
ALLOWED_ORIGINS=https://stay.mtcottages.com
LOGICAPP_URL_APPLICATION=<logic-app-trigger-url>
```

If either Turnstile value is missing, the Function returns `503 Application form unavailable` rather than rendering a disabled form or advertising an email fallback.

## Dynamics 365 / Dataverse ownership

Deploy `mtcottages-intake.definition.json` with `mtcottages-intake.parameters.json`. The workflow parameter `d365BusinessUnitName` is explicitly set to `MtCottages`. Before deployment, confirm that the Dataverse business unit display name matches that value exactly.

The workflow first looks up that business unit, then finds its default owner team, and assigns the created lead to that team through `ownerid@odata.bind`. The Dynamics connection therefore needs permission to read business units and teams and to create and assign leads. If the business unit or default owner team is missing, the workflow returns a configuration error instead of creating an unowned lead.

The existing `dynamicscrmonline` connection and `d365Organization` parameter remain in use so this change fits the current Logic App deployment. No CRM secrets or connection IDs should be added to source control.

## Live deployment / runbook

The Function App is Linux Consumption. Zip the contents of `apply-proxy/` so that `function_app.py`, `host.json`, `requirements.txt`, and `index.html` are at the archive root, then use remote build:

```bash
az functionapp deployment source config-zip \
  --resource-group <resource-group> \
  --name <function-app-name> \
  --src <path-to-apply-proxy.zip> \
  --build-remote true
```

Required application-setting names for the proxy (provision the values out of band):

```text
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
TURNSTILE_EXPECTED_ACTION
TURNSTILE_ALLOWED_HOSTNAMES
ALLOWED_ORIGINS
LOGICAPP_URL_APPLICATION
```

Provision the real Turnstile site and secret values separately in the Function App configuration or a referenced secret store. Never commit those values, a populated settings export, or secrets in the deployment zip.

### Front Door sequence

1. Confirm `mtcottages-apply-route` is HTTPS-only and attaches only `stay.mtcottages.com`.
2. Confirm the `SecurityHeaders` ruleset is attached to the live route and the Standard WAF policy association includes the stay custom domain.
3. Deploy the zip, then smoke-test the canonical stay page, Turnstile asset loading, and the application endpoint through Front Door.
4. Keep the direct-origin restriction staged until those smoke checks pass. Apply the origin lock last, then repeat the canonical and application-edge smoke checks through Front Door.

### Release checklist and rollback

- [ ] The zip has the app files at its root and remote build is enabled.
- [ ] All required setting names are present; Turnstile values were provisioned separately and are not in source control.
- [ ] Front Door route, `SecurityHeaders` ruleset, and WAF domain associations are verified before enabling the origin lock.
- [ ] Canonical, form, Turnstile, and invalid-submission smoke checks pass after deployment and again after the origin lock.

If smoke checks fail, redeploy the previous known-good zip with the same command, leave the direct-origin restriction staged (or revert the latest edge change), and repeat the smoke checks before reopening the path.

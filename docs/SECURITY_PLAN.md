# SECURITY PLAN — REALTOR SHAMRAIZ

**Last updated:** 2026-09-08

A static site has a small attack surface — but it handles personal data from
lead forms, and it represents a business whose reputation depends on trust.

---

## 1. Threat model

| Threat | Relevance | Mitigation |
|---|---|---|
| XSS via injected content | Medium — user input rendered in the concierge and form previews | No `innerHTML` with user data; `textContent` only; strict CSP |
| Form spam / bot submissions | High | Honeypot + timing check + rate limiting at the endpoint |
| Lead data interception | High | HTTPS enforced, HSTS, no data in URLs |
| Lead data leakage to third parties | High | No analytics or third-party script receives form content |
| Supply-chain (dependency) compromise | Medium | Lockfile, minimal deps, `npm audit`, no runtime deps |
| Third-party script compromise | Medium | Strict CSP allowlist; SRI on any external script |
| Clickjacking | Low | `frame-ancestors 'none'` |
| MIME sniffing | Low | `X-Content-Type-Options: nosniff` |
| Referrer leakage | Medium | `Referrer-Policy: strict-origin-when-cross-origin` |
| Open redirect | Low | No redirect parameters accepted |
| Tabnabbing | Low | `rel="noopener noreferrer"` on all external links |
| Exposed secrets in the repo | Medium | No secrets in a static build; endpoint keys are public by design and must be rate-limited server-side |

## 2. HTTP security headers

Configured at the host (`_headers` / `netlify.toml` / equivalent).

```
Content-Security-Policy: default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' [FORM_ENDPOINT_ORIGIN];
  frame-src https://www.google.com;
  form-action 'self' [FORM_ENDPOINT_ORIGIN];
  frame-ancestors 'none';
  base-uri 'self';
  object-src 'none';
  upgrade-insecure-requests
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
X-Frame-Options: DENY
```

Notes:
- `style-src 'unsafe-inline'` is required only if inline critical CSS is used;
  prefer a nonce or hash and remove it.
- `frame-src` is allowed **only** if the Google Maps embed is used. Remove otherwise.
- `[FORM_ENDPOINT_ORIGIN]` — `[CONTENT REQUIRED]`.
- **CSP is verified with a real report before launch**, not assumed to work.

## 3. Data handling

### 3.1 What is collected
Name, phone, and optionally email, message, and property preferences — submitted
voluntarily via a lead form.

### 3.2 Handling rules
- Transmitted over HTTPS to the form endpoint only
- **Never** written to `localStorage`, `sessionStorage`, cookies, or IndexedDB
- **Never** placed in a URL, query string, or fragment
- **Never** included in an analytics event payload
- **Never** logged to the console
- Held in memory only for the duration of the submission
- WhatsApp deep links are user-initiated: nothing is transmitted until the user taps

### 3.3 Consent
- Explicit, unchecked-by-default consent checkbox before submission
- Consent text states what the data is used for and who receives it
- Privacy policy linked adjacent to the checkbox
- Consent is not bundled with marketing opt-in — separate checkboxes

### 3.4 Retention
Retention and deletion are governed by the client's chosen form endpoint / inbox
and are outside the site's control. The privacy policy must state the actual
retention period: `[CONTENT REQUIRED]`.

## 4. Form endpoint requirements

The chosen provider (`[CONTENT REQUIRED]`) must support:
- [ ] HTTPS only
- [ ] Server-side rate limiting per IP
- [ ] Spam filtering
- [ ] Domain allowlisting (rejects submissions from other origins)
- [ ] No public exposure of submitted data
- [ ] A documented data-retention and deletion policy
- [ ] A processing location compatible with the client's obligations

If none is available, the fallback is WhatsApp-only submission with `mailto:`
as a secondary — less convenient, but it removes third-party data handling
entirely.

## 5. Client-side input safety

Even without a backend, injected input reaches the DOM (concierge echo, form
review states, filter values in the URL).

- User input is inserted with `textContent`, never `innerHTML`
- No `eval`, `new Function`, or `setTimeout` with a string
- URL parameters are validated against an allowlist before use — a filter value
  not in the known set is discarded, not rendered
- No user input is used to construct a selector, URL path, or attribute name
- WhatsApp message content is `encodeURIComponent`-encoded

## 5a. AI-generated content is not verified data (master requirements §50)

This applies to two distinct things and neither gets a pass:

- **The concierge's own output** is not a risk here by construction — it is
  scripted, not generated (`AI_AGENT_SPEC.md` §1) — but if an LLM backend is
  ever added later, its output becomes untrusted input the moment it's
  generated: never inserted as `innerHTML`, never treated as a fact source for
  `Listing`/`BusinessConfig`/`InvestmentSnapshot` data, always passed through
  the same validation as visitor-submitted text.
- **Content drafted with AI tooling during the build of this site** (copy,
  code, or docs) is a *draft*, not a source. It carries no evidentiary weight
  toward a business fact — the `[CONTENT REQUIRED]` discipline and
  `docs/COPY_DECK.md` traceability rules apply to it exactly as they would to
  a guess with no AI involved at all. Only a client-supplied source code
  (`C1`, `C2`, `BR`, ...) makes a claim shippable.

## 6. Dependencies

- Build-time only; **zero runtime dependencies** targeted
- `package-lock.json` committed
- `npm audit` clean at every release; no unresolved high or critical advisories
- Every dependency justified in `TECH_ARCHITECTURE.md` §8
- No dependency added mid-phase without review
- Dependabot or equivalent enabled

## 7. Third-party content

- No third-party script ships without a `SECURITY_PLAN.md` entry and a CSP allowance
- Any external script carries Subresource Integrity
- Fonts and assets self-hosted where possible
- Google Maps embed is lazy-loaded and CSP-scoped, or replaced with a static
  image + directions link to avoid the third-party frame entirely

## 8. Repository and secrets

- **This directory is not yet under version control.** Initialising git is a
  prerequisite (`PHASE_00_AUDIT.md`).
- `.gitignore` must cover `node_modules/`, `dist/`, `.env*`, editor and OS
  artifacts, and the stray `WPS Cloud Files/` cache directory
- No credentials, tokens, or API keys committed
- A static build cannot hold a secret — anything shipped to the browser is public

## 9. Pre-launch security checklist

- [ ] HTTPS enforced; HTTP redirects to HTTPS
- [ ] All headers in §2 present and verified with an external scanner
- [ ] CSP produces zero violations across all routes
- [ ] No mixed content
- [ ] All external links carry `rel="noopener noreferrer"`
- [ ] No personal data in storage, URLs, or analytics — verified in DevTools
- [ ] Form endpoint rate-limited and domain-locked
- [ ] Honeypot and timing check functional
- [ ] `npm audit` clean
- [ ] No secrets in the repository or the built output
- [ ] Privacy policy accurate and matching actual behaviour
- [ ] Consent flow functional and accessible
- [ ] 404 and error pages leak no internal information

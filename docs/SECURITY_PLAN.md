# SECURITY PLAN — REALTOR SHAMRAIZ

**Last updated:** 2026-09-13

A static site has a small attack surface — but it handles personal data from
lead forms, and it represents a business whose reputation depends on trust.

**As of 2026-09-13 there is also a backend** (`server/`, see
`TECH_ARCHITECTURE.md` §9 and `plans/MASTER_PLAN.md` D-28), which adds a real
server attack surface: authentication, file uploads, and a database holding
lead data. §10 below covers it; the rules for the static frontend are unchanged.

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

**Resolved 2026-09-13:** the endpoint is this project's own backend
(`POST /api/v1/public/leads`), not a third-party provider — see §10. The
checklist below is kept as the standard it must meet, and it does: HTTPS in
production, per-IP rate limiting, honeypot + timing spam checks, a CORS origin
allowlist, no public exposure of submissions, and data held in a database the
client controls (retention policy still `[CONTENT REQUIRED]`).

The original requirement, for reference — any provider must support:
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

- **Frontend:** build-time only; **zero runtime dependencies** targeted.
  The backend (`server/`) has its own justified list — see
  `TECH_ARCHITECTURE.md` §9 — and is audited by the same rules below.
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

- This directory **is** under version control (git), resolving the
  `PHASE_00_AUDIT.md` prerequisite.
- `.gitignore` covers `node_modules/`, `dist/`, `.env*` (with `.env.example`
  explicitly re-included), uploaded media under `server/storage/`, editor and
  OS artifacts, and the stray `WPS Cloud Files/` cache directory
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

## 10. Backend security (added 2026-09-13)

The form-endpoint requirements in §4 are now satisfied in-house rather than by
a third party: submissions go to this project's own `POST /api/v1/public/leads`.

### 10.1 Authentication and sessions
- Passwords hashed with **bcrypt** (12 rounds, via the pure-JS `bcryptjs`
  build). No password, hash, or token is ever stored in
  `localStorage`/`sessionStorage`.
- Session = a short-lived **JWT access cookie** (15 min) plus an **opaque
  refresh cookie** (14 days). Both `httpOnly`, `SameSite=Lax`, and `Secure` in
  production — unreadable by JavaScript, so an XSS bug cannot exfiltrate them.
- Refresh tokens are stored only as SHA-256 hashes and **rotate on every use**,
  with the replaced token recorded — so a stolen refresh token is revocable,
  which a bare stateless JWT is not.
- First-run account creation (`/auth/setup`) is refused once any user exists.
- The seed script refuses to create an admin without an explicitly supplied
  password — there is no default credential to forget to change.

### 10.2 Request-level protections
- **CSRF:** every state-changing request must carry `X-Admin-Request: 1`. A
  cross-site form post or injected `<img>`/`<script>` cannot set a custom
  header, and `SameSite=Lax` already blocks the cookie on cross-site
  subrequests.
- **Rate limiting:** 300 req/15 min globally, 20/15 min on login and refresh,
  5/10 min on public lead submission.
- **Validation:** every request body, query and param is parsed by a Zod schema
  before it reaches a handler.
- **Error handling:** one central handler. Stack traces, driver errors and file
  paths are never returned to a client; unexpected errors are logged and
  answered with a bare `500`.
- **Headers:** `helmet` defaults plus a `default-src 'none'` CSP (the API
  serves no markup of its own). CORS is locked to an explicit origin
  allowlist with credentials enabled — never `*`.

### 10.3 Uploads and files
- MIME allowlist (images, video, PDF/Word/text) enforced from the file's own
  declared type, never a client-supplied "kind" field; per-kind size caps.
- Stored filenames are generated (UUID + sanitized slug), so a crafted
  `../../` filename cannot escape the storage directory.
- Property documents are **always** `isPrivate` — the API ignores any client
  attempt to set that flag — and their bytes are only streamed to an
  authenticated request.

### 10.4 Lead data
- §3.2's rule stands and is now easier to honour: visitor data goes to the
  server over HTTPS and is never written to browser storage.
- Anti-spam is honeypot + submission-timing, checked server-side. A failing
  submission gets an ordinary success response and is discarded, so a bot
  learns nothing about which check caught it.
- Consent is required by the schema; a submission without it is rejected.

### 10.5 Secrets
- `.env` is gitignored; `.env.example` carries placeholders only.
- JWT secrets must be replaced with real random values before any deployment;
  the app refuses to start if they are shorter than 16 characters.

# ThriftNest — Secure Web Application: Report Working Document

> **How to use this file.** This is a *scaffold*, not a finished report. Every
> section states what the marker is looking for, gives the **accurate technical
> facts about your own system** so you don't misdescribe it, and marks with
> **`✍️ WRITE:`** the places where *your own analysis and wording* must go.
> The brief penalises AI-generated prose and requires you to defend the work on
> camera — so treat the facts here as correct raw material you must turn into
> your own argument. Delete this box before submission.
>
> **Legend:** `✍️ WRITE:` = your analysis/prose · `📸 FIGURE:` = insert screenshot ·
> `📌 CITE:` = add an in-text citation (CU Harvard/APA).

---

## 1. Cover Page

- Module title and code · Coursework title: *Secure Web Application Development & Internal Penetration Testing*
- Application name: **ThriftNest** — a second-hand marketplace
- Student name, ID, cohort · Submission date · Word count
- GitHub repository: `https://github.com/Roshan10k/thriftnest`
- Declaration of academic integrity (module template)

📸 FIGURE: ThriftNest landing page (hero) as the cover visual.

---

## 2. Abstract

150–250 words. Write **last**, once every section is final.

✍️ WRITE: One paragraph covering — the problem ThriftNest solves; that it was
custom-built (MERN-style: React + Express + MongoDB, Onion architecture); the
headline security posture (cookie-based sessions, MFA, RBAC, bcrypt, rate
limiting + lockout, activity logging); that an internal white-box penetration
test was performed; and the key outcome (N vulnerabilities found and remediated,
retested). Keep it factual and specific — no marketing language.

---

## 3. Table of Contents

Auto-generate in Word (Insert → Table of Contents) once headings use Word styles.
Do not hand-type page numbers.

---

## 4. Table of Figures

Auto-generate from Word captions. Caption **every** screenshot as
`Figure N: <description>`. Every figure must be referenced by number in the body.

---

## 5. Table of Abbreviations

| Abbreviation | Meaning |
|---|---|
| API | Application Programming Interface |
| ASVS | Application Security Verification Standard (OWASP) |
| CSRF | Cross-Site Request Forgery |
| CVSS | Common Vulnerability Scoring System |
| DTO | Data Transfer Object |
| IDOR | Insecure Direct Object Reference |
| JWT | JSON Web Token |
| MFA | Multi-Factor Authentication |
| MITM | Man-in-the-Middle |
| ODM | Object–Document Mapper (Mongoose) |
| OTP | One-Time Password |
| RBAC | Role-Based Access Control |
| SPA | Single-Page Application |
| TOTP | Time-based One-Time Password |
| XSS | Cross-Site Scripting |

---

## 6. Introduction

Covers brief requirements 1.1–1.4 (problem, justification, uniqueness, emerging
tech / sustainability).

**Accurate facts to build on:**
- **Problem / user need:** buying and selling second-hand goods online, oriented
  to a Nepali context (prices in NPR; local delivery cities such as Kathmandu,
  Lalitpur, Bhaktapur, Pokhara). Trust and safety are the core problem: buyers
  and sellers who don't know each other must transact, communicate, and resolve
  disputes safely.
- **Why it's necessary / benefit:** reduces waste (circular economy — extends
  product life), improves affordability, and gives sellers a low-friction resale
  channel with built-in messaging, offers/negotiation, and order tracking.
- **Uniqueness:** custom auth, business logic (offer negotiation with a
  server-authoritative agreed price, listing reservation on order, delivery
  lifecycle) and a security-first build — not a template or CMS.
- **Emerging tech / sustainability:** the circular-economy angle; TOTP-based
  passwordless-adjacent second factor; a zero-trust session model (see §8).

✍️ WRITE: 1–1.5 pages turning the above into a reasoned argument. State the
target users (buyer, seller, admin) and one concrete scenario each. 📌 CITE a
source on second-hand/circular-economy value and one on marketplace trust.

---

## 7. Software Details

Covers the stack, roles, and core features. Keep it precise — the marker checks
this against the repo.

**Architecture:** decoupled SPA frontend + REST API backend, **Onion / layered
architecture** on the server:
`domain` (entities, repository interfaces) → `application` (services, DTOs,
interfaces, errors) → `infrastructure` (Mongoose models, Mongo repositories,
concrete services) → `presentation` (controllers, routes, middleware).

**Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, React Router.
Dependencies: `react`, `react-dom`, `react-router-dom`, `lucide-react`.

**Backend:** Node.js + Express + TypeScript, MongoDB via Mongoose.
Security-relevant dependencies: `bcryptjs` (hashing), `jsonwebtoken` (JWT),
`otplib` + `qrcode` (TOTP MFA), `helmet` (headers), `cors`, `cookie-parser`,
`express-rate-limit`, `zod` (validation), `multer` (uploads), `nodemailer`,
`morgan` (logging).

**User roles:** `buyer`, `seller`, `both`, `admin` (least-privilege — see RBAC).

**Core features (map each to a page/endpoint):** registration + login (+ MFA),
password reset via emailed OTP, browse/search/filter listings, listing CRUD
(seller), wishlist, checkout + order lifecycle (pending → confirmed → shipped →
delivered), offer negotiation in messaging, reviews + seller ratings,
notifications, activity logging, admin console, self-service data export.

📸 FIGURE: a component/architecture diagram (draw in draw.io) — see §8.1.
✍️ WRITE: a short "usability & accessibility" subsection (brief 2.1–2.3): note
the consistent component library, role-aware navigation, keyboard-operable forms,
and an accessibility test you actually ran (e.g., Lighthouse/axe) with findings.
📸 FIGURE: Lighthouse/axe accessibility result.

---

## 8. Design and Implementation

The heaviest-weighted technical section. Sub-parts below map to the brief's
design-and-implementation requirements 1–6.

### 8.1 System architecture and component interactions

✍️ WRITE + 📸 FIGURE: an architecture diagram showing Browser (SPA) → HTTPS →
Express API → Mongoose → MongoDB, plus external touchpoints (SMTP for OTP email,
local disk `/uploads` for images). Then a **request lifecycle** walkthrough for
one authenticated request, naming the middleware order actually used in
`backend/src/app.ts`:
`helmet` → `cors(credentials, origin allow-list)` → static `/uploads` →
`express.json` → `cookie-parser` → route → `authenticate` middleware →
controller → service → repository → Mongoose.

Data model: collections are User, Listing, Order, Transaction, Message,
Conversation, Review, Wishlist, Notification, ActivityLog. 📸 FIGURE: an ER-ish
diagram of these and their references.

### 8.2 Security-by-design decisions and threat modeling

✍️ WRITE the reasoning; the **STRIDE starter** below is accurate to your build —
expand each row with your own explanation and reference the code in §8.4.

| STRIDE category | Threat in ThriftNest | Mitigation implemented | Where |
|---|---|---|---|
| **S**poofing | Credential theft / impersonation | bcrypt-hashed passwords; JWT identity; TOTP MFA; account lockout | `BcryptHashService`, `AuthService`, `OtplibMfaService` |
| **T**ampering | Forged/altered tokens; price tampering on negotiated orders | Signed JWTs; **server-authoritative agreed price** validated against the conversation | `JwtTokenService`, `OrderService.create` |
| **R**epudiation | User denies an action | Activity logging of auth events with IP + user-agent | `ActivityLog*`, `AuthService` |
| **I**nformation disclosure | Leaking secrets/PII | Secrets stripped in Mongoose `toJSON` (passwordHash, mfaSecret, backupCodes, passwordHistory); HttpOnly cookies keep tokens out of JS | `UserModel` transform, `AuthController` cookies |
| **D**enial of service | Brute force / request floods | `express-rate-limit` (global + strict auth limiter); per-account lockout after 5 fails | `rateLimit.ts`, `AuthService` |
| **E**levation of privilege | Buyer granting themselves seller/admin | `role` removed from self-service profile DTO; `RequireAdmin`/`requireAdmin` guards; per-request token-version re-check | `user.dto.ts`, `App.tsx`, `auth.ts` middleware |

### 8.3 Analysis of security risks and mitigations

✍️ WRITE: for each of the OWASP Top 10 (2021) categories relevant to your app
(A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04
Insecure Design, A05 Security Misconfiguration, A07 Auth Failures), state the
risk, your mitigation, and any residual risk. 📌 CITE OWASP Top 10 and ASVS.

**Accurate mitigations you can claim (verify each in code before writing):**
- **Access control (A01):** route guards (`RequireAuth`, `RequireAdmin`,
  `SellerRoute`) on the client; `authenticate` + `requireAdmin` on the server;
  per-resource ownership checks in services (e.g., only the seller edits a
  listing; only the order's buyer/seller change its status; only the buyer
  reviews). IDOR-resistant because every mutating handler re-checks ownership,
  not just authentication.
- **Cryptographic failures (A02):** bcrypt (cost 12) for passwords; JWT secrets
  from env; HttpOnly + SameSite=Lax cookies (+ Secure in production).
  *Residual:* MFA secret currently stored unencrypted at rest (planned:
  application-layer encryption — note honestly as a limitation/finding).
- **Injection (A03):** Mongoose parameterised queries (no string-built queries);
  Zod schema validation on every request body; regex search input is escaped
  before building the query.
- **Insecure design (A04):** Onion architecture isolates domain logic;
  server-authoritative pricing for negotiated orders; listing reservation
  prevents double-purchase.
- **Misconfiguration (A05):** `helmet` security headers; CORS locked to an
  origin allow-list; ETag disabled to prevent stale-auth 304s; secrets in
  `.env` (git-ignored) with a committed `.env.example` template.
- **Auth failures (A07):** password policy (length + complexity + strength
  meter), reuse prevention (last 5), rate limiting, lockout, MFA, OTP reset.

### 8.4 Code-level examples of security mechanisms

Include **short, real** snippets (5–15 lines each) with a one-line explanation
and a `file:line` reference. Suggested set (all real in your repo):

1. **Password hashing** — `BcryptHashService.hash` (cost from `BCRYPT_ROUNDS`, default 12).
2. **HttpOnly cookie issuance** — `AuthController` `setAuthCookies` (httpOnly, sameSite, secure-in-prod).
3. **Zero-trust auth middleware** — `authenticate` in `middleware/auth.ts`
   (verifies JWT *and* re-checks `tokenVersion` against the DB every request).
4. **Server-side session invalidation** — `AuthService.logout` bumps
   `tokenVersion`; refresh rejects mismatched versions.
5. **TOTP verification** — `OtplibMfaService.verifyToken`.
6. **Input validation** — a Zod DTO, e.g. `RegisterDto` (password regex rules).
7. **Privilege-escalation prevention** — `UpdateProfileDto` deliberately omits `role` (with the code comment).
8. **Password reuse prevention** — `UserService.changePassword` loop over `getPasswordHashes`.
9. **Rate limiting** — `rateLimit.ts` (`globalRateLimit`, `authRateLimit` with `skipSuccessfulRequests`).
10. **Secret redaction** — `UserModel` `toJSON` transform deleting sensitive fields.

📸 FIGURE for each: a clean editor screenshot of the snippet (readable font).

### 8.5 Mapping of GitHub commits to security decisions

Build this table from the real history (`git log`). Security-relevant commits so
far (more will land as the pen-test fixes are committed):

| Date | Commit | Security decision it evidences |
|---|---|---|
| 2026-07-02 | `Add the authentication context provider…` | Session handling foundation |
| 2026-07-04 | `Add the login and registration pages with client-side form validation` | Input validation at the edge |
| 2026-07-04 | `Add the password reset and two-factor backup code pages` | MFA + account recovery UX |
| 2026-07-10 | `Guard authenticated and admin-only routes and align password validation…` | RBAC route guards; client/server password-rule parity |
| 2026-07-11 | `Add the bcrypt hashing, JWT token, TOTP, email and file storage services` | Cryptographic + MFA services |
| 2026-07-12 | `Add the authentication and user services with token-version sessions and password reuse prevention` | Zero-trust sessions; password history |
| _(pending)_ | Cookie-based session migration | HttpOnly/SameSite session hardening |
| _(pending)_ | Remove role from profile DTO | Privilege-escalation fix (also a pen-test finding) |
| _(pending)_ | Rate-limit tuning | Brute-force hardening for submission |

✍️ WRITE: 1–2 sentences per key row explaining the *decision*, not just the diff.

### 8.6 Discussion of integrated emerging technologies / sustainability

✍️ WRITE: circular-economy framing; TOTP second factor; zero-trust
"never trust, always verify" session model (per-request revocation check).
📌 CITE NIST SP 800-63B for the authentication choices and a zero-trust source
(e.g., NIST SP 800-207).

---

## 9. Secure Development and Internal Penetration Testing

### 9.1 Secure development evidence (brief 4.1–4.6)

- **Source control:** GitHub, 50+ meaningful commits, incremental history.
- **Incremental security improvements / vuln fixes in history:** point at the
  guard/validation/session/reuse commits and the pen-test fix commits.
- **Containerisation:** _(Day 14 — Dockerfile + docker-compose for app + Mongo)._
  📸 FIGURE: `docker compose up` running.
- **CI/CD with automated security checks:** _(Day 14 — GitHub Actions running
  `npm audit`, lint, typecheck)._ 📸 FIGURE: green Actions run.

### 9.2 Penetration test — methodology

✍️ WRITE: define **scope** (the ThriftNest app on localhost; auth, authz,
business logic, input validation, session, client-side, API), **assumptions**,
and **ethical guidelines** (testing only your own system, no third parties).
State the methodology: **white-box**, manual-primary, using source review +
targeted requests, supplemented by automated tools (`npm audit`; optionally OWASP
ZAP baseline). 📌 CITE OWASP WSTG (Testing Guide) and PTES.

### 9.3 Documented vulnerabilities (brief: name, CVSS v3.1, exploit, evidence, fix, retest)

> **✅ Drafted:** the two required findings are written up in full (CVSS v3.1
> vectors + scores, exploitation path, remediation, retest) in
> **`docs/pentest-findings.md`** — **V1: Privilege Escalation via Mass Assignment
> (5.4 Medium)** and **V2: Insecure Session-Token Storage + Non-Revocable
> Sessions (6.8 Medium)**. Fold those into this section, insert the captured
> figures, and add the fix-commit hashes once committed.

You have **real before/after material from this build**. Write up at least two in
full (the video needs two before/after). Strong candidates — each was genuinely
present and genuinely fixed:

| # | Vulnerability | OWASP / category | Rough CVSS v3.1 | Status |
|---|---|---|---|---|
| V1 | **Privilege escalation via mass assignment** — profile update accepted `role`, letting a buyer self-promote | A01 Broken Access Control / mass assignment | ~8.1 High (`AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`) — *recompute yourself* | Fixed (role removed from DTO) |
| V2 | **Session tokens in `localStorage`** — XSS-exfiltratable, no server-side invalidation | A02/A07 / session management | ~6.5 Medium — *recompute* | Fixed (HttpOnly cookies + tokenVersion revocation) |
| V3 | **Frontend/backend password-policy mismatch** — a "very strong" password could be rejected by the server; weak-policy edge | A07 Auth Failures | Low — *recompute* | Fixed (aligned rules + lowercase check) |
| V4 | **CORS bound to the wrong dev origin** — requests silently failed / mis-trusted origin | A05 Misconfiguration | Low/Info — *recompute* | Fixed (localhost allow-list in dev, pinned in prod) |
| V5 | **No password reuse prevention** | A07 | Low | Fixed (history of last 5) |

For each written-up finding include: **name + category + CVSS v3.1 vector and
score** (compute at the FIRST.org calculator — 📌 CITE it); **technical
explanation + exploitation path**; **evidence** (📸 request/response or payload +
code snippet); **remediation** (the commit + code); **retest evidence** (📸
showing it now blocked). Keep the before/after deterministic and repeatable.

✍️ WRITE: also cover the categories the brief lists even where you found nothing
exploitable (e.g., injection — explain *why* Mongoose+Zod prevents it), so
coverage is visible.

---

## 10. Proof of Concept (video)

Compulsory video. Checklist (brief section 5):
- Face visible, clear uninterrupted audio, **closed captions**, Google Drive
  share with **editor** permission.
- Demonstrate the security controls live: registration + password policy, login,
  **MFA enrol + login with TOTP**, account lockout after failed logins, RBAC
  (a buyer blocked from an admin route/API), session logout invalidation.
- Show **two vulnerabilities before and after the fix** (use V1 and V2 above).
- Explain, in your own words, **how you discovered each, the root cause, and the
  mitigation**.

✍️ WRITE: a shot-list / script so the recording is tight and repeatable.

---

## 11. Conclusion

✍️ WRITE: what was achieved against the objectives; the strongest security
properties; honest limitations (e.g., simulated payments, MFA secret not yet
encrypted at rest, no real email delivery in dev); and concrete future work.
No new facts — synthesise.

---

## 12. References

Minimum 15, CU Harvard or CU APA, cited in-text. Starter set (read and cite the
ones you actually use — mix of standards, OWASP, books, papers, vendor):

1. OWASP (2021) *OWASP Top 10:2021*. Available at: https://owasp.org/Top10/
2. OWASP (2019) *Application Security Verification Standard (ASVS) 4.0*.
3. OWASP *Authentication Cheat Sheet*. OWASP Cheat Sheet Series.
4. OWASP *Session Management Cheat Sheet*.
5. OWASP *Password Storage Cheat Sheet*.
6. OWASP *Authorization Cheat Sheet* / *Access Control*.
7. OWASP *Web Security Testing Guide (WSTG) v4.2*.
8. NIST (2017) *SP 800-63B: Digital Identity Guidelines — Authentication and Lifecycle Management*.
9. NIST (2020) *SP 800-207: Zero Trust Architecture*.
10. M'Raihi, D. et al. (2011) *RFC 6238: TOTP: Time-Based One-Time Password Algorithm*. IETF.
11. Jones, M., Bradley, J. and Sakimura, N. (2015) *RFC 7519: JSON Web Token (JWT)*. IETF.
12. Provos, N. and Mazières, D. (1999) 'A Future-Adaptable Password Scheme', *USENIX Annual Technical Conference*.
13. Stuttard, D. and Pinto, M. (2011) *The Web Application Hacker's Handbook*. 2nd edn. Wiley.
14. McDonald, M. (2020) *Web Security for Developers*. No Starch Press.
15. FIRST.org *Common Vulnerability Scoring System v3.1: Specification & Calculator*.
16. Mozilla *MDN Web Docs: Set-Cookie / HttpOnly / SameSite*.
17. PortSwigger *Web Security Academy*.
18. MongoDB Inc. *MongoDB Security Checklist*; Express.js *Security Best Practices*.

---

### Appendix — evidence log (keep as you go)
Track every screenshot so figures stay deterministic: filename · what it shows ·
exact steps to reproduce · date. This is how you satisfy the "deterministic and
repeatable" evidence requirement.

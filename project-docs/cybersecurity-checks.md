Perfect—here is a **professional, detailed** `cybersecurity-checks.md` designed for a production LMS with payments, user data, and certificates. You can publish this inside your repo or Notion as your official security checklist.

---

# ✅ **cybersecurity-checks.md — Soliel AI**

**Version:** 1.0
**Owner:** Habib Tanwir Laskar
**Applies to:** Frontend, Backend, Database, CI/CD, Payment infrastructure

Purpose: ensure Soliel AI remains secure against data breaches, account takeover, payment fraud, SQL injection, RCE, XSS, CSRF, and supply-chain attacks.

---

## ✅ 1. Authentication & Identity Security

### ✔ Using Clerk

* [ ] Disable public access for protected routes using **middleware** with role-based gating.
* [ ] Prevent direct JWT manipulation on client — trust only **Clerk server-side validations**.
* [ ] Rotate Clerk secret occasionally.
* [ ] Force email verification for instructors/company admins.
* [ ] Enforce strong password policy if password login enabled.

### ✔ Session Security

* [ ] `clerk_user_id` stored in DB but **never trust client to provide it** — always compute server-side.
* [ ] Never use localStorage for auth tokens.
* [ ] Use HTTP-only secure cookies (Clerk handles this by default).

---

## ✅ 2. Database & Supabase Security

### ✔ Row Level Security (RLS)

* [ ] RLS enabled on all tables that contain private data: `profiles`, `enrollments`, `lesson_progress`, `payments`, `orders`, `assignments`, `company_members`.
* [ ] Public tables (like `courses` when published) may have open SELECT.
* [ ] Students can only:

  * [ ] Read their own progress
  * [ ] Read/purchase public courses
  * [ ] Write only to their own `lesson_progress` and `reviews`
* [ ] Instructor write access restricted to their own course rows.
* [ ] Company admin read/write only for their employees.

### ✔ Service Role Keys

* [ ] **Never** expose Supabase service key in browser.
* [ ] Service key used only inside:

  * Next.js **server actions**
  * Webhook handlers
  * Cron tasks (future)

### ✔ SQL Injection Defense

* [ ] Always use Supabase client bindings instead of string concatenation.
* [ ] Validate external IDs using UUID format before DB query.

---

## ✅ 3. Payments & Stripe Security

* [ ] Verify webhook signature using `STRIPE_WEBHOOK_SECRET`.
* [ ] Webhook endpoint is **public**, but:

  * [ ] Only accepts verified signed events
  * [ ] Reject unverifiable requests with 400
* [ ] Order → payment → enrollment flow triggered **only via webhook**, not client.
* [ ] No sensitive card info ever touches LMS (handled fully by Stripe).
* [ ] Mark payments failed if `payment_intent.payment_failed`.

### Anti-Fraud Measures

* [ ] Stripe Radar enabled
* [ ] Only “paid” orders create enrollments
* [ ] Store all gateway metadata for dispute handling

---

## ✅ 4. File Upload / Storage Security

* [ ] Store lessons/videos in **private** Supabase bucket (no open public URLs).
* [ ] Serve to enrolled students only using **signed URLs** that expire (e.g. 10 mins).
* [ ] Scan uploaded files (server-side or trusted video providers).
* [ ] Certificates can be public but should not reveal personal data beyond name + course.

---

## ✅ 5. API / Route Security

### Server Actions

* [ ] All write operations inside server actions—not client
* [ ] Validate ownership before mutating DB
* [ ] Reject missing or mismatched session

### API Routes

* [ ] `/api/stripe/webhook` only accepts POST + verified signatures
* [ ] `/api/upload` checks user role + MIME type before generating signed upload URL
* [ ] `/api/orders/create` validates purchase payload with zod (or similar)

---

## ✅ 6. Frontend Security

### Cross-Site Scripting (XSS)

* [ ] Never `dangerouslySetInnerHTML` unless sanitized
* [ ] Render blog/course descriptions using markdown sanitizers
* [ ] Escape user-generated reviews and Q/A posts

### CSRF

* [ ] Payment flow uses Stripe client secret → not vulnerable to CSRF
* [ ] Server actions bind session → not callable by anonymous users

### Clickjacking

* [ ] Add security headers via Next.js middleware

  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  ```

---

## ✅ 7. Secrets Management

* [ ] Environment variables stored ONLY in Vercel → Project Settings → Environment Variables
* [ ] Never commit `.env.local` to Git
* [ ] Rotate Stripe keys if shared accidentally
* [ ] Rotate Supabase service role on developer departure

---

## ✅ 8. Access Logging & Audit Trails

* [ ] Log critical actions to `app.events` table:

  * payment_success
  * lesson_completed
  * certificate_issued
  * instructor_course_publish
* [ ] Log unknown webhook events
* [ ] Admin dashboard displays payment error logs for debugging

---

## ✅ 9. HTTPS Everywhere

* [ ] Vercel uses HTTPS automatically
* [ ] Check no mixed-content warnings
* [ ] External resources must use HTTPS CDN (fonts, scripts, storage)

---

## ✅ 10. Dependency & Supply-Chain Security

* [ ] Check vulnerability reports using Dependabot or Renovate
* [ ] Avoid random npm packages with low downloads
* [ ] Pin critical versions (stripe, clerk, supabase, next, tailwind)
* [ ] Enable `npm audit` in CI
* [ ] Use `pnpm` or `yarn` lock to prevent version drift

---

## ✅ 11. Backups & Disaster Recovery

* [ ] Enable Supabase automated backups
* [ ] Export daily CSV of payments & enrollments
* [ ] Keep PDF certificates recreatable, not only stored

---

## ✅ 12. Rate Limiting & Abuse Prevention

* [ ] Add simple rate limit on public API:

  * `/api/orders/create`
  * `/api/upload`
  * `/sign-in` / `/sign-up` (Clerk handles brute force)
* [ ] Block repeated webhook failures

---

## ✅ 13. Logging Sensitive Data

Things that should **NEVER** be logged:

* card numbers
* passwords
* JWT tokens
* Supabase service keys
* Webhook shared secrets

---

## ✅ 14. Penetration Test Checklist

✅ Try accessing another user’s:

* certificates
* enrollments
* progress pages
* courses (private lessons)
* invoices/payments

✅ Tamper Purchase

* change price client-side → should not affect backend
* fake “success” webhook → ignore without signature

✅ SQL Injection

* search boxes → no error leaks, no raw SQL logs

✅ XSS

* user review `<script>alert(1)</script>` → must be sanitized

---

## ✅ 15. Incident Response Procedure

If breach or suspicious access detected:

1. Rotate secrets: Stripe, Supabase, Clerk
2. Disable new signups temporarily
3. Review Supabase audit logs
4. Email affected users if personal data accessed
5. Patch vulnerability
6. Write postmortem

---

## ✅ Final Security Status for Production Launch

To launch, all must be ✅:

* [ ] RLS enabled on sensitive tables
* [ ] Stripe webhook signature validated
* [ ] Service key used only on server
* [ ] Private videos require signed URLs
* [ ] User-generated content sanitized
* [ ] HTTPS everywhere
* [ ] Logs do not contain secrets
* [ ] Backups enabled
* [ ] Rate limiting added

---

# ✅ End of `cybersecurity-checks.md`

If you'd like, next I can write **test-plan.md** (manual QA + automated test scripts) or **deployment-runbook.md** for your dev→production workflow.

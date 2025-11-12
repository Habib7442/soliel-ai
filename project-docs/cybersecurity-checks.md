Perfect—here is a **professional, detailed** `cybersecurity-checks.md` designed for a production LMS with payments, user data, and certificates. You can publish this inside your repo or Notion as your official security checklist.

---

# ✅ **cybersecurity-checks.md — Soliel AI**

**Version:** 1.0
**Owner:** Habib Tanwir Laskar
**Applies to:** Frontend, Backend, Database, CI/CD, Payment infrastructure

Purpose: ensure Soliel AI remains secure against data breaches, account takeover, payment fraud, SQL injection, RCE, XSS, CSRF, and supply-chain attacks.

---

## ✅ 1. Authentication & Identity Security

### ✔ Using Supabase Auth

* [ ] Disable public access for protected routes using **middleware** with role-based gating.
* [ ] Prevent direct JWT manipulation on client — trust only **Supabase server-side validations**.
* [ ] Rotate Supabase secret occasionally.
* [ ] Force email verification for instructors/company admins.
* [ ] Enforce strong password policy if password login enabled.

### ✔ Session Security

* [ ] `user_id` stored in DB but **never trust client to provide it** — always compute server-side.
* [ ] Never use localStorage for auth tokens.
* [ ] Use HTTP-only secure cookies (Supabase handles this by default).

---

## ✅ 2. Database & Supabase Security

### ✔ Row Level Security (RLS)

* [ ] Enable RLS on ALL tables
* [ ] Write policies for each role (student, instructor, company_admin, super_admin)
* [ ] Test policies with Supabase SQL editor
* [ ] Never disable RLS in production

### ✔ Service Role Keys

* [ ] Only use service role keys in server-side code
* [ ] Never expose service role keys in client code
* [ ] Rotate service role keys periodically

### ✔ Connection Security

* [ ] Use SSL connections to Supabase
* [ ] Limit database connections
* [ ] Use connection pooling

---

## ✅ 3. Input Validation & Sanitization

### ✔ API Endpoints

* [ ] Validate all input parameters
* [ ] Sanitize user-generated content
* [ ] Use Zod or similar for schema validation
* [ ] Implement rate limiting

### ✔ SQL Queries

* [ ] Use parameterized queries only
* [ ] Never concatenate user input into SQL strings
* [ ] Use Supabase client methods instead of raw SQL when possible

---

## ✅ 4. Frontend Security

### ✔ XSS Prevention

* [ ] Sanitize all user-generated content before rendering
* [ ] Use React's built-in XSS protection
* [ ] Implement Content Security Policy (CSP)

### ✔ CSRF Protection

* [ ] Use SameSite cookies
* [ ] Implement CSRF tokens for sensitive operations

---

## ✅ 5. Payment Security

### ✔ Stripe Integration

* [ ] Never log credit card information
* [ ] Use Stripe.js for client-side tokenization
* [ ] Validate webhook signatures
* [ ] Implement proper error handling

### ✔ Order Processing

* [ ] Validate order amounts server-side
* [ ] Prevent price manipulation
* [ ] Log all payment transactions

---

## ✅ 6. File Upload Security

### ✔ Supabase Storage

* [ ] Implement proper access controls
* [ ] Validate file types and sizes
* [ ] Scan uploaded files for malware
* [ ] Use signed URLs for private content

---

## ✅ 7. API Security

### ✔ Rate Limiting

* [ ] Implement rate limiting on all API endpoints
* [ ] Use different limits for authenticated vs unauthenticated users
* [ ] Monitor for abuse patterns

### ✔ CORS Configuration

* [ ] Restrict CORS to known domains only
* [ ] Never use wildcard origins in production

---

## ✅ 8. Environment Variables

* [ ] Never commit secrets to version control
* [ ] Use `.env.local` for development secrets
* [ ] Rotate API keys periodically
* [ ] Use different keys for development and production

---

## ✅ 9. Error Handling

* [ ] Never expose stack traces to users
* [ ] Log errors securely
* [ ] Implement proper error boundaries
* [ ] Use generic error messages for security-related failures

---

## ✅ 10. Dependency & Supply-Chain Security

* [ ] Check vulnerability reports using Dependabot or Renovate
* [ ] Avoid random npm packages with low downloads
* [ ] Pin critical versions (stripe, supabase, next, tailwind)
* [ ] Enable `npm audit` in CI
* [ ] Use `pnpm` or `yarn` lock to prevent version drift

---
Great — next in your documentation set is **`test-plan.md`**.
This covers **manual QA**, **automated tests**, **acceptance criteria**, and **E2E flows** for Students, Instructors, Admin, Payments, and Certificates.

---

# ✅ **test-plan.md — Soliel AI LMS**

**Owner:** QA / Engineering Team
**Version:** 1.0
**Scope:** LMS v1.0 – Students, Purchase, Course Player, Certificates, Instructor, Company, Admin

---

## ✅ 1. Goals of Testing

This document ensures that:

* All user journeys work without developer help
* Payments always process correctly
* Progress tracking & certificates are accurate
* No unauthorized access to protected data
* No UI breakage on mobile or desktop
* Database updates are correct for every flow

---

## ✅ 2. Testing Types

| Type        | Tools                      | Goal                                     |
| ----------- | -------------------------- | ---------------------------------------- |
| Unit        | Jest / Vitest              | Utility logic, helper functions          |
| Integration | Supabase, Stripe test keys | DB correctness + webhook correctness     |
| E2E         | Playwright / Cypress       | Full student purchase → certificate flow |
| Manual QA   | Chrome/Safari/Mobile       | UX, visual bugs, accessibility           |
| Security QA | Own checklist              | Role protection, data access             |

---

## ✅ 3. Test Environments

| Environment | URL               | Purpose                            |
| ----------- | ----------------- | ---------------------------------- |
| Development | localhost         | Dev only                           |
| Staging     | staging.soliel.ai | Full staging with Stripe test keys |
| Production  | soliel.ai         | Live                               |

Staging uses:

* Stripe Test Mode
* Demo courses
* Test instructor & company accounts

---

## ✅ 4. Manual QA — Core User Journeys

### ✅ A. New Student Signup

1. Visit homepage
2. Click Sign Up → Clerk hosted page
3. Verify email is stored in `profiles` table
4. Student dashboard loads successfully

**Expected Results**

* Successful redirect to `/student/dashboard`
* `profiles` row created
* Role = `student`

---

### ✅ B. Browse & Purchase Course (Stripe Test Card)

1. Go to course details
2. Click “Enroll Now”
3. Complete checkout using test card `4242 4242 4242 4242`
4. Stripe success screen → redirect back to dashboard

**Expected Results**

* `orders` row created
* `payments` row created (requires_payment)
* Stripe webhook receives `payment_intent.succeeded`
* `payments.status = paid`
* `enrollments` row created
* Course appears in Student Dashboard ✅

---

### ✅ C. Course Player + Progress

1. Open enrolled course
2. Play lesson
3. Click **Mark Complete**
4. Refresh page

**Expected Results**

* `lesson_progress` row saved
* Progress bar updates
* After last lesson:

  * `v_course_progress` = 100%
  * `enrollments.status = completed`
  * Certificate issued row in `certificates`

---

### ✅ D. Certificate Download

1. Go to Certificates page
2. Click Download
3. Open PDF

**Expected Results**

* PDF contains:

  * Student name
  * Course title
  * Issue date
* File opens without corruption

---

### ✅ E. Instructor: Create Course

1. Login as instructor
2. Create new course
3. Publish course
4. View in public catalog

**Expected Results**

* New course record in DB
* `is_published = true`
* Visible to public users

---

### ✅ F. Company Admin: Assign Course

1. Login as company admin
2. Add an employee
3. Assign course to employee
4. Login as employee → dashboard

**Expected Results**

* Employee sees course in dashboard without payment
* `enrollments.purchased_as = corporate`

---

### ✅ G. Admin Panel

* Can list users
* Can disable a course
* Can update FAQ & Blog

**Expected Results**

* Changes reflect on public site
* Disabled courses hidden from catalog

---

## ✅ 5. Automated Tests

### ✅ A. Unit Tests (Jest / Vitest)

* Price calculation utilities
* Bundle → course resolution logic
* Sanitization functions (blog, reviews)
* Date formatting & certificate name builder

**Success Criteria**

* 100% pass
* No unexpected side effects

---

### ✅ B. Integration Tests

#### Stripe Payment → Enrollment

* Mock webhook event
* Assert:

  * order marked paid
  * enrollments created
  * no duplicate rows on webhook retry

#### Lesson Completion → Certificate

* Insert progress rows
* Trigger stored procedure
* Assert:

  * enrollment status updated
  * certificate issued row created

---

### ✅ C. E2E Tests (Playwright)

| Test              | Steps                                    | Expected Result      |
| ----------------- | ---------------------------------------- | -------------------- |
| Purchase course   | signup → pay → dashboard                 | course visible       |
| Complete course   | mark all lessons → refresh               | certificate issued   |
| Instructor create | create → publish                         | visible publicly     |
| Company assign    | add employee → assign                    | employee sees course |
| RLS protection    | try to access another student’s progress | 403/redirect         |

---

## ✅ 6. Performance Tests

* Homepage loads < 2.5s on 3G Fast
* Course Catalog responds < 500ms
* Course Player video loads < 2s
* Stripe checkout < 2s init

Use Lighthouse + WebPageTest in staging.

---

## ✅ 7. Accessibility Tests

* Keyboard navigation works
* Contrast passes WCAG AA
* Images have alt tags
* Form fields labeled
* Focus ring visible (custom or browser default)

Tools: Axe, Lighthouse Accessibility

---

## ✅ 8. Security Tests

* Try accessing `(admin)` as student → blocked
* Try calling server actions without login → fails
* Try fake Stripe webhook → rejected by signature check
* XSS attempt inside review → sanitized and escaped
* Try direct Supabase REST API query without token → denied

---

## ✅ 9. Mobile & Responsive QA

Check on iPhone and Android:

* Course cards grid
* Checkout flow
* Player controls
* Dashboard layout
* PDF opens

---

## ✅ 10. Regression Tests

Run before release:

* Purchase → Enrollment
* Lesson complete → Progress
* Certificate generation
* Instructor publish
* Admin disable course
* Company assignment

---

## ✅ 11. QA Sign-Off Checklist

All must pass ✅ before production:

* [ ] New signup → dashboard
* [ ] Payment → enrollment
* [ ] Progress saved
* [ ] 100% → certificate
* [ ] Instructor publish works
* [ ] Company assignment works
* [ ] Admin controls work
* [ ] Mobile responsive
* [ ] RLS access protected
* [ ] Lighthouse pass
* [ ] Webhook retry safe

---

## ✅ 12. Post-Release Monitoring

* Supabase logs for DB errors
* Stripe webhook logs
* Error boundaries for UI crash
* 500 errors notifications
* Metric: certificates issued daily
* Metric: purchase conversion rate

---

# ✅ End of `test-plan.md`

If you want, next I can create:

✅ **deployment-runbook.md**
✅ **support-playbook.md** (how to handle customer issues)
✅ **analytics-dashboard.md** (what metrics to track & how)

Just say **next** and which one.

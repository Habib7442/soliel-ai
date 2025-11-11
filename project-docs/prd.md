# Soliel AI – Learning Management System (LMS)
**Version:** 1.0  
**Owner:** Habib Tanwir Laskar  
**Status:** In Development  
**Last Updated:** DD/MM/YYYY

---

## 1. Product Overview
Soliel AI is a modern LMS where:
- Students purchase and learn courses with progress tracking and certificates.
- Instructors upload, manage, and publish courses.
- Companies enroll employees and track their learning.
- Admins control the entire system (users, courses, payments, blogs).

The goal: fast, beautiful, scalable, profitable LMS with modern UI and real transactions.

---

## 2. Objectives & Success Criteria

### ✔ Primary Objectives
1. Enable users to browse courses, purchase via Stripe, and learn with a course player.
2. Track student progress and automatically issue certificates.
3. Allow instructors to create and manage courses.
4. Allow companies to bulk-enroll employees and view progress.
5. Provide admin analytics and platform management.

### ✔ Success Metrics
- ✅ Users can successfully:
  - Sign up, enroll, complete lessons, earn a certificate.
- ✅ Payment → webhook → enrollment flow is 100% automated.
- ✅ Instructor can create + publish a course with lessons.
- ✅ Company admin assigns courses to employees.
- ✅ 99% of student activity is self-service, no manual admin needed.
- ✅ Load time < 2.5s on major pages.

---

## 3. Users & Personas

| Persona | Goals | Key Features |
|--------|-------|---------------|
| Student | Buy courses, learn, get certificates | Catalog, checkout, player, quizzes, certificates |
| Instructor | Publish courses, earn revenue | Course builder, curriculum manager, earnings dashboard |
| Company Admin | Train team, track progress | Company dashboard, employee enrollment, billing |
| Super Admin | Manage platform | Users, courses, bundles, payments, blog, FAQ, reports |

---

## 4. Core Product Features

### ✅ A. Authentication (Clerk)
- Email/password + Google login
- Auto-create user profile in Supabase (`profiles`)
- Roles: student, instructor, company_admin, super_admin
- Protected route middleware

**Acceptance Criteria**
- User can login/out
- Dashboard changes based on role
- No protected route loads without login

---

### ✅ B. Public Marketing Pages
- Home (hero, featured courses, testimonials, CTA)
- Course Catalog (search + filters)
- Course Details (syllabus, reviews, instructor bio, price)
- Blog & FAQ

**Acceptance Criteria**
- Public can browse without login
- Course details show correct pricing and lessons preview

---

### ✅ C. Checkout & Payments (Stripe)
- Stripe PaymentIntent creation
- Order + order_items in DB
- Stripe Webhook confirms payment
- Enrollment created after success

**Acceptance Criteria**
- Payment succeeds → enrollment exists
- Student dashboard shows new course instantly
- Failed payments do not enroll

---

### ✅ D. Student Dashboard
- Enrolled courses with progress % (from `v_student_courses`)
- Recommended courses
- Certificates page

**Acceptance Criteria**
- Shows at least title, thumbnail, progress bar, CTA to continue

---

### ✅ E. Course Player
- Video lessons + list of lessons
- Mark lesson complete
- Lesson progress saved in DB
- Auto-complete course + certificate when 100%

**Acceptance Criteria**
- Progress remains after refresh
- Completing all lessons unlocks certificate
- Lesson navigation works (next/prev)

---

### ✅ F. Certificates
- Auto-issued by trigger
- Stored PDF in Supabase Storage
- Downloadable
- Share to LinkedIn button

**Acceptance Criteria**
- PDF contains name, course title, date
- Working public share link

---

### ✅ G. Instructor Dashboard
- My Courses
- Create/Edit Course (title, price, thumbnail)
- Add Lessons (video, order)
- Publish/Unpublish

**Acceptance Criteria**
- Course only appears publicly when published
- Instructor cannot edit other instructors' courses

---

### ✅ H. Bundles
- Bundle = group of courses at discount
- Can buy bundle and get access to all included courses

**Acceptance Criteria**
- Buying bundle creates multiple enrollments
- Bundle cards show discount amount

---

### ✅ I. Company Accounts (B2B)
- Create company
- Add employees (email or auto-create)
- Assign courses
- Track progress per employee
- Invoices for payments

**Acceptance Criteria**
- Employee sees course in dashboard
- Company admin sees employee progress

---

### ✅ J. Admin Dashboard
- Manage users, courses, bundles
- View payments & revenue
- Approve instructors
- Blog & FAQ editor

**Acceptance Criteria**
- Only admin role can see admin routes
- Can disable courses or users
- Blog adds new Hero + MD body

---

## 5. Technical Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind, Shadcn UI |
| Auth | Clerk |
| Database | Supabase (PostgreSQL + Storage) |
| Payments | Stripe |
| Deployment | Vercel + Supabase hosted |
| Media | Supabase Storage (videos, PDFs) |

---

## 6. Data Model (Summary)
- `profiles`, `courses`, `lessons`, `bundles`, `orders`, `payments`, `enrollments`
- Views: `v_student_courses`, `v_course_progress`
- Triggers: auto-issue certificate on 100% progress

---

## 7. User Flows

### **Student Purchase → Learn → Complete**
1. Browse → select course
2. Checkout → pay
3. Webhook → enrollment created
4. Student plays lessons
5. 100% progress → certificate issued

### **Instructor Create Course**
1. Login as instructor
2. Create new course
3. Add lessons
4. Publish
5. Appears in public catalog

### **Company Assign**
1. Admin selects employee
2. Assigns course
3. Employee sees it in dashboard
4. Admin tracks progress

---

## 8. Non-Functional Requirements

#### Performance
- Page load < 2.5s
- Images optimized
- Server Actions for DB writes

#### Security
- RLS enabled on sensitive tables
- Only logged in users can write
- Webhooks protected with secret

#### Reliability
- Stripe retries enabled
- All webhook events logged to `events` table

#### Accessibility
- Keyboard-friendly
- Semantic HTML
- Contrast consistent with theme

---

## 9. Analytics / Telemetry
Track events in `events` table:
- user_signed_up
- payment_success
- lesson_completed
- quiz_submitted
- certificate_issued

Metrics dashboard for admin:
- revenue
- enrollments
- certificates issued
- completion rate

---

## 10. Out-of-Scope (Phase 2+)
- Gamification (badges, levels)
- AI course recommendations
- SCORM or LTI support
- Instructor payouts automation
- Mobile app

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|-------|------------|
| Payment webhook fails | Stripe retry + event logging |
| Large video storage | Move to BunnyCDN in future |
| Too many roles permissions | Centralized role check + RLS |

---

## 12. Launch Plan
✅ Test Stripe in Test Mode  
✅ Onboard 2 instructors  
✅ Create 5 real courses  
✅ Invite 10 beta students  
✅ Measure completion & feedback  
✅ Switch Stripe to Live mode

---

## 13. Definition of Done (DoD)
- All core flows work without admin help
- Deployed on Vercel + Supabase
- Test card can buy course & complete lessons
- Certificate downloadable
- Instructor and company roles verified
- Lighthouse: no major performance warnings

---

## 14. Future Roadmap (After v1)
- AI auto-quiz from lesson text
- In-course discussion threads
- Leaderboards
- Affiliates / referral system
- iOS & Android mobile apps

---
# ✅ END OF PRD

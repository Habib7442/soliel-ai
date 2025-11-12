# Product Requirements Document - Soliel AI LMS

## 1. Purpose & Vision

Soliel AI is a modern Learning Management System (LMS) that enables students to purchase and learn courses with progress tracking and certificates, instructors to create and manage courses, companies to enroll employees and track their learning, and admins to control the entire system.

## 2. Project Goals

- Create a scalable LMS platform with role-based access control
- Implement a seamless learning experience with progress tracking
- Enable instructors to create and manage courses
- Provide companies with tools to manage employee learning
- Ensure secure authentication and payment processing

## 3. Users & Personas

| Persona | Goals | Key Features |
|--------|-------|---------------|
| Student | Buy courses, learn, get certificates | Catalog, checkout, player, quizzes, certificates |
| Instructor | Publish courses, earn revenue | Course builder, curriculum manager, earnings dashboard |
| Company Admin | Train team, track progress | Company dashboard, employee enrollment, billing |
| Super Admin | Manage platform | Users, courses, bundles, payments, blog, FAQ, reports |

## 4. Core Product Features

### ✅ A. Authentication (Supabase Auth)
- Email/password login
- Auto-create user profile in Supabase (`profiles`)
- Roles: student, instructor, company_admin, super_admin
- Protected route middleware

**Acceptance Criteria**
- User can login/out
- Dashboard changes based on role
- No protected route loads without login

### ✅ B. Public Marketing Pages
- Home (hero, featured courses, testimonials, CTA)
- Course Catalog (search + filters)
- Course Details (syllabus, reviews, instructor bio, price)
- Blog & FAQ

**Acceptance Criteria**
- Public can browse without login
- Course details show correct pricing and lessons preview

### ✅ C. Checkout & Payments (Stripe)
- Stripe PaymentIntent creation
- Order + order_items in DB
- Stripe Webhook confirms payment
- Enrollment created after success

**Acceptance Criteria**
- Payment succeeds → enrollment exists
- Student dashboard shows new course instantly
- Failed payments do not enroll

### ✅ D. Student Dashboard
- Enrolled courses with progress % (from `v_student_courses`)
- Recommended courses
- Certificates page

**Acceptance Criteria**
- Shows real-time progress
- Certificate PDF downloads work

### ✅ E. Instructor Course Builder
- Create new courses with title, description, price
- Add/edit/delete lessons with video uploads
- Publish/unpublish courses

**Acceptance Criteria**
- Course appears in catalog when published
- Only instructor can edit their courses

### ✅ F. Company Admin Portal
- Assign courses to employees
- View employee progress
- Bulk enrollment

**Acceptance Criteria**
- Employees see assigned courses
- Progress updates in real-time

### ✅ G. Super Admin Panel
- Manage all users and their roles
- Oversee all courses and content
- View payments and financial reports
- Manage blog posts and FAQ

**Acceptance Criteria**
- Full system visibility
- Role changes take immediate effect

---

## 5. Technical Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind, Shadcn UI |
| Auth | Supabase Auth |
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
- HTTPS everywhere
- JWT-based auth
- Role-based access control
- SQL injection protection
- XSS prevention

#### Reliability
- 99.9% uptime
- Automated backups
- Error monitoring
- Graceful degradation

#### Scalability
- Horizontal scaling support
- CDN for static assets
- Database connection pooling
- Caching strategies

---

## 9. Success Metrics

- User registration rate
- Course completion rate
- Monthly recurring revenue
- Customer satisfaction score
- System uptime percentage

---

## 10. Release Plan

### Phase 1: MVP (4 weeks)
- Authentication system
- Course catalog
- Basic course player
- Payment integration
- Student dashboard

### Phase 2: Instructor Features (3 weeks)
- Course creation tools
- Lesson management
- Earnings dashboard

### Phase 3: Company Features (2 weeks)
- Employee management
- Progress tracking
- Bulk enrollment

### Phase 4: Admin Panel (2 weeks)
- User management
- Content moderation
- Financial reporting

### Phase 5: Advanced Features (3 weeks)
- Certificates
- Quizzes
- Blog system
- Advanced analytics
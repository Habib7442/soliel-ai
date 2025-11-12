# Technical Specification - Soliel AI LMS

---

## 1) System Architecture

**Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
**Auth:** Supabase Auth (JWT sessions)
**DB & Storage:** Supabase (Postgres + Storage + Realtime)
**Payments:** Stripe (PaymentIntent + Webhooks)
**Deployment:** Vercel (frontend+API) + Supabase (managed Postgres)
**Email (optional):** Resend/Sendgrid (phase 2)

**High-level flow**

* Public → Course Details → Checkout
* Create Order + Stripe PaymentIntent (server action)
* Stripe Webhook → mark paid → create Enrollments
* Student Player → mark lesson complete → trigger completion → Certificate issued (PDF)

---

## 2) Data Model (key tables)

> Already created via `schema.sql`. Here's the working set v1 uses most often:

* `app.profiles(id, email, full_name, role, avatar_url)`
* `app.courses(id, title, subtitle, description, level, price_cents, currency, is_published, instructor_id)`
* `app.lessons(id, course_id, title, video_url, order_index, downloadable)`
* `app.bundles(id, name, price_cents, currency, is_active)` + `app.bundle_courses(bundle_id, course_id)`
* `app.orders(id, user_id, purchase_type, company_id, subtotal_cents, discount_cents, tax_cents, total_cents, currency)`
* `app.order_items(id, order_id, course_id, bundle_id, quantity, unit_price_cents)`
* `app.payments(id, order_id, provider, provider_payment_id, status, amount_cents, currency, receipt_url)`
* `app.enrollments(id, user_id, course_id, purchased_as, order_id, status, started_at, completed_at)`
* `app.lesson_progress(user_id, lesson_id, completed, completed_at)`
* `app.certificates(id, user_id, course_id, status, pdf_url, issued_at)`
* Views: `app.v_course_progress`, `app.v_student_courses`
* Triggers: `app.maybe_complete_enrollment` (issue certificate @100%)

---

## 3) Authentication & Authorization

### Supabase Auth

* Use `@supabase/ssr` package for authentication.
* Roles stored in Supabase `profiles.role` (source of truth for UI gating and server-side checks)
* Session management handled by Supabase Auth with secure cookies

### Route protection

* `(student)` authenticated required.
* Admin routes protected with role checks.
* Middleware handles session validation and role-based access control.

---

## 4) Protected Routes & Role Checks

```ts
// lib/auth.ts
export async function isAdmin() {
  const profile = await getProfile();
  return profile?.role === 'super_admin';
}

export async function isInstructor() {
  const profile = await getProfile();
  return profile?.role === 'instructor' || profile?.role === 'super_admin';
}

export async function isCompanyAdmin() {
  const profile = await getProfile();
  return profile?.role === 'company_admin' || profile?.role === 'super_admin';
}
```

---

## 5) Server Actions (RSC-safe)

All mutations use Server Actions for security and performance.

```ts
// server/actions/user.actions.ts
"use server";

import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";

export const createUserProfile = async (params: CreateUserParams) => {
  // Implementation here
}

export const updateUserRole = async (userId: string, newRole: UserRole) => {
  // Implementation here
}
```

---

## 6) Queries (RSC-safe)

All reads use Server Components or Server Actions.

```ts
// server/queries/course.ts
import { createServerClient } from "@/lib/supabase-server";

export async function getCourse(courseId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (error) throw error;
  return data;
}
```

---

## 7) Supabase RLS (Row Level Security)

RLS policies protect all tables. Example:

```sql
-- profiles
create policy "Profiles are viewable by users who created them"
  on app.profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on app.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on app.profiles for update
  using ( auth.uid() = id );
```

---

## 8) Progress & Completion Tracking

### 8.1 Get Lesson Progress

```ts
// server/actions/progress.ts
"use server";
import { createServerClient } from "@/lib/supabase-server";

export async function getLessonProgress(lessonId: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('lesson_progress')
    .select('completed')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .eq('lesson_id', lessonId)
    .single();
  
  return data?.completed || false;
}
```

### 8.2 Mark Lesson Complete

```ts
// server/actions/progress.ts
"use server";
import { createServerClient } from "@/lib/supabase-server";

export async function markLessonComplete(lessonId: string) {
  const supabase = await createServerClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Unauthorized");

  await supabase.from('lesson_progress').upsert({
    user_id: userId,
    lesson_id: lessonId,
    completed: true,
    completed_at: new Date().toISOString()
  });
  // Trigger will auto-complete enrollment & certificate if 100%
  return { ok: true };
}
```

### 8.3 Instructor: Create/Update Course

```ts
// server/actions/courses.ts
"use server";
import { createServerClient } from "@/lib/supabase-server";

export async function createCourse(payload: CoursePayload) {
  const supabase = await createServerClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('courses')
    .insert({
      ...payload,
      instructor_id: userId
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

---

## 9) Stripe Payments

### 9.1 Create Order Action

```ts
// server/actions/orders.ts
"use server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";

export async function createOrderAction(payload: OrderPayload) {
  const supabase = await createServerClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Unauthorized");

  // Implementation here
}
```

### 9.2 Stripe Webhook Handler

```ts
// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createServerClient();
  // Implementation here
}
```

---

## 10) Enums & Types

```ts
// types/enums.ts
export enum UserRole {
  STUDENT = "student",
  INSTRUCTOR = "instructor",
  COMPANY_ADMIN = "company_admin",
  SUPER_ADMIN = "super_admin",
}

export type PurchaseType = 'single' | 'bundle' | 'corporate';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
}
```

---

## 11) Folder Structure

```
app/
├─ (marketing)/                   // public pages
├─ (auth)/                        // sign-in, sign-up
├─ (student)/                     // student dashboard
├─ (instructor)/                  // course builder
├─ (company)/                     // company admin
├─ (admin)/                       // super admin
├─ api/
│  ├─ orders/create/              // create order intent
│  ├─ stripe/webhook/             // payment confirmation
│  └─ rls-token/                  // (optional) mint Supabase JWT for RLS
├─ layout.tsx                     // root layout with providers
└─ page.tsx                       // marketing home

server/
├─ actions/                       // Server Actions (mutate)
│  ├─ user.actions.ts             // user management
│  ├─ courses.ts                  // course CRUD
│  ├─ enrollments.ts              // purchase → enroll
│  ├─ progress.ts                 // lesson tracking
│  ├─ reviews.ts                  // course reviews
│  └─ company.ts                  // employee assignment
├─ queries/                       // Server-side queries (cacheable)
│  ├─ catalog.ts                  // public course listings
│  ├─ course.ts                   // course details
│  ├─ dashboard.ts                // user-specific views
│  └─ admin.ts                    // admin reports
└─ webhooks/
   └─ stripe.ts                   // reusable handlers called by /api/stripe/webhook

lib/
├─ supabase-server.ts             // createServerClient (cookies)
├─ supabase-client.ts             // createBrowserClient
├─ auth.ts                        // getCurrentUser(), getProfile(), role helpers
├─ rls.ts                         // (optional) mint Supabase JWT for RLS
├─ stripe.ts                      // Stripe SDK init
├─ pdf.ts                         // certificate generator helpers
└─ utils.ts

providers/
├─ supabase-provider.tsx          // Supabase auth context
├─ theme-provider.tsx             // dark mode
└─ query-provider.tsx             // React Query or SWR config (optional)

hooks/
├─ use-role.ts                    // read role from Profile
└─ use-upload.ts                  // signed URL uploads

config/
├─ routes.ts                      // public/protected route lists
└─ constants.ts

types/
├─ db.ts                          // Supabase table types
├─ enums.ts                       // UserRole, PurchaseType
└─ stripe.ts                      // Stripe event types

components/
├─ layout/                        // Navbar, Footer, etc.
├─ cards/                         // CourseCard, BundleCard
├─ forms/                         // CourseForm, LessonForm
├─ course/                        // Player, ProgressBar
├─ data-table/                    // reusable table component
└─ ui/                            // shadcn/ui re-exports
```
Here’s a complete, ready-to-drop **tech-spec.md** for Soliel AI LMS. It’s implementation-level: data contracts, server actions, API routes, webhooks, RLS approach, and operational details.

---

# tech-spec.md — Soliel AI LMS

**Owner:** Habib Tanwir Laskar
**Version:** 1.0
**Scope:** v1 (Student, Instructor, Company, Admin; Checkout → Enrollment → Player → Certificates)

---

## 1) System Architecture

**Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
**Auth:** Clerk (JWT sessions; userId = Clerk `sub`)
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

> Already created via `schema.sql`. Here’s the working set v1 uses most often:

* `app.profiles(id, clerk_user_id, email, full_name, role, avatar_url)`
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

### Clerk

* Use `@clerk/nextjs` providers and middleware.
* Roles stored **both**:

  * Clerk `publicMetadata.role` (source of truth for UI gating)
  * Supabase `profiles.role` (server-side checks & analytics)

### Route protection

* `(student)` authenticated required.
* `(instructor)` → `role ∈ {instructor, super_admin}`.
* `(company)` → `role ∈ {company_admin, super_admin}`.
* `(admin)` → `role = super_admin`.

### RLS strategy (Supabase)

* **Writes** happen in **server actions** using **service role key** (bypasses RLS safely on server).
* **Reads** for public resources (published courses) allowed with permissive policies.
* **Reads** for private data (enrollments/progress/orders) happen server-side (or client with RLS if later needed).

---

## 4) Environment Variables

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_LOOKUP_KEY=   # optional when using Stripe Prices API

STORAGE_PUBLIC_BASE=https://<supabase-bucket-public-base>  # for PDFs/media
```

---

## 5) File Structure (relevant to code below)

```
app/
  (marketing)/*               # public pages
  (student)/*                 # student dashboard, player
  (instructor)/*              # course builder
  (company)/*                 # company admin
  (admin)/*                   # super admin
  api/
    stripe/webhook/route.ts
    orders/create/route.ts
    upload/route.ts
server/
  actions/*                   # mutations (server actions)
  queries/*                   # reads
  webhooks/stripe.ts          # webhook handler
lib/
  supabase-server.ts
  stripe.ts
  auth.ts
  pdf.ts
```

---

## 6) Data Contracts (TypeScript types)

```ts
// types/db.ts (excerpt)
export type Role = 'student' | 'instructor' | 'company_admin' | 'super_admin';
export type PurchaseType = 'single' | 'bundle' | 'corporate';

export interface Profile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url?: string | null;
}

export interface Course {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  price_cents: number;
  currency: 'INR'|'USD'|'EUR'|'GBP';
  is_published: boolean;
  instructor_id: string;
  thumbnail_url?: string | null;
  intro_video_url?: string | null;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_url?: string | null;
  order_index: number;
  downloadable: boolean;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  purchased_as: PurchaseType;
  order_id?: string | null;
  status: 'active'|'completed'|'expired'|'cancelled';
  completed_at?: string | null;
}

export interface OrderPayload {
  purchaseType: PurchaseType;
  courseId?: string;
  bundleId?: string;
  companyId?: string;            // corporate
  couponCode?: string;
}
```

---

## 7) Server Queries (reads)

> Implemented as async functions in `server/queries/*` (RSC friendly).

### 7.1 Catalog

```ts
// server/queries/catalog.ts
import { supabaseServer } from "@/lib/supabase-server";

export async function getPublicCourses(params?: {
  q?: string; categoryId?: number; level?: string; sort?: 'popular'|'new'|'price';
}) {
  const sb = supabaseServer();
  let qy = sb.from('app.courses').select(`
    id,title,subtitle,price_cents,currency,is_published,thumbnail_url,level,
    instructor:instructor_id ( id, full_name, avatar_url )
  `).eq('is_published', true);

  if (params?.level) qy = qy.eq('level', params.level);
  if (params?.q) qy = qy.ilike('title', `%${params.q}%`);
  // sort applied as needed
  const { data, error } = await qy;
  if (error) throw error;
  return data;
}
```

### 7.2 Course details

```ts
// server/queries/course.ts
export async function getCoursePublic(courseId: string) { /* select course + lessons (titles only) */ }
export async function getCourseForStudent(userId: string, courseId: string) { /* include progress */ }
```

### 7.3 Student dashboard

```ts
// server/queries/dashboard.ts
export async function getStudentCourses(userId: string) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('app.v_student_courses').select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}
```

---

## 8) Server Actions (mutations)

> All server actions check role or ownership, then call Supabase with **service key**.

### 8.1 Create Order + PaymentIntent

```ts
// server/actions/orders.ts
"use server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseService } from "@/lib/supabase-server";
import { auth } from "@clerk/nextjs/server";

export async function createOrderAction(payload: OrderPayload) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const sb = supabaseService(); // service role supabase client

  // 1) Resolve line item price from DB
  let total = 0, currency = 'INR', orderItems: Array<any> = [];
  if (payload.purchaseType === 'single' && payload.courseId) {
    const { data: c } = await sb.from('app.courses').select('id,price_cents,currency').eq('id', payload.courseId).single();
    if (!c) throw new Error("Course not found");
    total = c.price_cents; currency = c.currency;
    orderItems.push({ course_id: c.id, unit_price_cents: c.price_cents, quantity: 1 });
  } else if (payload.purchaseType === 'bundle' && payload.bundleId) {
    const { data: b } = await sb.from('app.bundles').select('id,price_cents,currency').eq('id', payload.bundleId).single();
    if (!b) throw new Error("Bundle not found");
    total = b.price_cents; currency = b.currency;
    orderItems.push({ bundle_id: b.id, unit_price_cents: b.price_cents, quantity: 1 });
  } else {
    throw new Error("Invalid payload");
  }

  // 2) Create order
  const { data: profile } = await sb.from('app.profiles').select('id').eq('clerk_user_id', userId).single();
  const { data: order, error: oe } = await sb.from('app.orders').insert({
    user_id: profile!.id,
    purchase_type: payload.purchaseType,
    subtotal_cents: total, discount_cents: 0, tax_cents: 0, total_cents: total, currency
  }).select('*').single();
  if (oe) throw oe;

  // 3) Insert order items
  for (const it of orderItems) {
    await sb.from('app.order_items').insert({ order_id: order.id, ...it });
  }

  // 4) Create PaymentIntent
  const pi = await stripe.paymentIntents.create({
    amount: total,
    currency: currency.toLowerCase(),
    metadata: { order_id: order.id },
    automatic_payment_methods: { enabled: true },
  });

  // 5) Record payment (requires_payment)
  await sb.from('app.payments').insert({
    order_id: order.id,
    provider: 'stripe',
    provider_payment_id: pi.id,
    status: 'requires_payment',
    amount_cents: total,
    currency,
  });

  return { clientSecret: pi.client_secret, orderId: order.id };
}
```

### 8.2 Mark Lesson Complete

```ts
// server/actions/progress.ts
"use server";
import { auth } from "@clerk/nextjs/server";
import { supabaseService } from "@/lib/supabase-server";

export async function markLessonComplete(lessonId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  const sb = supabaseService();

  const { data: me } = await sb.from('app.profiles').select('id').eq('clerk_user_id', userId).single();
  await sb.from('app.lesson_progress').upsert({
    user_id: me!.id,
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
import { requireRole } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase-server";

export async function createCourseAction(input: {
  title: string; price_cents: number; level: 'beginner'|'intermediate'|'advanced';
}) {
  const me = await requireRole(['instructor','super_admin']);
  const sb = supabaseService();
  const { data, error } = await sb.from('app.courses').insert({
    title: input.title,
    price_cents: input.price_cents,
    level: input.level,
    instructor_id: me.id,
    is_published: false
  }).select('id').single();
  if (error) throw error;
  return data;
}
```

---

## 9) API Routes (HTTP)

> Used where webhooks or signed uploads are required. Everything else should use server actions.

### 9.1 `POST /api/orders/create` (optional)

Contract mirrors `createOrderAction`. If you prefer HTTP over server actions for the client.

**Request**

```json
{
  "purchaseType": "single",
  "courseId": "uuid",
  "couponCode": "WELCOME10"
}
```

**Response**

```json
{
  "orderId": "uuid",
  "clientSecret": "pi_abc_secret_..."
}
```

### 9.2 `POST /api/upload`

* Returns a **signed URL** for Supabase Storage (videos, thumbnails, PDFs).
* Auth required (instructor/admin).

**Response**

```json
{ "url": "https://storage.supabase.co/...", "path": "public/courses/..." }
```

---

## 10) Stripe Webhook

**Route:** `POST /api/stripe/webhook`
**Verify signature:** `STRIPE_WEBHOOK_SECRET`
**Events handled:** `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

```ts
// app/api/stripe/webhook/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { handleStripeWebhook } from "@/server/webhooks/stripe";

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature")!;
  const body = await req.text();
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  await handleStripeWebhook(event);
  return NextResponse.json({ received: true });
}
```

```ts
// server/webhooks/stripe.ts
import { supabaseService } from "@/lib/supabase-server";

export async function handleStripeWebhook(event: any) {
  const sb = supabaseService();

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const orderId = pi.metadata?.order_id;
    if (!orderId) return;

    // 1) Update payment
    await sb.from('app.payments')
      .update({ status: 'paid', receipt_url: pi.charges?.data?.[0]?.receipt_url ?? null })
      .eq('provider_payment_id', pi.id);

    // 2) Read order items
    const { data: items } = await sb.from('app.order_items').select('course_id,bundle_id,order_id')
      .eq('order_id', orderId);
    const { data: order } = await sb.from('app.orders').select('user_id, purchase_type').eq('id', orderId).single();

    // 3) Resolve courses (bundle → map to courses)
    let courseIds: string[] = [];
    for (const it of items || []) {
      if (it.course_id) courseIds.push(it.course_id);
      if (it.bundle_id) {
        const { data: bcs } = await sb.from('app.bundle_courses').select('course_id').eq('bundle_id', it.bundle_id);
        courseIds.push(...(bcs?.map(x => x.course_id) ?? []));
      }
    }
    courseIds = Array.from(new Set(courseIds));

    // 4) Create enrollments
    for (const courseId of courseIds) {
      await sb.from('app.enrollments').insert({
        user_id: order!.user_id,
        course_id,
        purchased_as: order!.purchase_type,
        order_id: orderId,
        status: 'active',
        started_at: new Date().toISOString()
      }).onConflict('user_id,course_id').ignore();
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    await sb.from('app.payments').update({ status: 'failed' }).eq('provider_payment_id', pi.id);
  }
}
```

---

## 11) Certificate Generation

* Trigger auto-issues a **certificate row** when progress = 100%.
* PDF generation happens when the student **downloads** (lazy generation) or nightly cron (optional).

```ts
// lib/pdf.ts (pseudo)
export async function generateCertificatePDF({ userName, courseTitle, date }){
  // Use PDFKit / @react-pdf/renderer or any server PDF lib
  // Save to Supabase Storage and return public URL
  return { pdfUrl: `${process.env.STORAGE_PUBLIC_BASE}/certs/...pdf` };
}
```

**Download flow**

1. User clicks **Download**
2. Server action checks if `pdf_url` exists → if not, generate and update row
3. Return URL to client for direct download

---

## 12) Permissions Matrix (v1)

| Resource               | Student     | Instructor | Company Admin      | Super Admin |
| ---------------------- | ----------- | ---------- | ------------------ | ----------- |
| Courses (published)    | Read        | Read       | Read               | CRUD        |
| My Enrollments         | R           | -          | -                  | R           |
| My Progress            | CRU (self)  | -          | -                  | R           |
| Reviews (self)         | CRUD (self) | R          | R                  | Mod         |
| Instructor Courses     | -           | CRUD (own) | -                  | CRUD (all)  |
| Bundles                | Read        | Read       | Read               | CRUD        |
| Company, Members       | -           | -          | CRUD (own company) | CRUD (all)  |
| Orders/Payments (self) | R           | R          | R                  | R (all)     |
| Blog/FAQ               | R           | R          | R                  | CRUD        |

---

## 13) Caching & Performance

* **RSC**: use `server/queries/*` with `cache()` where safe (public catalog, blog).
* **Images**: Next/Image + Supabase public buckets with URL transforms (if enabled).
* **Pagination**: catalog & admin tables use `limit/offset` with indices present.
* **Indexes**: already added for common filters (`is_published`, `instructor_id`, `user_id`).

---

## 14) Error Handling & Observability

* Wrap server actions with `try/catch`, return `{ok:false, message}` to client toasts.
* Log critical failures to:

  * Supabase `app.events` (name, meta JSON).
  * Vercel functions logs (webhooks, actions).
* Stripe webhook: never throw unhandled; always return 2xx after handling/logging.

---

## 15) Security

* All secrets in Vercel Project Env.
* Server actions use **service role key** but only on server; never expose in browser.
* Storage buckets:

  * `course-media` (public for thumbnails, **private** for paid videos if required).
  * `certificates` (public URL OK, or signed URL).
* Validate IDs with zod schemas before DB mutations.

---

## 16) Testing Strategy

**Unit**

* Utilities: price calc, mapping bundle→courses
* PDF generator returns URL

**Integration**

* `createOrderAction` → mocks Stripe → asserts order+payment rows
* Webhook handler: feed `payment_intent.succeeded` → expect enrollments

**E2E (Playwright)**

* Sign up student → buy course (Stripe test) → see enrollment
* Complete all lessons → download certificate
* Instructor create course → publish → appears in catalog

---

## 17) UI Components (shared contracts)

* `CourseCard`: `{ id, title, thumbnail, price_cents, currency, level, rating? }`
* `LessonList`: `{ lessons: Lesson[]; activeId?: string }`
* `Player`: `{ lesson: Lesson; onComplete: (lessonId)=>Promise<void> }`
* `ProgressBar`: `{ value: number }`

---

## 18) Migration & Seed

**Seeds (dev)**

* 1 instructor profile, 1 student, 1 company admin
* 3 courses (each 3 lessons)
* 1 bundle with 2 courses
* Global FAQ entries
* Blog: 2 sample posts

---

## 19) Release Checklist (technical)

* [ ] Env vars configured in Vercel + Supabase
* [ ] Stripe webhook endpoint added; secret copied
* [ ] Database schema applied; seeds inserted
* [ ] Public pages render; catalog loads
* [ ] Test purchase creates enrollment
* [ ] Lesson completion → certificate row
* [ ] Certificate PDF download returns valid file
* [ ] Admin/instructor routes gate correctly
* [ ] Lighthouse/A11y pass on key pages

---

## 20) Post-v1 Extensions (tech hooks ready)

* AI Quiz generation service (Vertex AI) writing to `app.quizzes/*`
* Instructor payouts: Stripe Connect
* Content DRM: signed URLs per-lesson with expiry
* Notifications: Resend (lesson assigned, payment success, certificate issued)

---

**End of tech-spec.md**

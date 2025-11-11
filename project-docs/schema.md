-- =========================================================
-- 0) NAMESPACE & EXTENSIONS
-- =========================================================
create schema if not exists app;
set search_path = app, public;

-- Helpful extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =========================================================
-- 1) ENUMS
-- =========================================================
do $$ begin
  create type app.user_role            as enum ('student','instructor','company_admin','super_admin');
  create type app.course_level         as enum ('beginner','intermediate','advanced');
  create type app.purchase_type        as enum ('single','bundle','corporate');
  create type app.payment_provider     as enum ('stripe','razorpay','paypal','test');
  create type app.payment_status       as enum ('requires_payment','paid','refunded','failed');
  create type app.enrollment_status    as enum ('active','completed','expired','cancelled');
  create type app.certificate_status   as enum ('locked','issued','revoked');
  create type app.quiz_question_type   as enum ('single_choice','multiple_choice','true_false','short_answer');
  create type app.assignment_type      as enum ('file_upload','link_submission','text_entry');
  create type app.review_status        as enum ('visible','hidden','flagged');
  create type app.company_member_role  as enum ('admin','manager','member');
  create type app.invoice_status       as enum ('draft','open','paid','void','uncollectible','refunded');
  create type app.post_status          as enum ('draft','published','archived');
  create type app.currency_code        as enum ('INR','USD','EUR','GBP');
exception when duplicate_object then null; end $$;


-- =========================================================
-- 2) USERS / COMPANIES
--    Using Clerk for auth → store Clerk user id + profile here.
-- =========================================================

-- Profiles: single source of truth for your app user.
create table if not exists app.profiles (
  id                uuid primary key default uuid_generate_v4(),
  clerk_user_id     text unique not null,          -- Clerk "sub"
  email             text not null,
  full_name         text,
  avatar_url        text,
  role              app.user_role not null default 'student',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_profiles_clerk on app.profiles(clerk_user_id);

create or replace function app.touch_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on app.profiles;
create trigger trg_profiles_touch
before update on app.profiles
for each row execute function app.touch_profiles_updated_at();


-- Companies (B2B)
create table if not exists app.companies (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  domain          text,                           -- optional: enforce email domain for auto-join
  created_at      timestamptz not null default now()
);

-- Company members
create table if not exists app.company_members (
  company_id      uuid not null references app.companies(id) on delete cascade,
  user_id         uuid not null references app.profiles(id) on delete cascade,
  role            app.company_member_role not null default 'member',
  created_at      timestamptz not null default now(),
  primary key(company_id, user_id)
);

create index if not exists idx_company_members_user on app.company_members(user_id);


-- =========================================================
-- 3) CATALOG (Courses, Lessons, Assets, Bundles)
-- =========================================================

-- Instructors are profiles with role='instructor' or 'super_admin'
create table if not exists app.courses (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  subtitle          text,
  description       text,
  level             app.course_level default 'beginner',
  language          text default 'en',
  thumbnail_url     text,
  intro_video_url   text,
  price_cents       int not null default 0,         -- store in minor units
  currency          app.currency_code not null default 'INR',
  is_published      boolean not null default false,
  instructor_id     uuid not null references app.profiles(id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_courses_instructor on app.courses(instructor_id);
create index if not exists idx_courses_published  on app.courses(is_published);

create or replace function app.touch_courses_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_courses_touch on app.courses;
create trigger trg_courses_touch
before update on app.courses
for each row execute function app.touch_courses_updated_at();


create table if not exists app.course_categories (
  id          serial primary key,
  name        text unique not null
);

create table if not exists app.course_category_map (
  course_id   uuid not null references app.courses(id) on delete cascade,
  category_id int  not null references app.course_categories(id) on delete cascade,
  primary key(course_id, category_id)
);


-- Lessons
create table if not exists app.lessons (
  id              uuid primary key default uuid_generate_v4(),
  course_id       uuid not null references app.courses(id) on delete cascade,
  title           text not null,
  content_md      text,                   -- optional longform content/notes
  video_url       text,
  downloadable    boolean not null default false,
  order_index     int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_lessons_course_order on app.lessons(course_id, order_index);

-- Lesson assets (PDFs, slides, etc.)
create table if not exists app.lesson_assets (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid not null references app.lessons(id) on delete cascade,
  name          text not null,
  file_url      text not null,
  created_at    timestamptz not null default now()
);


-- Bundles
create table if not exists app.bundles (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  cover_url       text,
  price_cents     int not null default 0,
  currency        app.currency_code not null default 'INR',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists app.bundle_courses (
  bundle_id   uuid not null references app.bundles(id) on delete cascade,
  course_id   uuid not null references app.courses(id) on delete cascade,
  primary key (bundle_id, course_id)
);

-- Simple discount rules (optional): buy N -> percent_off
create table if not exists app.pricing_rules (
  id            uuid primary key default uuid_generate_v4(),
  min_courses   int not null,
  percent_off   int not null check (percent_off between 0 and 100),
  created_at    timestamptz not null default now()
);


-- =========================================================
-- 4) COMMERCE (Orders, Payments, Invoices, Enrollments)
-- =========================================================

-- Orders capture a purchase intent before payment
create table if not exists app.orders (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references app.profiles(id) on delete cascade,
  purchase_type     app.purchase_type not null,
  company_id        uuid references app.companies(id) on delete set null, -- for corporate
  subtotal_cents    int not null default 0,
  discount_cents    int not null default 0,
  tax_cents         int not null default 0,
  total_cents       int not null default 0,
  currency          app.currency_code not null default 'INR',
  created_at        timestamptz not null default now()
);

create index if not exists idx_orders_user on app.orders(user_id);

-- Items attached to an order (course or bundle)
create table if not exists app.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references app.orders(id) on delete cascade,
  course_id     uuid references app.courses(id) on delete set null,
  bundle_id     uuid references app.bundles(id) on delete set null,
  quantity      int not null default 1,
  unit_price_cents int not null default 0
);

create index if not exists idx_order_items_order on app.order_items(order_id);

-- Payments
create table if not exists app.payments (
  id                uuid primary key default uuid_generate_v4(),
  order_id          uuid not null references app.orders(id) on delete cascade,
  provider          app.payment_provider not null,
  provider_payment_id text,          -- e.g., Stripe payment_intent id
  status            app.payment_status not null default 'requires_payment',
  amount_cents      int not null,
  currency          app.currency_code not null default 'INR',
  receipt_url       text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_payments_order on app.payments(order_id);

-- Enrollments are created after successful payment
create table if not exists app.enrollments (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references app.profiles(id) on delete cascade,
  course_id         uuid not null references app.courses(id) on delete cascade,
  purchased_as      app.purchase_type not null,
  order_id          uuid references app.orders(id) on delete set null,
  status            app.enrollment_status not null default 'active',
  started_at        timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique(user_id, course_id)
);

create index if not exists idx_enrollments_user on app.enrollments(user_id);
create index if not exists idx_enrollments_course on app.enrollments(course_id);

-- Company invoices (for B2B)
create table if not exists app.invoices (
  id                uuid primary key default uuid_generate_v4(),
  company_id        uuid not null references app.companies(id) on delete cascade,
  order_id          uuid references app.orders(id) on delete set null,
  status            app.invoice_status not null default 'open',
  amount_cents      int not null,
  currency          app.currency_code not null default 'INR',
  issued_at         timestamptz not null default now(),
  due_at            timestamptz
);


-- =========================================================
-- 5) LEARNING (Progress, Quizzes, Assignments, Certificates)
-- =========================================================

-- Lesson progress
create table if not exists app.lesson_progress (
  user_id       uuid not null references app.profiles(id) on delete cascade,
  lesson_id     uuid not null references app.lessons(id) on delete cascade,
  completed     boolean not null default false,
  completed_at  timestamptz,
  primary key(user_id, lesson_id)
);

create index if not exists idx_progress_user on app.lesson_progress(user_id);
create index if not exists idx_progress_lesson on app.lesson_progress(lesson_id);

-- Quizzes
create table if not exists app.quizzes (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references app.courses(id) on delete cascade,
  title        text not null,
  is_final     boolean not null default false,  -- final quiz to unlock certificate?
  created_at   timestamptz not null default now()
);

create table if not exists app.quiz_questions (
  id           uuid primary key default uuid_generate_v4(),
  quiz_id      uuid not null references app.quizzes(id) on delete cascade,
  question     text not null,
  type         app.quiz_question_type not null default 'single_choice',
  order_index  int not null default 0
);

create table if not exists app.quiz_options (
  id           uuid primary key default uuid_generate_v4(),
  question_id  uuid not null references app.quiz_questions(id) on delete cascade,
  option_text  text not null,
  is_correct   boolean not null default false
);

-- Attempts/answers
create table if not exists app.quiz_attempts (
  id            uuid primary key default uuid_generate_v4(),
  quiz_id       uuid not null references app.quizzes(id) on delete cascade,
  user_id       uuid not null references app.profiles(id) on delete cascade,
  score_percent int not null default 0,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz
);

create index if not exists idx_attempts_user_quiz on app.quiz_attempts(user_id, quiz_id);

create table if not exists app.quiz_answers (
  attempt_id    uuid not null references app.quiz_attempts(id) on delete cascade,
  question_id   uuid not null references app.quiz_questions(id) on delete cascade,
  option_id     uuid references app.quiz_options(id) on delete set null,
  free_text     text,
  is_correct    boolean,
  primary key (attempt_id, question_id)
);

-- Assignments
create table if not exists app.assignments (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references app.courses(id) on delete cascade,
  title         text not null,
  description   text,
  type          app.assignment_type not null default 'file_upload',
  due_at        timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists app.assignment_submissions (
  id            uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references app.assignments(id) on delete cascade,
  user_id       uuid not null references app.profiles(id) on delete cascade,
  content_url   text,   -- file or link
  text_entry    text,
  submitted_at  timestamptz not null default now(),
  grade_percent int,
  graded_by     uuid references app.profiles(id) on delete set null,
  graded_at     timestamptz
);

create index if not exists idx_assignment_submissions_user on app.assignment_submissions(user_id);

-- Certificates
create table if not exists app.certificates (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references app.profiles(id) on delete cascade,
  course_id       uuid not null references app.courses(id) on delete cascade,
  status          app.certificate_status not null default 'locked',
  pdf_url         text,
  issued_at       timestamptz,
  unique(user_id, course_id)
);


-- =========================================================
-- 6) SOCIAL (Reviews, Q&A, Notes)
-- =========================================================

create table if not exists app.reviews (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references app.courses(id) on delete cascade,
  user_id       uuid not null references app.profiles(id) on delete cascade,
  rating        int not null check (rating between 1 and 5),
  comment       text,
  status        app.review_status not null default 'visible',
  created_at    timestamptz not null default now(),
  unique(course_id, user_id)
);

-- Course Q&A (simple thread/messages)
create table if not exists app.qna_threads (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references app.courses(id) on delete cascade,
  user_id       uuid not null references app.profiles(id) on delete cascade,
  title         text not null,
  created_at    timestamptz not null default now()
);

create table if not exists app.qna_messages (
  id            uuid primary key default uuid_generate_v4(),
  thread_id     uuid not null references app.qna_threads(id) on delete cascade,
  user_id       uuid not null references app.profiles(id) on delete cascade,
  body_md       text not null,
  created_at    timestamptz not null default now()
);

-- Personal notes per lesson
create table if not exists app.notes (
  user_id       uuid not null references app.profiles(id) on delete cascade,
  lesson_id     uuid not null references app.lessons(id) on delete cascade,
  body_md       text,
  updated_at    timestamptz not null default now(),
  primary key(user_id, lesson_id)
);


-- =========================================================
-- 7) CMS (Blog, FAQ)
-- =========================================================

create table if not exists app.blog_categories (
  id        serial primary key,
  name      text unique not null
);

create table if not exists app.blog_posts (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  title         text not null,
  excerpt       text,
  hero_url      text,
  body_md       text,
  status        app.post_status not null default 'draft',
  author_id     uuid not null references app.profiles(id) on delete set null,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists app.blog_post_category_map (
  post_id     uuid not null references app.blog_posts(id) on delete cascade,
  category_id int  not null references app.blog_categories(id) on delete cascade,
  primary key(post_id, category_id)
);

create or replace function app.touch_blog_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_blog_touch on app.blog_posts;
create trigger trg_blog_touch
before update on app.blog_posts
for each row execute function app.touch_blog_updated_at();


-- Global FAQ
create table if not exists app.faqs (
  id          uuid primary key default uuid_generate_v4(),
  question    text not null,
  answer_md   text not null,
  created_at  timestamptz not null default now()
);

-- Course-specific FAQ
create table if not exists app.course_faqs (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references app.courses(id) on delete cascade,
  question    text not null,
  answer_md   text not null,
  created_at  timestamptz not null default now()
);


-- =========================================================
-- 8) ANALYTICS (Lightweight)
-- =========================================================

create table if not exists app.events (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references app.profiles(id) on delete set null,
  name          text not null,           -- e.g., "lesson_started", "lesson_completed"
  course_id     uuid references app.courses(id) on delete set null,
  lesson_id     uuid references app.lessons(id) on delete set null,
  meta          jsonb,
  happened_at   timestamptz not null default now()
);

create index if not exists idx_events_name_time on app.events(name, happened_at);


-- =========================================================
-- 9) VIEWS (Dashboards)
-- =========================================================

-- Per-user course progress (%)
create or replace view app.v_course_progress as
select
  e.user_id,
  e.course_id,
  case
    when count(l.id) = 0 then 0
    else round(100.0 * sum(case when lp.completed then 1 else 0 end) / count(l.id))::int
  end as progress_percent
from app.enrollments e
join app.lessons l on l.course_id = e.course_id
left join app.lesson_progress lp
  on lp.user_id = e.user_id and lp.lesson_id = l.id
group by e.user_id, e.course_id;

-- Student dashboard summary
create or replace view app.v_student_courses as
select
  e.user_id,
  c.id as course_id,
  c.title,
  c.thumbnail_url,
  e.status as enrollment_status,
  coalesce(p.progress_percent, 0) as progress_percent
from app.enrollments e
join app.courses c on c.id = e.course_id
left join app.v_course_progress p on p.user_id = e.user_id and p.course_id = e.course_id;


-- =========================================================
-- 10) FUNCTIONS & TRIGGERS (Auto-complete & Certificates)
-- =========================================================

-- Mark enrollment completed when 100% lessons done
create or replace function app.maybe_complete_enrollment()
returns trigger language plpgsql as $$
declare
  v_user uuid;
  v_course uuid;
  v_progress int;
begin
  v_user := new.user_id;
  select l.course_id into v_course from app.lessons l where l.id = new.lesson_id;

  select progress_percent into v_progress
  from app.v_course_progress
  where user_id = v_user and course_id = v_course;

  if v_progress = 100 then
    update app.enrollments
      set status='completed', completed_at = coalesce(completed_at, now())
      where user_id = v_user and course_id = v_course;

    -- issue certificate if not exists
    insert into app.certificates (user_id, course_id, status, issued_at)
    values (v_user, v_course, 'issued', now())
    on conflict (user_id, course_id)
      do update set status='issued', issued_at = coalesce(app.certificates.issued_at, now());
  end if;

  return new;
end $$;

drop trigger if exists trg_progress_maybe_complete on app.lesson_progress;
create trigger trg_progress_maybe_complete
after insert or update of completed on app.lesson_progress
for each row when (new.completed = true)
execute function app.maybe_complete_enrollment();


-- =========================================================
-- 11) RLS (Row Level Security) – Templates for Clerk
-- NOTE: If you use Supabase with service role from server, you can skip RLS.
-- If you want client-side RLS, pass Clerk JWT through PostgREST and use auth.jwt().
-- auth.jwt() ->> 'sub' should equal profiles.clerk_user_id
-- =========================================================

-- Enable RLS
alter table app.profiles           enable row level security;
alter table app.company_members    enable row level security;
alter table app.companies          enable row level security;
alter table app.courses            enable row level security;
alter table app.lessons            enable row level security;
alter table app.lesson_assets      enable row level security;
alter table app.bundles            enable row level security;
alter table app.bundle_courses     enable row level security;
alter table app.orders             enable row level security;
alter table app.order_items        enable row level security;
alter table app.payments           enable row level security;
alter table app.invoices           enable row level security;
alter table app.enrollments        enable row level security;
alter table app.lesson_progress    enable row level security;
alter table app.quizzes            enable row level security;
alter table app.quiz_questions     enable row level security;
alter table app.quiz_options       enable row level security;
alter table app.quiz_attempts      enable row level security;
alter table app.quiz_answers       enable row level security;
alter table app.assignments        enable row level security;
alter table app.assignment_submissions enable row level security;
alter table app.certificates       enable row level security;
alter table app.reviews            enable row level security;
alter table app.qna_threads        enable row level security;
alter table app.qna_messages       enable row level security;
alter table app.notes              enable row level security;
alter table app.blog_posts         enable row level security;
alter table app.blog_categories    enable row level security;
alter table app.blog_post_category_map enable row level security;
alter table app.faqs               enable row level security;
alter table app.course_faqs        enable row level security;
alter table app.events             enable row level security;

-- Helper policy: who am I? (match Clerk sub to profiles)
create or replace view app.v_me as
select p.*
from app.profiles p
where p.clerk_user_id = (auth.jwt() ->> 'sub');

-- Profiles: users can read their own profile; admins can read all
drop policy if exists "profiles self read" on app.profiles;
create policy "profiles self read" on app.profiles
for select using (
  clerk_user_id = (auth.jwt() ->> 'sub')
  or exists (
    select 1 from app.profiles admin
    where admin.id = p.id
    and admin.role = 'super_admin'
  ) = false  -- keeps it simple; widen later in server code
);

-- Safer: expose profiles via server. For client usage, create a limited view.

-- Enrollments: owner can read/write their enrollments
drop policy if exists "enrollments owner rw" on app.enrollments;
create policy "enrollments owner rw" on app.enrollments
for select using (user_id in (select id from app.v_me))
;
create policy "enrollments owner insert" on app.enrollments
for insert with check (user_id in (select id from app.v_me));

-- Lesson progress: owner rw
drop policy if exists "progress owner rw" on app.lesson_progress;
create policy "progress owner rw" on app.lesson_progress
for select using (user_id in (select id from app.v_me));
create policy "progress owner insert" on app.lesson_progress
for insert with check (user_id in (select id from app.v_me));
create policy "progress owner update" on app.lesson_progress
for update using (user_id in (select id from app.v_me));

-- Reviews: owner rw; anyone can read visible reviews
drop policy if exists "reviews select visible" on app.reviews;
create policy "reviews select visible" on app.reviews
for select using (status='visible');

drop policy if exists "reviews owner insert" on app.reviews;
create policy "reviews owner insert" on app.reviews
for insert with check (user_id in (select id from app.v_me));

drop policy if exists "reviews owner update" on app.reviews;
create policy "reviews owner update" on app.reviews
for update using (user_id in (select id from app.v_me));

-- Courses/Lessons: everyone can select published courses & their lessons
drop policy if exists "courses select published" on app.courses;
create policy "courses select published" on app.courses
for select using (is_published = true);

drop policy if exists "lessons select by course published" on app.lessons;
create policy "lessons select by course published" on app.lessons
for select using (
  exists (select 1 from app.courses c where c.id = lessons.course_id and c.is_published)
);

-- Instructors can manage their own courses/lessons (you can tighten later)
drop policy if exists "courses instructor manage" on app.courses;
create policy "courses instructor manage" on app.courses
for all using (
  instructor_id in (select id from app.v_me)
) with check (
  instructor_id in (select id from app.v_me)
);

drop policy if exists "lessons instructor manage" on app.lessons;
create policy "lessons instructor manage" on app.lessons
for all using (
  exists (select 1 from app.courses c where c.id = lessons.course_id and c.instructor_id in (select id from app.v_me))
) with check (
  exists (select 1 from app.courses c where c.id = lessons.course_id and c.instructor_id in (select id from app.v_me))
);

-- Company data: company members can read their company records
drop policy if exists "companies member read" on app.companies;
create policy "companies member read" on app.companies
for select using (
  exists (
    select 1 from app.company_members m
    join app.profiles me on me.id = m.user_id
    where m.company_id = companies.id
      and me.clerk_user_id = (auth.jwt() ->> 'sub')
  )
);

drop policy if exists "company_members self read" on app.company_members;
create policy "company_members self read" on app.company_members
for select using (
  user_id in (select id from app.v_me)
  or exists (
    select 1 from app.company_members m2
    where m2.company_id = company_members.company_id
      and m2.user_id in (select id from app.v_me)
      and m2.role in ('admin','manager')
  )
);

-- Payments/Orders: owner read
drop policy if exists "orders owner read" on app.orders;
create policy "orders owner read" on app.orders
for select using (user_id in (select id from app.v_me));

drop policy if exists "payments owner read" on app.payments;
create policy "payments owner read" on app.payments
for select using (
  exists (select 1 from app.orders o where o.id = payments.order_id and o.user_id in (select id from app.v_me))
);

-- Notes/Q&A: owner rw; course participants read thread
drop policy if exists "notes owner rw" on app.notes;
create policy "notes owner rw" on app.notes
for select using (user_id in (select id from app.v_me));
create policy "notes owner write" on app.notes
for insert with check (user_id in (select id from app.v_me));
create policy "notes owner upd" on app.notes
for update using (user_id in (select id from app.v_me));

-- (Add admin/super_admin bypass policies server-side as needed)


-- =========================================================
-- 12) SEEDS (Optional minimal)
-- =========================================================
insert into app.course_categories(name)
values ('Web Development'), ('Data Science'), ('Design')
on conflict do nothing;


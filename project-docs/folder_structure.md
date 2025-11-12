# Soliel AI - Folder Structure

```
.
├── app/
│   ├── (marketing)/                   // public pages
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── courses/
│   │   │   └── page.tsx
│   │   ├── faq/
│   │   │   └── page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (auth)/                        // sign-in, sign-up
│   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── page.tsx
│   │   └── sign-up/[[...sign-up]]/
│   │       └── page.tsx
│   ├── (student)/                     // student dashboard
│   │   ├── certificates/
│   │   │   └── page.tsx
│   │   ├── learn/[courseId]/
│   │   │   ├── player/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (instructor)/                  // course builder
│   │   ├── courses/
│   │   │   ├── [courseId]/
│   │   │   │   ├── curriculum/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── pricing/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── publish/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reviews/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── (company)/                     // company admin
│   │   ├── assignments/
│   │   │   └── page.tsx
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── employees/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (admin)/                       // super admin
│   │   ├── payments/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── orders/create/              // create order intent
│   │   │   └── route.ts
│   │   ├── rls-token/                  // (optional) mint Supabase JWT for RLS
│   │   │   └── route.ts
│   │   ├── stripe/webhook/             // payment confirmation
│   │   │   └── route.ts
│   │   └── upload/                     // signed URL uploads
│   │       └── route.ts
│   ├── profile/                        // user profile
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   └── layout.tsx                      // root layout with providers
├── components/
│   ├── cards/
│   │   ├── CourseCard.tsx
│   │   ├── bundle-card.tsx
│   │   └── course-card.tsx
│   ├── course/
│   │   ├── lesson-list.tsx
│   │   ├── player.tsx
│   │   └── progress-bar.tsx
│   ├── data-table/
│   │   └── data-table.tsx
│   ├── forms/
│   │   ├── course-form.tsx
│   │   └── lesson-form.tsx
│   ├── layout/
│   │   ├── Courses.tsx
│   │   ├── EnterpriseSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── LabsSection.tsx
│   │   ├── NavItems.tsx
│   │   ├── Navbar.tsx
│   │   ├── PricingSection.tsx
│   │   ├── QuizSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── dashboard-shell.tsx
│   │   └── site-header.tsx
│   ├── ui/
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── sonner.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   ├── mode-toggle.tsx
│   └── theme-provider.tsx
├── config/
│   ├── constants.ts
│   └── routes.ts
├── constants/
│   └── courses.ts
├── hooks/
│   ├── use-role.ts                  // read role from Profile
│   └── use-upload.ts                // signed URL uploads
├── lib/
│   ├── auth.ts                      // getCurrentUser(), getProfile(), role helpers
│   ├── pdf.ts                       // certificate generator helpers
│   ├── rls.ts                       // (optional) mint Supabase JWT for RLS
│   ├── stripe.ts                    // Stripe SDK init
│   ├── supabase-client.ts           // createBrowserClient
│   ├── supabase-server.ts           // createServerClient (cookies)
│   └── utils.ts
├── project-docs/
│   ├── cybersecurity-checks.md
│   ├── folder_structure.md
│   ├── prd.md
│   ├── schema.md
│   ├── tech-specs.md
│   └── test-plan.md
├── providers/
│   ├── query-provider.tsx           // React Query or SWR config (optional)
│   ├── supabase-provider.tsx        // Supabase auth context
│   └── theme-provider.tsx
├── public/
│   └── images/...
├── server/
│   ├── actions/                     // Server Actions (mutate)
│   │   ├── company.ts
│   │   ├── courses.ts
│   │   ├── enrollments.ts
│   │   ├── progress.ts
│   │   ├── reviews.ts
│   │   └── user.actions.ts
│   ├── queries/                     // Server-side queries (cacheable)
│   │   ├── admin.ts
│   │   ├── catalog.ts
│   │   ├── course.ts
│   │   └── dashboard.ts
│   └── webhooks/
│      └── stripe.ts                 // reusable handlers called by /api/stripe/webhook
├── styles/
│   └── markdown.css
├── types/
│   ├── db.ts
│   ├── enums.ts
│   └── stripe.ts
├── .env.local.example              // env template
├── .gitignore
├── README.md
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── proxy.ts                        // Supabase route protection + role gating
└── tsconfig.json
```
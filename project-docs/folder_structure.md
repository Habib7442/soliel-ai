lms/
├─ app/
│  ├─ (marketing)/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                // Landing/Home
│  │  ├─ courses/
│  │  │  └─ page.tsx             // Public course catalog
│  │  ├─ bundles/
│  │  │  └─ page.tsx             // Public bundles
│  │  ├─ blog/
│  │  │  ├─ page.tsx             // Blog index
│  │  │  └─ [slug]/
│  │  │     └─ page.tsx          // Blog post
│  │  ├─ faq/
│  │  │  └─ page.tsx
│  │  └─ company/
│  │     └─ page.tsx             // B2B landing page
│  │
│  ├─ (auth)/
│  │  ├─ sign-in/                 // Clerk hosted components
│  │  │  └─ page.tsx
│  │  └─ sign-up/
│  │     └─ page.tsx
│  │
│  ├─ (student)/
│  │  ├─ layout.tsx
│  │  ├─ dashboard/
│  │  │  └─ page.tsx
│  │  ├─ courses/
│  │  │  └─ [courseId]/
│  │  │     ├─ page.tsx          // Course details (enrolled view)
│  │  │     └─ player/
│  │  │        └─ page.tsx       // Course player
│  │  └─ certificates/
│  │     └─ page.tsx
│  │
│  ├─ (instructor)/
│  │  ├─ layout.tsx
│  │  ├─ dashboard/
│  │  │  └─ page.tsx
│  │  └─ courses/
│  │     ├─ new/
│  │     │  └─ page.tsx
│  │     └─ [courseId]/
│  │        ├─ page.tsx          // Overview
│  │        ├─ curriculum/
│  │        │  └─ page.tsx
│  │        ├─ pricing/
│  │        │  └─ page.tsx
│  │        ├─ publish/
│  │        │  └─ page.tsx
│  │        └─ reviews/
│  │           └─ page.tsx
│  │
│  ├─ (company)/
│  │  ├─ layout.tsx
│  │  ├─ dashboard/
│  │  │  └─ page.tsx
│  │  ├─ employees/
│  │  │  └─ page.tsx
│  │  ├─ assignments/
│  │  │  └─ page.tsx
│  │  └─ billing/
│  │     └─ page.tsx
│  │
│  ├─ (admin)/
│  │  ├─ layout.tsx
│  │  ├─ dashboard/
│  │  │  └─ page.tsx
│  │  ├─ users/
│  │  │  └─ page.tsx
│  │  ├─ courses/
│  │  │  └─ page.tsx
│  │  ├─ bundles/
│  │  │  └─ page.tsx
│  │  ├─ payments/
│  │  │  └─ page.tsx
│  │  └─ reports/
│  │     └─ page.tsx
│  │
│  ├─ api/
│  │  ├─ stripe/
│  │  │  └─ webhook/route.ts      // Stripe webhook
│  │  ├─ orders/
│  │  │  └─ create/route.ts       // create order intent
│  │  ├─ upload/
│  │  │  └─ route.ts              // signed uploads (Supabase Storage)
│  │  └─ rls-token/
│  │     └─ route.ts              // (optional) exchange Clerk JWT → Supabase RLS token
│  │
│  ├─ layout.tsx                   // Root providers (Clerk, Theme, Query)
│  └─ page.tsx                     // Can redirect to (marketing)
│
├─ components/
│  ├─ ui/                          // shadcn components
│  ├─ layout/
│  │  ├─ site-header.tsx
│  │  └─ dashboard-shell.tsx
│  ├─ cards/
│  │  ├─ course-card.tsx
│  │  └─ bundle-card.tsx
│  ├─ course/
│  │  ├─ lesson-list.tsx
│  │  ├─ player.tsx
│  │  └─ progress-bar.tsx
│  ├─ data-table/
│  │  └─ data-table.tsx
│  └─ forms/
│     ├─ course-form.tsx
│     └─ lesson-form.tsx
│
├─ server/
│  ├─ actions/                     // Server Actions (mutations)
│  │  ├─ enrollments.ts
│  │  ├─ courses.ts
│  │  ├─ progress.ts
│  │  ├─ reviews.ts
│  │  └─ company.ts
│  ├─ queries/                     // Server-side queries (cacheable)
│  │  ├─ catalog.ts
│  │  ├─ course.ts
│  │  ├─ dashboard.ts
│  │  └─ admin.ts
│  └─ webhooks/
│     └─ stripe.ts                 // reusable handlers called by /api/stripe/webhook
│
├─ lib/
│  ├─ supabase-server.ts           // createServerClient (cookies)
│  ├─ supabase-client.ts           // createBrowserClient
│  ├─ auth.ts                      // getCurrentUser(), getProfile(), role helpers
│  ├─ rls.ts                       // (optional) mint Supabase JWT for RLS
│  ├─ stripe.ts                    // Stripe SDK init
│  ├─ pdf.ts                       // certificate generator helpers
│  └─ utils.ts
│
├─ providers/
│  ├─ clerk-provider.tsx
│  ├─ theme-provider.tsx
│  └─ query-provider.tsx           // React Query or SWR config (optional)
│
├─ hooks/
│  ├─ use-role.ts                  // read role from Profile
│  └─ use-upload.ts                // signed URL uploads
│
├─ config/
│  ├─ routes.ts                    // public/protected route lists
│  └─ constants.ts
│
├─ types/
│  ├─ db.ts                        // generated types (supabase)
│  ├─ enums.ts
│  └─ stripe.ts
│
├─ styles/
│  ├─ globals.css
│  └─ markdown.css
│
├─ public/
│  └─ images/...
│
├─ middleware.ts                   // Clerk route protection + role gating
├─ .env.local.example              // env template
├─ package.json
└─ README.md


import { withClerkMiddleware, getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/', '/courses', '/bundles', '/blog', '/faq', '/company',
  '/blog/:path*', '/api/stripe/webhook' // webhooks must stay public
];

export default withClerkMiddleware(async (req) => {
  const { userId, sessionClaims } = getAuth(req);
  const url = req.nextUrl;
  const path = url.pathname;

  // Allow public routes
  for (const pub of PUBLIC_ROUTES) {
    // naive match; you can use path-to-regexp if needed
    if (path === pub || path.startsWith('/blog/')) return NextResponse.next();
  }

  // Require auth for all others
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', path);
    return NextResponse.redirect(signInUrl);
  }

  // Optional: basic role gating by route group prefix
  const role = sessionClaims?.publicMetadata?.role as
    'student' | 'instructor' | 'company_admin' | 'super_admin' | undefined;

  if (path.startsWith('/(admin)') && role !== 'super_admin')
    return NextResponse.redirect(new URL('/(student)/dashboard', req.url));

  if (path.startsWith('/(instructor)') && !['instructor','super_admin'].includes(role ?? ''))
    return NextResponse.redirect(new URL('/(student)/dashboard', req.url));

  if (path.startsWith('/(company)') && !['company_admin','super_admin'].includes(role ?? ''))
    return NextResponse.redirect(new URL('/(student)/dashboard', req.url));

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)', // everything except static files
  ],
};

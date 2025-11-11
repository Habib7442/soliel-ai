# Soliel AI - Learning Management System

A modern Learning Management System (LMS) built with Next.js 16, React 19, and TypeScript.

## Project Overview

Soliel AI is a comprehensive LMS platform that enables:
- Students to purchase and learn courses with progress tracking and certificates
- Instructors to create and manage courses
- Companies to enroll employees and track their learning
- Admins to control the entire system

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19.2, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL + Storage)
- **Payments**: Stripe
- **UI Components**: shadcn/ui
- **Deployment**: Vercel + Supabase

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The application is organized into route groups for different user roles:

- `(marketing)` - Public marketing pages (home, courses, blog, etc.)
- `(auth)` - Authentication pages (sign-in, sign-up)
- `(student)` - Student dashboard and learning pages
- `(instructor)` - Instructor course management
- `(company)` - Company admin pages
- `(admin)` - Super admin pages

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Clerk Documentation](https://clerk.com/docs) - authentication setup and management

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
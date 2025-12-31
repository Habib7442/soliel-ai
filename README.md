# Soliel AI - Learning Management System

## Authentication System

This project implements a comprehensive authentication system with role-based access control for different user types:

1. **Students** - Can enroll in courses, track progress, and earn certificates
2. **Instructors** - Can create and manage courses, view earnings
3. **Company Admins** - Can manage employee enrollments and track team progress
4. **Super Admins** - Can manage the entire platform

## Key Features Implemented

### Authentication Flow
- Unified signup/login form with role selection
- Automatic profile creation with role assignment
- Session management using Supabase Auth
- Role-based route protection

### Role-Based Navigation
- Dynamic navigation menu based on user role
- Protected routes that redirect users to appropriate dashboards
- Middleware for server-side role validation

### Dashboards
- Instructor dashboard with course management
- Student dashboard with learning progress
- Company admin dashboard with team management
- Super admin dashboard with platform controls

### Profile Management
- User profile viewing and editing
- Role-specific profile fields

## Technical Implementation

### Technologies Used
- Next.js 16 with App Router
- Supabase for authentication and database
- TypeScript for type safety
- Tailwind CSS for styling
- Zustand for state management

### Key Components
- `AuthForm` - Unified signup/login form component
- `Navbar` - Role-based navigation component
- `NavItems` - Dynamic navigation items based on user role
- `Loading` - Reusable loading component with customizable size and text
- `GlobalLoading` - Full-page loading overlay for route transitions
- Role-specific dashboard pages
- Profile management pages

### Security Features
- Session validation on both client and server
- Role-based access control
- Protected API routes
- Secure profile updates

## Testing

To test the authentication system:
1. Visit `/test` to see current auth state
2. Use `/sign-up` to create accounts with different roles
3. Use `/sign-in` to log into existing accounts
4. Navigate to role-specific dashboards

## API Routes

- `/api/test-auth` - Test current authentication state
- Protected routes automatically redirect based on user role

## Folder Structure

```
app/
├── (auth)/          # Authentication pages
├── (marketing)/      # Public marketing pages
├── (student)/        # Student dashboard and learning pages
├── (instructor)/     # Instructor course management pages
├── (company)/        # Company admin pages
├── (admin)/          # Super admin pages
├── profile/          # User profile pages
├── test/             # Authentication testing page
├── api/              # API routes
components/
├── auth/             # Authentication components
├── layout/           # Layout components
hooks/
├── useAuthStore.ts   # Zustand store for auth state
lib/
├── auth.ts           # Authentication utilities
providers/
├── supabase-provider.tsx  # Supabase context provider
```



e6e4958908253ef1611fb9a7a7f445ce
# FAQ Management Feature

## Overview
The FAQ Management feature allows instructors to create, edit, and organize frequently asked questions for their courses. Students can view these FAQs on the course detail page, organized by categories for better navigation.

## Features Implemented

### 1. Instructor FAQ Management
- **Create/Edit/Delete FAQs**: Instructors can manage FAQs through the course management interface
- **Category Organization**: FAQs can be grouped by categories (e.g., "Enrollment", "Technical", "Content")
- **Markdown Support**: Rich text formatting for answers using Markdown
- **Visual Preview**: FAQs are displayed with drag handles for better organization

### 2. Student FAQ Display
- **Categorized View**: FAQs are automatically grouped by category for students
- **Expandable Interface**: Accordion-style display for easy navigation
- **Rich Formatting**: Markdown-rendered answers for better readability
- **Course Integration**: FAQs are displayed on the course detail page

## Technical Implementation

### Database Schema
The `course_faqs` table was enhanced with:
- `category` (TEXT): Optional category for grouping FAQs
- `order_index` (INTEGER): Position of FAQ within its category
- `updated_at` (TIMESTAMPTZ): Timestamp for tracking updates

### Components
1. **FaqManager** (`components/instructor/FaqManager.tsx`): Instructor interface for managing FAQs
2. **CourseFaqDisplay** (`components/course/CourseFaqDisplay.tsx`): Student-facing FAQ display
3. **CourseDetailPage** (`app/(student)/learn/[courseId]/detail/page.tsx`): Sample course detail page with FAQ integration

### Server Actions
Enhanced actions in `server/actions/instructor.actions.ts`:
- `getCourseFaqs`: Fetch FAQs ordered by category and position
- `createCourseFaq`: Create new FAQ with category support
- `updateCourseFaq`: Update existing FAQ with category support

## Usage

### For Instructors
1. Navigate to course management → FAQ tab
2. Click "Add FAQ" to create new questions
3. Optionally assign categories to group related questions
4. Use Markdown formatting for rich answers
5. Edit or delete FAQs as needed

### For Students
1. Visit course detail page
2. Scroll to FAQ section
3. Browse questions by category
4. Click questions to expand answers

## Future Enhancements
- Drag-and-drop reordering of FAQs
- Category management interface
- FAQ search functionality
- Student voting on helpful FAQs
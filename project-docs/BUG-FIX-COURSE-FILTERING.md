# 🐛 Critical Bug Fix: Course-Specific Quiz & Assignment Filtering

## Problem
Quizzes and assignments created for one course were showing up in **ALL courses** by the same instructor.

## Root Cause
The Supabase query was using `.eq('lessons.course_id', courseId)` to filter on a **joined table**, which doesn't work properly in Supabase. This caused the filter to be ignored, returning all quizzes/assignments regardless of course.

### Buggy Code Pattern:
```typescript
// ❌ WRONG - This doesn't filter properly
const { data } = await supabase
  .from('quizzes')
  .select('*, lessons (course_id)')
  .eq('lessons.course_id', courseId)  // This filter is IGNORED!
```

## Solution
Changed to a **two-step approach**:
1. First fetch all lesson IDs for the specific course
2. Then fetch quizzes/assignments using `.in('lesson_id', lessonIds)`

### Fixed Code Pattern:
```typescript
// ✅ CORRECT - Two-step filtering
// Step 1: Get lesson IDs for this course
const { data: lessons } = await supabase
  .from('lessons')
  .select('id')
  .eq('course_id', courseId);

const lessonIds = lessons.map(l => l.id);

// Step 2: Fetch quizzes for those lessons only
const { data } = await supabase
  .from('quizzes')
  .select('*, lessons (id, title, course_id)')
  .in('lesson_id', lessonIds)  // Proper filtering!
```

## Files Fixed

### 1. `server/actions/instructor.actions.ts`

#### ✅ Fixed: `getCourseQuizzes` (Lines 1200-1251)
- **Before:** Returned all quizzes from all courses
- **After:** Returns only quizzes for the specified course

#### ✅ Fixed: `getCourseAssignments` (Lines 1412-1463)
- **Before:** Returned all assignments from all courses
- **After:** Returns only assignments for the specified course

## Testing
To verify the fix:

1. **Create quizzes in multiple courses:**
   - Course A: Create "Quiz A"
   - Course B: Create "Quiz B"

2. **Check instructor dashboard:**
   - Go to Course A → Quizzes
   - Should ONLY see "Quiz A" (not "Quiz B")
   - Go to Course B → Quizzes
   - Should ONLY see "Quiz B" (not "Quiz A")

3. **Same test for assignments**

## Impact
- ✅ Quizzes now properly scoped to their course
- ✅ Assignments now properly scoped to their course
- ✅ No more data leakage between courses
- ✅ Instructors can only see/edit their own course content

## Related Tables
This pattern should be used for ANY query that needs to filter by course through a joined `lessons` table:
- `quizzes` (✅ Fixed)
- `assignments` (✅ Fixed)
- Any future lesson-related content types

## Prevention
When writing Supabase queries:
- ❌ **Never** use `.eq()` on joined table columns
- ✅ **Always** filter on the main table or use `.in()` with pre-fetched IDs
- ✅ Test with multiple courses to ensure proper isolation

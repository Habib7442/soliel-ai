# 🐛 Bug Fix: Quiz/Assignment/Lab Lessons Not Showing in Course Player

## Problem
Quiz, assignment, and lab lessons were **not appearing** in the course player sidebar, even though they existed in the database.

## Root Causes

### Issue 1: Content Filtering
The `getCourseWithProgress` function was filtering lessons to only include those with:
- `video_url` (for video lessons)
- `content_md` (for text/article lessons)

This **excluded** quiz, assignment, and lab lessons which don't have video or markdown content.

### Issue 2: Section Grouping
Lessons without a `section_id` (null) were being **silently dropped** during the grouping process, never making it to the UI.

## Solution

### Fix 1: Include Interactive Lessons
```typescript
// ❌ BEFORE - Only video and text lessons
const lessonsWithContent = (allLessons || []).filter(lesson => {
  const hasVideo = lesson.video_url && lesson.video_url.trim() !== '';
  const hasContent = lesson.content_md && lesson.content_md.trim() !== '';
  return hasVideo || hasContent;
});

// ✅ AFTER - Include quiz, assignment, and lab
const lessonsWithContent = (allLessons || []).filter(lesson => {
  const hasVideo = lesson.video_url && lesson.video_url.trim() !== '';
  const hasContent = lesson.content_md && lesson.content_md.trim() !== '';
  const isInteractive = ['quiz', 'assignment', 'lab'].includes(lesson.lesson_type);
  return hasVideo || hasContent || isInteractive;
});
```

### Fix 2: Handle Lessons Without Sections
```typescript
// Collect lessons without a section
const lessonsWithoutSection: LessonData[] = [];

lessonsWithContent.forEach(lesson => {
  if (lesson.section_id) {
    // Add to section
    lessonsBySection.get(lesson.section_id)!.push(lesson);
  } else {
    // Collect for default section
    lessonsWithoutSection.push(lesson);
  }
});

// Create a default section for uncategorized lessons
if (lessonsWithoutSection.length > 0) {
  sectionsWithLessons.push({
    id: 'uncategorized',
    title: 'Course Content',
    description: null,
    order_index: 999,
    lessons: lessonsWithoutSection,
  });
}
```

## Files Modified
- `server/actions/enrollment.actions.ts` - `getCourseWithProgress()` function

## Result
- ✅ Quiz lessons now appear in the sidebar
- ✅ Assignment lessons now appear in the sidebar
- ✅ Lab lessons now appear in the sidebar
- ✅ Lessons without a section appear in a "Course Content" section
- ✅ QuizRenderer component now loads when quiz lesson is clicked

## Testing
1. Create a quiz/assignment/lab lesson (with or without a section)
2. Go to the course player
3. Check the sidebar - lesson should appear
4. Click on the lesson - appropriate renderer should load

## Related
- This fix works in conjunction with the QuizRenderer implementation
- Assignment and Lab renderers still need to be implemented (placeholders exist)

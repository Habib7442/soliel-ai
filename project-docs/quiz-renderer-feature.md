# Quiz Renderer Feature

## Overview
The Quiz Renderer is a fully interactive quiz system integrated into the Course Player, allowing students to take quizzes, view their scores, and review their answers.

## Features

### 1. **Quiz Types**
- **Single Choice**: Radio button selection (one correct answer)
- **Multiple Choice**: Checkbox selection (multiple correct answers)

### 2. **Quiz Settings**
- **Passing Score**: Configurable minimum score to pass (default: 70%)
- **Max Attempts**: Limit on how many times a student can retake (0 = unlimited)
- **Time Limit**: Optional timer for timed quizzes
- **Show Correct Answers**: Toggle to show/hide correct answers after submission

### 3. **Student Experience**

#### Pre-Quiz Screen
- Quiz overview with question count, time limit, and passing score
- Previous attempt history with scores
- Best score display
- Remaining attempts counter
- Start Quiz button

#### During Quiz
- Question-by-question navigation
- Progress bar showing answered questions
- Timer countdown (if enabled)
- Question number indicators (clickable for quick navigation)
- Previous/Next navigation buttons
- Submit button (only when all questions answered)

#### Post-Quiz Screen
- Score display with pass/fail status
- Time taken
- Answer review (if enabled):
  - Student's answer
  - Correct answer (if wrong)
  - Explanation for each question
- Retry button (if attempts remaining)

### 4. **Automatic Grading**
- Real-time score calculation
- Comparison of student answers with correct answers
- Percentage-based scoring
- Pass/fail determination based on passing score

### 5. **Progress Tracking**
- All attempts are saved to the database
- Best score is highlighted
- Completion triggers lesson progress update
- Auto-advance to next lesson on passing

## Database Schema

### Tables Used

#### `quizzes`
```sql
- id (uuid)
- lesson_id (uuid) - Foreign key to lessons
- title (text)
- passing_score (integer) - Default: 70
- max_attempts (integer) - Default: 0 (unlimited)
- time_limit_minutes (integer) - Default: 0 (no limit)
- randomize_questions (boolean) - Default: false
- show_correct_answers (boolean) - Default: true
```

#### `quiz_questions`
```sql
- id (uuid)
- quiz_id (uuid) - Foreign key to quizzes
- question_text (text)
- question_type (text) - 'single' or 'multiple'
- options (text[]) - Array of answer options
- correct_answers (text[]) - Array of correct answers
- explanation (text) - Optional explanation
- order_index (integer)
```

#### `student_quiz_attempts`
```sql
- id (uuid)
- quiz_id (uuid)
- student_id (uuid)
- score (numeric)
- passed (boolean)
- started_at (timestamptz)
- completed_at (timestamptz)
- time_taken_seconds (integer)
- answers (jsonb) - Student's answers { questionId: [answers] }
```

## API Endpoints (Server Actions)

### `getQuizByLessonId(lessonId: string)`
Fetches quiz and all questions for a given lesson.

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    quiz: Quiz;
    questions: QuizQuestion[];
  };
  error?: string;
}
```

### `getStudentQuizAttempts(quizId: string, studentId: string)`
Fetches all previous attempts by a student for a quiz.

**Returns:**
```typescript
{
  success: boolean;
  data?: QuizAttempt[];
  error?: string;
}
```

### `startQuizAttempt(quizId: string, studentId: string)`
Creates a new quiz attempt record.

**Returns:**
```typescript
{
  success: boolean;
  data?: QuizAttempt;
  error?: string;
}
```

### `submitQuizAttempt(attemptId: string, answers: Record<string, string[]>, quizId: string, timeTakenSeconds: number)`
Submits answers, calculates score, and updates the attempt.

**Returns:**
```typescript
{
  success: boolean;
  data?: QuizAttempt;
  error?: string;
}
```

## Component Usage

```tsx
import { QuizRenderer } from "@/components/course/QuizRenderer";

<QuizRenderer
  quiz={quiz}
  questions={questions}
  userId={userId}
  previousAttempts={attempts}
  onComplete={() => {
    // Called when quiz is passed
    handleMarkComplete();
  }}
/>
```

## Styling
The Quiz Renderer uses the premium glassmorphic design system:
- Rounded corners (`rounded-[2.5rem]`, `rounded-2xl`)
- Backdrop blur effects (`backdrop-blur-xl`)
- Subtle shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.02)]`)
- Smooth transitions and hover effects
- Color-coded feedback (green for correct, red for incorrect)

## Future Enhancements
- [ ] Question randomization
- [ ] Answer option randomization
- [ ] Rich text/markdown support in questions
- [ ] Image support in questions
- [ ] Export quiz results as PDF
- [ ] Analytics dashboard for instructors
- [ ] Question bank and reusable questions

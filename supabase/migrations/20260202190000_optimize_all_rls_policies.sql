-- Comprehensive RLS Policy Optimization
-- Replace all auth.uid() calls with (select auth.uid()) for better performance
-- This prevents the function from being re-evaluated for each row

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can delete own profile." ON public.profiles;
CREATE POLICY "Users can delete own profile." ON public.profiles
  FOR DELETE
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id);

-- ============================================================================
-- ENROLLMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.enrollments;
CREATE POLICY "Users can insert their own enrollments" ON public.enrollments
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Instructors can view enrollments for their courses" ON public.enrollments;
CREATE POLICY "Instructors can view enrollments for their courses" ON public.enrollments
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM courses c
    JOIN profiles p ON p.id = c.instructor_id
    WHERE c.id = enrollments.course_id
      AND p.id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Super admins can manage all enrollments" ON public.enrollments;
CREATE POLICY "Super admins can manage all enrollments" ON public.enrollments
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
  ));

-- ============================================================================
-- COURSES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "instructors can manage their courses" ON public.courses;
CREATE POLICY "instructors can manage their courses" ON public.courses
  FOR ALL
  USING (instructor_id = (
    SELECT profiles.id FROM profiles
    WHERE profiles.id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "super_admins_can_manage_all_courses" ON public.courses;
CREATE POLICY "super_admins_can_manage_all_courses" ON public.courses
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
  ));

-- ============================================================================
-- LESSONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "instructors can manage course lessons" ON public.lessons;
CREATE POLICY "instructors can manage course lessons" ON public.lessons
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = lessons.course_id
      AND courses.instructor_id = (
        SELECT profiles.id FROM profiles
        WHERE profiles.id = (select auth.uid())
      )
  ));

DROP POLICY IF EXISTS "students can view purchased course lessons" ON public.lessons;
CREATE POLICY "students can view purchased course lessons" ON public.lessons
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM course_purchases cp
    JOIN courses c ON c.id = lessons.course_id
    WHERE cp.course_id = lessons.course_id
      AND cp.user_id = (select auth.uid())
      AND c.is_published = true
  ));

DROP POLICY IF EXISTS "Students can view enrolled or preview lessons" ON public.lessons;
CREATE POLICY "Students can view enrolled or preview lessons" ON public.lessons
  FOR SELECT
  USING (
    is_preview = true
    OR EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = lessons.course_id
        AND enrollments.user_id = (select auth.uid())
        AND enrollments.status IN ('active', 'completed')
    )
  );

DROP POLICY IF EXISTS "super_admins_can_view_all_lessons" ON public.lessons;
CREATE POLICY "super_admins_can_view_all_lessons" ON public.lessons
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
  ));

-- ============================================================================
-- LESSON_PROGRESS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can manage their own lesson progress" ON public.lesson_progress
  FOR ALL
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Instructors can view lesson progress for their courses" ON public.lesson_progress;
CREATE POLICY "Instructors can view lesson progress for their courses" ON public.lesson_progress
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE l.id = lesson_progress.lesson_id
      AND c.instructor_id = (select auth.uid())
  ));

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews" ON public.reviews
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Students can create reviews" ON public.reviews;
CREATE POLICY "Students can create reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = reviews.course_id
      AND enrollments.user_id = (select auth.uid())
      AND enrollments.status IN ('active', 'completed')
  ));

DROP POLICY IF EXISTS "Instructors can reply to reviews on their courses" ON public.reviews;
CREATE POLICY "Instructors can reply to reviews on their courses" ON public.reviews
  FOR UPDATE
  USING ((select auth.uid()) IN (
    SELECT courses.instructor_id FROM courses
    WHERE courses.id = reviews.course_id
  ));

DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.reviews;
CREATE POLICY "Anyone can view visible reviews" ON public.reviews
  FOR SELECT
  USING (
    status = 'visible'
    OR (select auth.uid()) = user_id
    OR is_course_instructor(course_id)
  );

-- ============================================================================
-- QUIZZES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Instructors can view quizzes for own courses" ON public.quizzes;
CREATE POLICY "Instructors can view quizzes for own courses" ON public.quizzes
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = quizzes.course_id
      AND courses.instructor_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Instructors can create quizzes for own courses" ON public.quizzes;
CREATE POLICY "Instructors can create quizzes for own courses" ON public.quizzes
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = quizzes.course_id
      AND courses.instructor_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Instructors can update quizzes for own courses" ON public.quizzes;
CREATE POLICY "Instructors can update quizzes for own courses" ON public.quizzes
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = quizzes.course_id
      AND courses.instructor_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Instructors can delete quizzes for own courses" ON public.quizzes;
CREATE POLICY "Instructors can delete quizzes for own courses" ON public.quizzes
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = quizzes.course_id
      AND courses.instructor_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Admins have full access to quizzes" ON public.quizzes;
CREATE POLICY "Admins have full access to quizzes" ON public.quizzes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
  ));

-- ============================================================================
-- QUIZ_QUESTIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Instructors can view questions for own course quizzes" ON public.quiz_questions;
CREATE POLICY "Instructors can view questions for own course quizzes" ON public.quiz_questions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quizzes q
    JOIN courses c ON c.id = q.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND c.instructor_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Instructors can create questions for own course quizzes" ON public.quiz_questions;
CREATE POLICY "Instructors can create questions for own course quizzes" ON public.quiz_questions
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM quizzes q
    JOIN courses c ON c.id = q.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND c.instructor_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Instructors can update questions for own course quizzes" ON public.quiz_questions;
CREATE POLICY "Instructors can update questions for own course quizzes" ON public.quiz_questions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM quizzes q
    JOIN courses c ON c.id = q.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND c.instructor_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Instructors can delete questions for own course quizzes" ON public.quiz_questions;
CREATE POLICY "Instructors can delete questions for own course quizzes" ON public.quiz_questions
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM quizzes q
    JOIN courses c ON c.id = q.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND c.instructor_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Students can view questions for enrolled course quizzes" ON public.quiz_questions;
CREATE POLICY "Students can view questions for enrolled course quizzes" ON public.quiz_questions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quizzes q
    JOIN enrollments e ON e.course_id = q.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND e.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Admins have full access to quiz questions" ON public.quiz_questions;
CREATE POLICY "Admins have full access to quiz questions" ON public.quiz_questions
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
  ));

-- ============================================================================
-- STUDENT_QUIZ_ATTEMPTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Students can view own attempts" ON public.student_quiz_attempts;
CREATE POLICY "Students can view own attempts" ON public.student_quiz_attempts
  FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can create attempts" ON public.student_quiz_attempts;
CREATE POLICY "Students can create attempts" ON public.student_quiz_attempts
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Students can update own attempts" ON public.student_quiz_attempts;
CREATE POLICY "Students can update own attempts" ON public.student_quiz_attempts
  FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Instructors can view course attempts" ON public.student_quiz_attempts;
CREATE POLICY "Instructors can view course attempts" ON public.student_quiz_attempts
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quizzes q
    JOIN courses c ON c.id = q.course_id
    WHERE q.id = student_quiz_attempts.quiz_id
      AND c.instructor_id = (select auth.uid())
  ));

-- Add comment documenting the optimization
COMMENT ON SCHEMA public IS 'RLS policies optimized with (select auth.uid()) for improved query performance - 2026-02-02';

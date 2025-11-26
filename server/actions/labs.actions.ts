"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// Type definitions
interface TestCase {
  input?: string;
  expectedOutput?: string;
  description?: string;
}

interface PassingCriteria {
  min_score_percent?: number;
  min_tests_passed?: number;
}

interface TestResult {
  testId?: string;
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
}

interface LabUpdateData {
  title?: string;
  description?: string;
  instructions_md?: string;
  lab_type?: 'coding' | 'quiz_based' | 'simulation' | 'practice';
  environment?: 'javascript' | 'python' | 'html_css' | 'sql' | 'general';
  starter_code?: string;
  solution_code?: string;
  test_cases?: TestCase[];
  is_graded?: boolean;
  passing_criteria?: PassingCriteria;
  max_attempts?: number;
  time_limit_minutes?: number;
  allow_hints?: boolean;
  hints?: string[];
  resources_md?: string;
  estimated_time_minutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface CourseWithInstructor {
  instructor_id: string;
}

// ==================== INSTRUCTOR ACTIONS ====================

export const createLab = async (labData: {
  courseId: string;
  lessonId?: string;
  title: string;
  description?: string;
  instructionsMd?: string;
  labType: 'coding' | 'quiz_based' | 'simulation' | 'practice';
  environment?: 'javascript' | 'python' | 'html_css' | 'sql' | 'general';
  starterCode?: string;
  solutionCode?: string;
  testCases?: TestCase[];
  isGraded?: boolean;
  passingCriteria?: PassingCriteria;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  allowHints?: boolean;
  hints?: string[];
  resourcesMd?: string;
  estimatedTimeMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}) => {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user is the course instructor
    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', labData.courseId)
      .single();

    if (!course || course.instructor_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the next order index
    const { data: existingLabs } = await supabase
      .from('labs')
      .select('order_index')
      .eq('course_id', labData.courseId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingLabs && existingLabs.length > 0 
      ? (existingLabs[0].order_index || 0) + 1 
      : 0;

    const { data, error } = await supabase
      .from('labs')
      .insert({
        course_id: labData.courseId,
        lesson_id: labData.lessonId || null,
        title: labData.title,
        description: labData.description,
        instructions_md: labData.instructionsMd,
        lab_type: labData.labType,
        environment: labData.environment,
        starter_code: labData.starterCode,
        solution_code: labData.solutionCode,
        test_cases: labData.testCases,
        is_graded: labData.isGraded || false,
        passing_criteria: labData.passingCriteria,
        max_attempts: labData.maxAttempts || 0,
        time_limit_minutes: labData.timeLimitMinutes || 0,
        allow_hints: labData.allowHints !== false,
        hints: labData.hints,
        resources_md: labData.resourcesMd,
        estimated_time_minutes: labData.estimatedTimeMinutes,
        difficulty: labData.difficulty || 'medium',
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lab:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/instructor/courses/${labData.courseId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in createLab:', error);
    return { success: false, error: 'Failed to create lab' };
  }
};

export const updateLab = async (labId: string, updates: LabUpdateData) => {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const { data: lab } = await supabase
      .from('labs')
      .select('course_id, courses(instructor_id)')
      .eq('id', labId)
      .single();

    const courses = lab?.courses as CourseWithInstructor | CourseWithInstructor[] | null;
    const instructorId = Array.isArray(courses) ? courses[0]?.instructor_id : courses?.instructor_id;

    if (!lab || instructorId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from('labs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', labId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lab:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/instructor/courses/${lab.course_id}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateLab:', error);
    return { success: false, error: 'Failed to update lab' };
  }
};

export const deleteLab = async (labId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const { data: lab } = await supabase
      .from('labs')
      .select('course_id, courses(instructor_id)')
      .eq('id', labId)
      .single();

    const courses = lab?.courses as CourseWithInstructor | CourseWithInstructor[] | null;
    const instructorId = Array.isArray(courses) ? courses[0]?.instructor_id : courses?.instructor_id;

    if (!lab || instructorId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
      .from('labs')
      .delete()
      .eq('id', labId);

    if (error) {
      console.error('Error deleting lab:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/instructor/courses/${lab.course_id}`);
    return { success: true };
  } catch (error) {
    console.error('Error in deleteLab:', error);
    return { success: false, error: 'Failed to delete lab' };
  }
};

export const getCourseLabs = async (courseId: string) => {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('labs')
      .select(`
        *,
        lesson:lesson_id (
          id,
          title
        )
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching course labs:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getCourseLabs:', error);
    return { success: false, error: 'Failed to fetch course labs' };
  }
};

export const getLabById = async (labId: string) => {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('labs')
      .select(`
        *,
        lesson:lesson_id (
          id,
          title,
          section_id
        ),
        course:course_id (
          id,
          title,
          instructor_id
        )
      `)
      .eq('id', labId)
      .single();

    if (error) {
      console.error('Error fetching lab:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getLabById:', error);
    return { success: false, error: 'Failed to fetch lab' };
  }
};

// ==================== STUDENT ACTIONS ====================

export const submitLabAttempt = async (attemptData: {
  labId: string;
  submittedCode: string;
  output?: string;
  testResults?: TestResult[];
  scorePercent?: number;
  testsPassed?: number;
  totalTests?: number;
  startedAt?: string;
  timeTakenSeconds?: number;
}) => {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if student is enrolled
    const { data: lab } = await supabase
      .from('labs')
      .select('course_id, max_attempts, passing_criteria')
      .eq('id', attemptData.labId)
      .single();

    if (!lab) {
      return { success: false, error: "Lab not found" };
    }

    // Check enrollment
    const { data: enrollment } = await supabase
      .from('course_purchases')
      .select('id')
      .eq('course_id', lab.course_id)
      .eq('user_id', user.id)
      .single();

    if (!enrollment) {
      return { success: false, error: "Not enrolled in this course" };
    }

    // Check max attempts
    if (lab.max_attempts > 0) {
      const { count } = await supabase
        .from('lab_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('lab_id', attemptData.labId)
        .eq('user_id', user.id);

      if (count && count >= lab.max_attempts) {
        return { success: false, error: "Maximum attempts exceeded" };
      }
    }

    // Determine if passed
    const isPassed = attemptData.scorePercent 
      ? attemptData.scorePercent >= (lab.passing_criteria?.min_score_percent || 70)
      : false;

    // Insert attempt
    const { data: attempt, error } = await supabase
      .from('lab_attempts')
      .insert({
        lab_id: attemptData.labId,
        user_id: user.id,
        submitted_code: attemptData.submittedCode,
        output: attemptData.output,
        test_results: attemptData.testResults,
        score_percent: attemptData.scorePercent || 0,
        tests_passed: attemptData.testsPassed || 0,
        total_tests: attemptData.totalTests || 0,
        is_passed: isPassed,
        started_at: attemptData.startedAt,
        submitted_at: new Date().toISOString(),
        time_taken_seconds: attemptData.timeTakenSeconds,
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting lab attempt:', error);
      return { success: false, error: error.message };
    }

    // Update lab progress
    const { data: currentProgress } = await supabase
      .from('lab_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lab_id', attemptData.labId)
      .single();

    const newBestScore = Math.max(
      currentProgress?.best_score_percent || 0,
      attemptData.scorePercent || 0
    );

    await supabase
      .from('lab_progress')
      .upsert({
        user_id: user.id,
        lab_id: attemptData.labId,
        completed: isPassed || (currentProgress?.completed || false),
        completed_at: isPassed && !currentProgress?.completed ? new Date().toISOString() : currentProgress?.completed_at,
        best_score_percent: newBestScore,
        attempts_count: (currentProgress?.attempts_count || 0) + 1,
      });

    revalidatePath(`/learn/${lab.course_id}`);
    return { success: true, data: attempt, isPassed };
  } catch (error) {
    console.error('Error in submitLabAttempt:', error);
    return { success: false, error: 'Failed to submit lab attempt' };
  }
};

export const getLabProgress = async (labId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from('lab_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lab_id', labId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching lab progress:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error in getLabProgress:', error);
    return { success: false, error: 'Failed to fetch lab progress' };
  }
};

export const getLabAttempts = async (labId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from('lab_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('lab_id', labId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lab attempts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getLabAttempts:', error);
    return { success: false, error: 'Failed to fetch lab attempts' };
  }
};

// ==================== INSTRUCTOR REVIEW ACTIONS ====================

export const getLabSubmissions = async (labId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify instructor
    const { data: lab } = await supabase
      .from('labs')
      .select('course_id, courses(instructor_id)')
      .eq('id', labId)
      .single();

    const courses = lab?.courses as CourseWithInstructor | CourseWithInstructor[] | null;
    const instructorId = Array.isArray(courses) ? courses[0]?.instructor_id : courses?.instructor_id;

    if (!lab || instructorId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from('lab_attempts')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('lab_id', labId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching lab submissions:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getLabSubmissions:', error);
    return { success: false, error: 'Failed to fetch lab submissions' };
  }
};

export const provideLabFeedback = async (attemptId: string, feedback: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from('lab_attempts')
      .update({
        instructor_feedback: feedback,
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      console.error('Error providing feedback:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in provideLabFeedback:', error);
    return { success: false, error: 'Failed to provide feedback' };
  }
};

"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// Course-related actions
export const createCourse = async (courseData: {
  title: string;
  subtitle?: string;
  description?: string;
  level?: string;
  language?: string;
  price_cents?: number;
  currency?: string;
  instructor_id: string;
  category_name?: string;
}, categoryId?: number) => {
  try {
    const supabase = await createServerClient();
    
    // Validate required fields
    if (!courseData.title?.trim()) {
      return { success: false, error: "Course title is required" };
    }
    
    if (!courseData.subtitle?.trim()) {
      return { success: false, error: "Short description is required" };
    }
    
    if (!courseData.description?.trim()) {
      return { success: false, error: "Full description is required" };
    }
    
    // Handle category creation
    let categoryIdToUse = categoryId;
    if (courseData.category_name) {
      // Check if category already exists
      const { data: existingCategory, error: categoryCheckError } = await supabase
        .from('course_categories')
        .select('id')
        .eq('name', courseData.category_name)
        .single();
      
      if (categoryCheckError && categoryCheckError.code !== 'PGRST116') {
        // Some other error occurred
        console.error('Error checking category:', categoryCheckError);
      }
      
      if (existingCategory) {
        // Category exists, use its ID
        categoryIdToUse = existingCategory.id;
      } else {
        // Category doesn't exist, create it
        const { data: newCategory, error: categoryCreateError } = await supabase
          .from('course_categories')
          .insert({ name: courseData.category_name })
          .select('id')
          .single();
        
        if (categoryCreateError) {
          console.error('Error creating category:', categoryCreateError);
        } else {
          categoryIdToUse = newCategory.id;
        }
      }
    }
    
    // Remove category_name from courseData since it's not a course field
    const { category_name, ...courseInsertData } = courseData;
    
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseInsertData,
        status: 'draft', // Default to draft status
        is_published: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return { success: false, error: `Failed to create course: ${error.message}` };
    }

    // If category is provided, create the category mapping
    if (categoryIdToUse && data?.id) {
      const { error: categoryError } = await supabase
        .from('course_category_map')
        .insert({
          course_id: data.id,
          category_id: categoryIdToUse
        });
      
      if (categoryError) {
        console.error('Error creating category mapping:', categoryError);
        // Don't fail the course creation if category mapping fails
      }
    }

    revalidatePath('/instructor-dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error in createCourse:', error);
    return { success: false, error: 'Failed to create course. Please try again.' };
  }
};

export const updateCourse = async (courseId: string, courseData: Partial<{
  title: string;
  subtitle: string;
  description: string;
  level: string;
  language: string;
  price_cents: number;
  currency: string;
  status: string;
  is_published: boolean;
}>) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      return { success: false, error: `Failed to update course: ${error.message}` };
    }

    revalidatePath('/instructor-dashboard');
    revalidatePath(`/courses/${courseId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateCourse:', error);
    return { success: false, error: 'Failed to update course. Please try again.' };
  }
};

export const submitCourseForReview = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('courses')
      .update({ 
        status: 'pending',
        is_published: false
      })
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Error submitting course for review:', error);
      return { success: false, error: `Failed to submit course for review: ${error.message}` };
    }

    revalidatePath('/instructor-dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error in submitCourseForReview:', error);
    return { success: false, error: 'Failed to submit course for review. Please try again.' };
  }
};

export const publishCourse = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('courses')
      .update({ 
        status: 'published',
        is_published: true
      })
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Error publishing course:', error);
      return { success: false, error: `Failed to publish course: ${error.message}` };
    }

    revalidatePath('/instructor-dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error in publishCourse:', error);
    return { success: false, error: 'Failed to publish course. Please try again.' };
  }
};

export const getInstructorCourses = async (instructorId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        subtitle,
        description,
        level,
        language,
        price_cents,
        currency,
        status,
        is_published,
        created_at,
        updated_at
      `)
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching instructor courses:', error);
      return { success: false, error: `Failed to fetch courses: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getInstructorCourses:', error);
    return { success: false, error: 'Failed to fetch courses. Please try again.' };
  }
};

export const getCourseEarnings = async (instructorId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('course_purchases')
      .select(`
        id,
        amount,
        purchase_date,
        courses (title)
      `)
      .eq('course.instructor_id', instructorId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching course earnings:', error);
      return { success: false, error: `Failed to fetch earnings: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCourseEarnings:', error);
    return { success: false, error: 'Failed to fetch earnings. Please try again.' };
  }
};

export const getStudentEnrollments = async (instructorId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('course_purchases')
      .select(`
        id,
        purchase_date,
        amount,
        profiles (full_name, email)
      `)
      .eq('course.instructor_id', instructorId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching student enrollments:', error);
      return { success: false, error: `Failed to fetch enrollments: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getStudentEnrollments:', error);
    return { success: false, error: 'Failed to fetch enrollments. Please try again.' };
  }
};

export const addLesson = async (lessonData: {
  course_id: string;
  title: string;
  content_md?: string;
  video_url?: string;
  downloadable?: boolean;
  order_index?: number;
}) => {
  try {
    const supabase = await createServerClient();
    
    // Validate required fields
    if (!lessonData.course_id) {
      return { success: false, error: "Course ID is required" };
    }
    
    if (!lessonData.title?.trim()) {
      return { success: false, error: "Lesson title is required" };
    }
    
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();

    if (error) {
      console.error('Error adding lesson:', error);
      return { success: false, error: `Failed to add lesson: ${error.message}` };
    }

    revalidatePath(`/instructor/courses/${lessonData.course_id}/curriculum`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in addLesson:', error);
    return { success: false, error: 'Failed to add lesson. Please try again.' };
  }
};

export const createQuiz = async (quizData: {
  lesson_id: string;
  title: string;
  passing_score?: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  randomize_questions?: boolean;
  show_correct_answers?: boolean;
}) => {
  try {
    const supabase = await createServerClient();
    
    // Validate required fields
    if (!quizData.lesson_id) {
      return { success: false, error: "Lesson ID is required" };
    }
    
    if (!quizData.title?.trim()) {
      return { success: false, error: "Quiz title is required" };
    }
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert(quizData)
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz:', error);
      return { success: false, error: `Failed to create quiz: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createQuiz:', error);
    return { success: false, error: 'Failed to create quiz. Please try again.' };
  }
};

export const addQuizQuestions = async (quizId: string, questions: {
  question_text: string;
  question_type: string;
  options: string[];
  correct_answers: number[];
  explanation?: string;
  order_index?: number;
}[]) => {
  try {
    const supabase = await createServerClient();
    
    // Validate required fields
    if (!quizId) {
      return { success: false, error: "Quiz ID is required" };
    }
    
    if (!questions || questions.length === 0) {
      return { success: false, error: "At least one question is required" };
    }
    
    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text?.trim()) {
        return { success: false, error: `Question ${i + 1} text is required` };
      }
      
      if (!q.options || q.options.length === 0) {
        return { success: false, error: `Question ${i + 1} must have at least one option` };
      }
      
      if (!q.correct_answers || q.correct_answers.length === 0) {
        return { success: false, error: `Question ${i + 1} must have at least one correct answer` };
      }
    }
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(questions.map(q => ({
        ...q,
        quiz_id: quizId
      })))
      .select();

    if (error) {
      console.error('Error adding quiz questions:', error);
      return { success: false, error: `Failed to add quiz questions: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in addQuizQuestions:', error);
    return { success: false, error: 'Failed to add quiz questions. Please try again.' };
  }
};

export const createAssignment = async (assignmentData: {
  lesson_id: string;
  title: string;
  instructions: string;
  file_types_allowed?: string;
  max_file_size_mb?: number;
  allow_multiple_files?: boolean;
  grading_scale?: string;
  max_points?: number;
  rubric?: string;
  due_date?: string;
}) => {
  try {
    const supabase = await createServerClient();
    
    // Validate required fields
    if (!assignmentData.lesson_id) {
      return { success: false, error: "Lesson ID is required" };
    }
    
    if (!assignmentData.title?.trim()) {
      return { success: false, error: "Assignment title is required" };
    }
    
    if (!assignmentData.instructions?.trim()) {
      return { success: false, error: "Assignment instructions are required" };
    }
    
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      return { success: false, error: `Failed to create assignment: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createAssignment:', error);
    return { success: false, error: 'Failed to create assignment. Please try again.' };
  }
};

export const submitAssignment = async (submissionData: {
  assignment_id: string;
  student_id: string;
  submission_files: { 
    file_name: string;
    file_url: string;
    file_size: number;
  }[];
}) => {
  try {
    const supabase = await createServerClient();
    
    // Validate required fields
    if (!submissionData.assignment_id) {
      return { success: false, error: "Assignment ID is required" };
    }
    
    if (!submissionData.student_id) {
      return { success: false, error: "Student ID is required" };
    }
    
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('Error submitting assignment:', error);
      return { success: false, error: `Failed to submit assignment: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    return { success: false, error: 'Failed to submit assignment. Please try again.' };
  }
};

export const gradeAssignment = async (submissionId: string, gradeData: {
  grade?: number;
  feedback?: string;
}) => {
  try {
    const supabase = await createServerClient();
    
    // Validate required fields
    if (!submissionId) {
      return { success: false, error: "Submission ID is required" };
    }
    
    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        ...gradeData,
        graded_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('Error grading assignment:', error);
      return { success: false, error: `Failed to grade assignment: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in gradeAssignment:', error);
    return { success: false, error: 'Failed to grade assignment. Please try again.' };
  }
};
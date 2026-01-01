"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { Review, ReviewWithProfilesArray } from "@/hooks/useInstructorStore";

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
  thumbnail_url?: string;
  prerequisites?: string;
  estimated_duration_hours?: number;
  intro_video_url?: string;
  learning_outcomes?: string[];
  target_audience?: string;
  requirements?: string;
  allow_in_bundles?: boolean;
  bundle_discount_percent?: number;
  enable_qna?: boolean;
  enable_reviews?: boolean;
  enable_certificates?: boolean;
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
  prerequisites: string;
  estimated_duration_hours: number;
  intro_video_url: string;
  learning_outcomes: string[];
  target_audience: string;
  requirements: string;
  allow_in_bundles: boolean;
  bundle_discount_percent: number;
  enable_qna: boolean;
  enable_reviews: boolean;
  enable_certificates: boolean;
  thumbnail_url: string;
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
        thumbnail_url,
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
    
    // First get all courses by this instructor
    const { data: instructorCourses } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', instructorId);
    
    if (!instructorCourses || instructorCourses.length === 0) {
      return { success: true, data: [] };
    }
    
    const courseIds = instructorCourses.map(c => c.id);
    
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        created_at,
        courses (title, price_cents)
      `)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching course earnings:', error);
      return { success: false, error: `Failed to fetch earnings: ${error.message}` };
    }

    // Map the response to include amount
    const earningsWithAmount = data.map((item: any) => {
       const course = Array.isArray(item.courses) ? item.courses[0] : item.courses;
       const priceCents = course?.price_cents || 0;
       return {
         ...item,
         amount: priceCents / 100,
         courses: item.courses
       };
    });

    return { success: true, data: earningsWithAmount };
  } catch (error) {
    console.error('Error in getCourseEarnings:', error);
    return { success: false, error: 'Failed to fetch earnings. Please try again.' };
  }
};

export const getStudentEnrollments = async (instructorId: string) => {
  try {
    const supabase = await createServerClient();
    
    // First get all courses by this instructor
    const { data: instructorCourses } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', instructorId);
    
    if (!instructorCourses || instructorCourses.length === 0) {
      return { success: true, data: [] };
    }
    
    const courseIds = instructorCourses.map(c => c.id);
    
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        created_at,
        status,
        course_id,
        courses:course_id (
          title
        )
      `)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
      .limit(10);

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
  section_id?: string;
  title: string;
  content_md?: string;
  video_url?: string;
  downloadable?: boolean;
  order_index?: number;
  lesson_type?: string;
  is_preview?: boolean;
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
  order_index: number;
  options: string[];
  correct_answers: number[];
  explanation?: string;
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
    
    // Insert questions
    const questionsData = questions.map(q => ({
      quiz_id: quizId,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answers: q.correct_answers,
      explanation: q.explanation,
      order_index: q.order_index
    }));
    
    const { data: insertedQuestions, error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsData)
      .select();

    if (questionsError) {
      console.error('Error adding quiz questions:', questionsError);
      return { success: false, error: `Failed to add quiz questions: ${questionsError.message}` };
    }

    return { success: true, data: insertedQuestions };
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

// Get assignment submissions for grading
export const getAssignmentSubmissions = async (assignmentId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        submission_files,
        submitted_at,
        grade,
        feedback,
        graded_at,
        profiles!assignment_submissions_student_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignment submissions:', error);
      return { success: false, error: `Failed to fetch submissions: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getAssignmentSubmissions:', error);
    return { success: false, error: 'Failed to fetch submissions. Please try again.' };
  }
};

// Get course reviews
// Get course reviews
export const getCourseReviews = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        course_id,
        user_id,
        rating,
        comment,
        status,
        instructor_response,
        responded_at,
        created_at,
        profiles!inner (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching course reviews:', error);
      return { success: false, error: `Failed to fetch reviews: ${error.message}` };
    }

    // Transform the data to match the expected Review interface
    const transformedData = data?.map((review: ReviewWithProfilesArray) => ({
      ...review,
      profiles: review.profiles && review.profiles.length > 0 ? review.profiles[0] : null
    })) || [];
    
    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error in getCourseReviews:', error);
    return { success: false, error: 'Failed to fetch reviews. Please try again.' };
  }
};

// Update review status (hide/show)
export const updateReviewStatus = async (reviewId: string, status: 'visible' | 'hidden' | 'flagged') => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', reviewId)
      .select(`
        id,
        course_id,
        user_id,
        rating,
        comment,
        status,
        instructor_response,
        responded_at,
        created_at,
        profiles!inner (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating review status:', error);
      return { success: false, error: `Failed to update review status: ${error.message}` };
    }

    // Transform the data to match the expected Review interface
    const transformedData = data ? {
      ...data,
      profiles: data.profiles && data.profiles.length > 0 ? data.profiles[0] : null
    } : null;
    
    return { success: true, data: transformedData as Review };
  } catch (error) {
    console.error('Error in updateReviewStatus:', error);
    return { success: false, error: 'Failed to update review status. Please try again.' };
  }
};

// Get course FAQs
export const getCourseFaqs = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('course_faqs')
      .select('*')
      .eq('course_id', courseId)
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching course FAQs:', error);
      return { success: false, error: `Failed to fetch FAQs: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCourseFaqs:', error);
    return { success: false, error: 'Failed to fetch FAQs. Please try again.' };
  }
};

// Create course FAQ
export const createCourseFaq = async (faqData: {
  course_id: string;
  question: string;
  answer_md: string;
  category?: string;
  order_index?: number;
}) => {
  try {
    const supabase = await createServerClient();
    
    if (!faqData.course_id || !faqData.question?.trim() || !faqData.answer_md?.trim()) {
      return { success: false, error: "Question and answer are required" };
    }
    
    // Set default order_index if not provided
    const faqDataWithOrder = {
      ...faqData,
      order_index: faqData.order_index ?? 0,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('course_faqs')
      .insert(faqDataWithOrder)
      .select()
      .single();

    if (error) {
      console.error('Error creating course FAQ:', error);
      return { success: false, error: `Failed to create FAQ: ${error.message}` };
    }

    revalidatePath(`/instructor/courses/${faqData.course_id}/faq`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in createCourseFaq:', error);
    return { success: false, error: 'Failed to create FAQ. Please try again.' };
  }
};

// Update course FAQ
export const updateCourseFaq = async (faqId: string, updates: {
  question?: string;
  answer_md?: string;
  category?: string;
  order_index?: number;
}) => {
  try {
    const supabase = await createServerClient();
    
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('course_faqs')
      .update(updatesWithTimestamp)
      .eq('id', faqId)
      .select()
      .single();

    if (error) {
      console.error('Error updating course FAQ:', error);
      return { success: false, error: `Failed to update FAQ: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateCourseFaq:', error);
    return { success: false, error: 'Failed to update FAQ. Please try again.' };
  }
};

// Delete course FAQ
export const deleteCourseFaq = async (faqId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('course_faqs')
      .delete()
      .eq('id', faqId);

    if (error) {
      console.error('Error deleting course FAQ:', error);
      return { success: false, error: `Failed to delete FAQ: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCourseFaq:', error);
    return { success: false, error: 'Failed to delete FAQ. Please try again.' };
  }
};

// Delete course
export const deleteCourse = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    // First get the course to check for thumbnail
    const { data: course } = await supabase
      .from('courses')
      .select('thumbnail_url')
      .eq('id', courseId)
      .single();
    
    // Delete thumbnail from storage if exists
    if (course?.thumbnail_url) {
      const fileName = course.thumbnail_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('course-thumbnails')
          .remove([fileName]);
      }
    }
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      return { success: false, error: `Failed to delete course: ${error.message}` };
    }

    revalidatePath('/instructor-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    return { success: false, error: 'Failed to delete course. Please try again.' };
  }
};

// Get Q&A threads for a course
export const getQnaThreads = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('qna_threads')
      .select(`
        id,
        title,
        created_at,
        is_resolved,
        is_pinned,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('course_id', courseId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Q&A threads:', error);
      return { success: false, error: `Failed to fetch threads: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getQnaThreads:', error);
    return { success: false, error: 'Failed to fetch threads. Please try again.' };
  }
};

// Get messages in a Q&A thread
export const getQnaMessages = async (threadId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('qna_messages')
      .select(`
        id,
        body_md,
        created_at,
        upvotes,
        is_official_answer,
        profiles (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching Q&A messages:', error);
      return { success: false, error: `Failed to fetch messages: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getQnaMessages:', error);
    return { success: false, error: 'Failed to fetch messages. Please try again.' };
  }
};

// Reply to Q&A thread
export const replyToQnaThread = async (threadId: string, userId: string, message: string) => {
  try {
    const supabase = await createServerClient();
    
    if (!message?.trim()) {
      return { success: false, error: "Message cannot be empty" };
    }
    
    const { data, error } = await supabase
      .from('qna_messages')
      .insert({
        thread_id: threadId,
        user_id: userId,
        body_md: message
      })
      .select()
      .single();

    if (error) {
      console.error('Error replying to Q&A thread:', error);
      return { success: false, error: `Failed to reply: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in replyToQnaThread:', error);
    return { success: false, error: 'Failed to reply. Please try again.' };
  }
};

// Mark Q&A thread as resolved
export const markQnaThreadAsResolved = async (threadId: string, isResolved: boolean) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('qna_threads')
      .update({ 
        is_resolved: isResolved,
        updated_at: new Date().toISOString()
      })
      .eq('id', threadId)
      .select()
      .single();

    if (error) {
      console.error('Error marking Q&A thread as resolved:', error);
      return { success: false, error: `Failed to update thread: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in markQnaThreadAsResolved:', error);
    return { success: false, error: 'Failed to update thread. Please try again.' };
  }
};

// Pin/Unpin Q&A thread
export const pinQnaThread = async (threadId: string, isPinned: boolean) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('qna_threads')
      .update({ 
        is_pinned: isPinned,
        updated_at: new Date().toISOString()
      })
      .eq('id', threadId)
      .select()
      .single();

    if (error) {
      console.error('Error pinning Q&A thread:', error);
      return { success: false, error: `Failed to update thread: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in pinQnaThread:', error);
    return { success: false, error: 'Failed to update thread. Please try again.' };
  }
};

// Upvote Q&A message
export const upvoteQnaMessage = async (messageId: string) => {
  try {
    const supabase = await createServerClient();
    
    // First, get the current upvotes count
    const { data: message, error: fetchError } = await supabase
      .from('qna_messages')
      .select('upvotes')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('Error fetching Q&A message:', fetchError);
      return { success: false, error: `Failed to fetch message: ${fetchError.message}` };
    }

    // Update with incremented upvotes
    const newUpvotes = (message.upvotes || 0) + 1;
    
    const { data, error } = await supabase
      .from('qna_messages')
      .update({ 
        upvotes: newUpvotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Error upvoting Q&A message:', error);
      return { success: false, error: `Failed to upvote message: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in upvoteQnaMessage:', error);
    return { success: false, error: 'Failed to upvote message. Please try again.' };
  }
};

// Mark message as official answer
export const markAsOfficialAnswer = async (messageId: string, isOfficial: boolean) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('qna_messages')
      .update({ 
        is_official_answer: isOfficial,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Error marking message as official answer:', error);
      return { success: false, error: `Failed to update message: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in markAsOfficialAnswer:', error);
    return { success: false, error: 'Failed to update message. Please try again.' };
  }
};

// Get course lessons
export const getCourseLessons = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching course lessons:', error);
      return { success: false, error: `Failed to fetch lessons: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCourseLessons:', error);
    return { success: false, error: 'Failed to fetch lessons. Please try again.' };
  }
};

// Update lesson
export const updateLesson = async (lessonId: string, updates: Partial<{
  title: string;
  content_md: string;
  video_url: string;
  downloadable: boolean;
  order_index: number;
}>) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', lessonId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson:', error);
      return { success: false, error: `Failed to update lesson: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateLesson:', error);
    return { success: false, error: 'Failed to update lesson. Please try again.' };
  }
};

// Delete lesson
export const deleteLesson = async (lessonId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      console.error('Error deleting lesson:', error);
      return { success: false, error: `Failed to delete lesson: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteLesson:', error);
    return { success: false, error: 'Failed to delete lesson. Please try again.' };
  }
};

// Get course quizzes
export const getCourseQuizzes = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        lessons (course_id)
      `)
      .eq('lessons.course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching course quizzes:', error);
      return { success: false, error: `Failed to fetch quizzes: ${error.message}` };
    }

    // Flatten the data structure for the UI
    const flattenedData = data.map(quiz => ({
      ...quiz,
      course_id: quiz.lessons?.course_id
    }));

    return { success: true, data: flattenedData };
  } catch (error) {
    console.error('Error in getCourseQuizzes:', error);
    return { success: false, error: 'Failed to fetch quizzes. Please try again.' };
  }
};

// Get quiz with questions
export const getQuizWithQuestions = async (quizId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) {
      console.error('Error fetching quiz:', quizError);
      return { success: false, error: `Failed to fetch quiz: ${quizError.message}` };
    }

    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching quiz questions:', questionsError);
      return { success: false, error: `Failed to fetch questions: ${questionsError.message}` };
    }

    return { success: true, data: { ...quiz, questions } };
  } catch (error) {
    console.error('Error in getQuizWithQuestions:', error);
    return { success: false, error: 'Failed to fetch quiz. Please try again.' };
  }
};

// Update quiz
export const updateQuiz = async (quizId: string, updates: Partial<{
  title: string;
  is_final: boolean;
  passing_score?: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  randomize_questions?: boolean;
  show_correct_answers?: boolean;
}>) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', quizId)
      .select()
      .single();

    if (error) {
      console.error('Error updating quiz:', error);
      return { success: false, error: `Failed to update quiz: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateQuiz:', error);
    return { success: false, error: 'Failed to update quiz. Please try again.' };
  }
};

// Update a single quiz question
export const updateQuizQuestion = async (questionId: string, updates: Partial<{
  question_text: string;
  question_type: string;
  options: string[];
  correct_answers: number[];
  explanation?: string;
  order_index: number;
}>) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating quiz question:', error);
      return { success: false, error: `Failed to update question: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateQuizQuestion:', error);
    return { success: false, error: 'Failed to update question. Please try again.' };
  }
};

// Add a single quiz question
export const addQuizQuestion = async (quizId: string, question: {
  question_text: string;
  question_type: string;
  options: string[];
  correct_answers: number[];
  explanation?: string;
  order_index: number;
}) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        quiz_id: quizId,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        correct_answers: question.correct_answers,
        explanation: question.explanation,
        order_index: question.order_index,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding quiz question:', error);
      return { success: false, error: `Failed to add question: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in addQuizQuestion:', error);
    return { success: false, error: 'Failed to add question. Please try again.' };
  }
};

// Delete quiz
export const deleteQuiz = async (quizId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) {
      console.error('Error deleting quiz:', error);
      return { success: false, error: `Failed to delete quiz: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteQuiz:', error);
    return { success: false, error: 'Failed to delete quiz. Please try again.' };
  }
};

// Get course assignments
export const getCourseAssignments = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        lessons (course_id, title)
      `)
      .eq('lessons.course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching course assignments:', error);
      return { success: false, error: `Failed to fetch assignments: ${error.message}` };
    }

    // Flatten the data structure for the UI
    const flattenedData = data.map(assignment => ({
      ...assignment,
      course_id: assignment.lessons?.course_id,
      lesson_title: assignment.lessons?.title
    }));

    return { success: true, data: flattenedData };
  } catch (error) {
    console.error('Error in getCourseAssignments:', error);
    return { success: false, error: 'Failed to fetch assignments. Please try again.' };
  }
};

// Update assignment
export const updateAssignment = async (assignmentId: string, updates: Partial<{
  title: string;
  instructions: string;
  due_date: string;
}>) => {
  try {
    const supabase = await createServerClient();
    
    // Map the field names to match the database schema
    const dbUpdates: Partial<{
      title: string;
      instructions: string;
      due_date: string;
    }> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
    if (updates.due_date !== undefined) dbUpdates.due_date = updates.due_date;

    const { data, error } = await supabase
      .from('assignments')
      .update(dbUpdates)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment:', error);
      return { success: false, error: `Failed to update assignment: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateAssignment:', error);
    return { success: false, error: 'Failed to update assignment. Please try again.' };
  }
};

// Delete assignment
export const deleteAssignment = async (assignmentId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
      return { success: false, error: `Failed to delete assignment: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteAssignment:', error);
    return { success: false, error: 'Failed to delete assignment. Please try again.' };
  }
};

// Get instructor analytics
// Upload thumbnail to storage
export const uploadThumbnail = async (file: File) => {
  try {
    const supabase = await createServerClient();
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('course-thumbnails')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading thumbnail:', error);
      return { success: false, error: `Failed to upload thumbnail: ${error.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-thumbnails')
      .getPublicUrl(fileName);

    return { success: true, data: { url: publicUrl, path: fileName } };
  } catch (error) {
    console.error('Error in uploadThumbnail:', error);
    return { success: false, error: 'Failed to upload thumbnail. Please try again.' };
  }
};

export const getInstructorAnalytics = async (instructorId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Get total students across all courses
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, courses!inner(instructor_id)')
      .eq('courses.instructor_id', instructorId);

    // Get total revenue
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount_cents, orders!inner(order_items!inner(courses!inner(instructor_id)))')
      .eq('status', 'paid')
      .eq('orders.order_items.courses.instructor_id', instructorId);

    // Get average rating across all courses
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, courses!inner(instructor_id)')
      .eq('courses.instructor_id', instructorId)
      .eq('status', 'visible');

    const totalStudents = enrollments?.length || 0;
    const totalRevenue = (payments?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0) / 100;
    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      success: true,
      data: {
        totalStudents,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews?.length || 0
      }
    };
  } catch (error) {
    console.error('Error in getInstructorAnalytics:', error);
    return { success: false, error: 'Failed to fetch analytics. Please try again.' };
  }
};

// Get enrolled students for a course with progress information
export const getCourseStudents = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Get all enrollments for this course with student profiles and progress
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        created_at
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching course students:', error);
      return { success: false, error: `Failed to fetch students: ${error.message}` };
    }

    // Get progress information for each student
    const studentsWithProgress = await Promise.all((data || []).map(async (enrollment, index) => {
      // Get progress percentage from the v_course_progress view
      const { data: progressData } = await supabase
        .from('v_course_progress')
        .select('progress_percent, total_lessons, completed_lessons')
        .eq('user_id', enrollment.user_id)
        .eq('course_id', courseId)
        .single();

      // Get last activity from lesson_progress table
      const { data: activityData } = await supabase
        .from('lesson_progress')
        .select('completed_at')
        .eq('user_id', enrollment.user_id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Anonymize student identity for privacy
      return {
        id: enrollment.user_id,
        enrollment_id: enrollment.id,
        full_name: `Student ${index + 1}`, // Anonymized
        email: '***@***.***', // Hidden for privacy
        enrollment_date: enrollment.created_at,
        progress_percent: progressData?.progress_percent || 0,
        total_lessons: progressData?.total_lessons || 0,
        completed_lessons: progressData?.completed_lessons || 0,
        last_activity: activityData?.completed_at || null
      };
    }));

    return { success: true, data: studentsWithProgress };
  } catch (error) {
    console.error('Error in getCourseStudents:', error);
    return { success: false, error: 'Failed to fetch students. Please try again.' };
  }
};

// Get a single course by ID
export const getCourse = async (courseId: string) => {
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
        instructor_id,
        created_at,
        updated_at,
        prerequisites,
        estimated_duration_hours,
        intro_video_url,
        learning_outcomes,
        target_audience,
        requirements,
        allow_in_bundles,
        bundle_discount_percent,
        enable_qna,
        enable_reviews,
        enable_certificates,
        thumbnail_url
      `)
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      return { success: false, error: `Failed to fetch course: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCourse:', error);
    return { success: false, error: 'Failed to fetch course. Please try again.' };
  }
};

// =========================================================
// SECTION MANAGEMENT
// =========================================================

export const createSection = async (sectionData: {
  course_id: string;
  title: string;
  description?: string;
  order_index?: number;
}) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('course_sections')
      .insert(sectionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating section:', error);
      return { success: false, error: `Failed to create section: ${error.message}` };
    }

    revalidatePath(`/instructor/courses/${sectionData.course_id}/curriculum`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in createSection:', error);
    return { success: false, error: 'Failed to create section. Please try again.' };
  }
};

export const getCourseSections = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('course_sections')
      .select(`
        *,
        lessons (
          id,
          title,
          lesson_type,
          is_preview,
          order_index,
          video_url,
          content_md,
          downloadable
        )
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching sections:', error);
      return { success: false, error: `Failed to fetch sections: ${error.message}` };
    }

    // Sort lessons by order_index within each section
    type LessonType = {
      id: string;
      title: string;
      lesson_type: string;
      is_preview: boolean;
      order_index: number | null;
      video_url: string | null;
      content_md: string | null;
      downloadable: boolean;
    };

    const sortedData = data?.map(section => ({
      ...section,
      lessons: (section.lessons as LessonType[])?.sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      ) || []
    }));

    return { success: true, data: sortedData };
  } catch (error) {
    console.error('Error in getCourseSections:', error);
    return { success: false, error: 'Failed to fetch sections. Please try again.' };
  }
};

export const updateSection = async (sectionId: string, updates: Partial<{
  title: string;
  description: string;
  order_index: number;
}>) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('course_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating section:', error);
      return { success: false, error: `Failed to update section: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateSection:', error);
    return { success: false, error: 'Failed to update section. Please try again.' };
  }
};

export const deleteSection = async (sectionId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('course_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      console.error('Error deleting section:', error);
      return { success: false, error: `Failed to delete section: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteSection:', error);
    return { success: false, error: 'Failed to delete section. Please try again.' };
  }
};

// Reply to a review
export const replyToReview = async (reviewId: string, instructorResponse: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('reviews')
      .update({ 
        instructor_response: instructorResponse, 
        responded_at: new Date().toISOString() 
      })
      .eq('id', reviewId)
      .select(`
        id,
        course_id,
        user_id,
        rating,
        comment,
        status,
        instructor_response,
        responded_at,
        created_at,
        profiles!inner (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error replying to review:', error);
      return { success: false, error: `Failed to reply to review: ${error.message}` };
    }

    // Transform the data to match the expected Review interface
    const transformedData = data ? {
      ...data,
      profiles: data.profiles && data.profiles.length > 0 ? data.profiles[0] : null
    } : null;
    
    return { success: true, data: transformedData as Review };
  } catch (error) {
    console.error('Error in replyToReview:', error);
    return { success: false, error: 'Failed to reply to review. Please try again.' };
  }
};


"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// Student course enrollment actions
export const enrollInCourse = async (userId: string, courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return { success: false, error: 'Already enrolled in this course' };
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        created_at: new Date().toISOString(),
        amount: 0 // Assuming free enrollment for now, adjust as needed
      })
      .select()
      .single();

    if (error) {
      console.error('Error enrolling in course:', error);
      return { success: false, error: `Failed to enroll in course: ${error.message}` };
    }

    revalidatePath('/student-dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error in enrollInCourse:', error);
    return { success: false, error: 'Failed to enroll in course' };
  }
};

export const getStudentEnrolledCourses = async (userId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        created_at,
        amount,
        courses (
          id,
          title,
          description,
          price,
          instructor_id,
          user_profiles (full_name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrolled courses:', error);
      return { success: false, error: `Failed to fetch enrolled courses: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getStudentEnrolledCourses:', error);
    return { success: false, error: 'Failed to fetch enrolled courses' };
  }
};

export const getStudentCertificates = async (userId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        issued_at,
        courses (
          title
        )
      `)
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      return { success: false, error: `Failed to fetch certificates: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getStudentCertificates:', error);
    return { success: false, error: 'Failed to fetch certificates' };
  }
};

export const getStudentProgress = async (userId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('lesson_progress')
      .select(`
        id,
        completed_at,
        lessons (
          title,
          courses (title)
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching learning progress:', error);
      return { success: false, error: `Failed to fetch progress: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getStudentProgress:', error);
    return { success: false, error: 'Failed to fetch progress' };
  }
};

export const updateLessonProgress = async (userId: string, lessonId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson progress:', error);
      return { success: false, error: `Failed to update progress: ${error.message}` };
    }

    revalidatePath('/student-dashboard');
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateLessonProgress:', error);
    return { success: false, error: 'Failed to update progress' };
  }
};
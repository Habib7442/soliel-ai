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
}) => {
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
    
    const { data, error } = await supabase
      .from('courses')
      .insert({
        ...courseData,
        status: 'draft', // Default to draft status
        is_published: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return { success: false, error: `Failed to create course: ${error.message}` };
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
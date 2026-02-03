"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// Get all courses for admin review
export const getAllCoursesForAdmin = async () => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        subtitle,
        thumbnail_url,
        price_cents,
        status,
        is_published,
        created_at,
        updated_at,
        rejection_reason,
        instructor:instructor_id (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return { success: false, error: `Failed to fetch courses: ${error.message}`, data: [] };
    }

    // Transform data to ensure instructor is a single object, not an array
    const transformedData = data?.map(course => ({
      ...course,
      instructor: Array.isArray(course.instructor) ? course.instructor[0] : course.instructor
    })) || [];

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error in getAllCoursesForAdmin:', error);
    return { success: false, error: 'Failed to fetch courses', data: [] };
  }
};

// Approve course (publish it)
export const approveCourse = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('courses')
      .update({ 
        status: 'published',
        is_published: true
      })
      .eq('id', courseId)
      .select();

    if (error) {
      console.error('Error approving course:', error);
      return { success: false, error: `Failed to approve course: ${error.message}` };
    }

    // Return the first item if data exists
    const courseData = data && data.length > 0 ? data[0] : null;

    revalidatePath('/admin-courses');
    revalidatePath('/courses');
    return { success: true, data: courseData };
  } catch (error) {
    console.error('Error in approveCourse:', error);
    return { success: false, error: 'Failed to approve course. Please try again.' };
  }
};

// Reject course
export const rejectCourse = async (courseId: string, reason?: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('courses')
      .update({ 
        status: 'rejected',
        is_published: false,
        rejection_reason: reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select();

    if (error) {
      console.error('Error rejecting course:', error);
      return { success: false, error: `Failed to reject course: ${error.message}` };
    }

    // Return the first item if data exists
    const courseData = data && data.length > 0 ? data[0] : null;

    // TODO: Send notification to instructor with rejection reason

    revalidatePath('/admin-courses');
    return { success: true, data: courseData };
  } catch (error) {
    console.error('Error in rejectCourse:', error);
    return { success: false, error: 'Failed to reject course. Please try again.' };
  }
};

// Unpublish/Archive course
export const unpublishCourse = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Verify admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return { success: false, error: 'Unauthorized - Super Admin access required' };
    }
    
    // First verify the course exists
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('id, title, is_published, status')
      .eq('id', courseId)
      .single();

    if (fetchError || !existingCourse) {
      console.error('Course not found:', fetchError);
      return { success: false, error: 'Course not found' };
    }

    
    // Update the course - using direct update
    const { error, count } = await supabase
      .from('courses')
      .update({ 
        is_published: false,
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId);

    if (error) {
      console.error('Error unpublishing course:', error);
      return { success: false, error: `Failed to unpublish course: ${error.message}` };
    }


    // Fetch the updated course data
    const { data: updatedCourse } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();


    revalidatePath('/admin-courses');
    revalidatePath('/courses');
    return { success: true, data: updatedCourse };
  } catch (error) {
    console.error('Error in unpublishCourse:', error);
    return { success: false, error: 'Failed to unpublish course. Please try again.' };
  }
};

// Delete course (admin only)
export const deleteCourseAsAdmin = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Check if course has enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .limit(1);

    if (enrollmentError) {
      console.error('Error checking enrollments:', enrollmentError);
      return { success: false, error: 'Failed to check course enrollments' };
    }

    if (enrollments && enrollments.length > 0) {
      return { success: false, error: 'Cannot delete course with active enrollments. Please archive it instead.' };
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      return { success: false, error: `Failed to delete course: ${error.message}` };
    }

    revalidatePath('/admin-courses');
    revalidatePath('/courses');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteCourseAsAdmin:', error);
    return { success: false, error: 'Failed to delete course. Please try again.' };
  }
};

// Get course statistics
export const getCourseStatistics = async () => {
  try {
    const supabase = await createServerClient();
    
    // Get all courses with enrollment counts
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        id,
        status,
        is_published
      `);

    if (error) {
      console.error('Error fetching course statistics:', error);
      return { 
        success: false, 
        error: 'Failed to fetch statistics',
        data: {
          total: 0,
          published: 0,
          pending: 0,
          rejected: 0,
          archived: 0
        }
      };
    }

    const stats = {
      total: courses?.length || 0,
      published: courses?.filter(c => c.status === 'published').length || 0,
      pending: courses?.filter(c => c.status === 'pending').length || 0,
      rejected: courses?.filter(c => c.status === 'rejected').length || 0,
      archived: courses?.filter(c => c.status === 'archived').length || 0
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getCourseStatistics:', error);
    return { 
      success: false, 
      error: 'Failed to fetch statistics',
      data: {
        total: 0,
        published: 0,
        pending: 0,
        rejected: 0,
        archived: 0
      }
    };
  }
};

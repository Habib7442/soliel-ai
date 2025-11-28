"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { checkAndGenerateCertificate } from "./certificate.actions";

interface CreateEnrollmentParams {
  userId: string;
  courseId: string;
  purchaseType: 'single_course' | 'bundle' | 'corporate';
  paymentProvider: 'stripe' | 'paypal' | 'free';
  amountCents: number;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
}

/**
 * Create an enrollment after successful payment (or free enrollment)
 * This mimics the exact flow Stripe would trigger
 */
export const createEnrollment = async (params: CreateEnrollmentParams) => {
  try {
    const supabase = await createServerClient();
    const {
      userId,
      courseId,
      purchaseType,
      paymentProvider,
      amountCents,
      stripePaymentIntentId,
      receiptUrl,
    } = params;
    
    // Validate required fields
    if (!userId || !courseId) {
      return { success: false, error: "User ID and Course ID are required" };
    }
    
    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (existingEnrollment) {
      return { success: false, error: "Already enrolled in this course" };
    }
    
    // Step 1: Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        purchase_type: purchaseType,
        subtotal_cents: amountCents,
        discount_cents: 0,
        tax_cents: 0,
        total_cents: amountCents,
        currency: 'USD',
        status: paymentProvider === 'free' ? 'completed' : 'pending',
      })
      .select()
      .single();
    
    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return { success: false, error: `Failed to create order: ${orderError?.message}` };
    }
    
    // Step 2: Create Order Item
    const { error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        course_id: courseId,
        quantity: 1,
        unit_price_cents: amountCents,
      });
    
    if (orderItemError) {
      console.error('Error creating order item:', orderItemError);
      return { success: false, error: `Failed to create order item: ${orderItemError.message}` };
    }
    
    // Step 3: Create Payment Record (simulating Stripe webhook)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        provider: paymentProvider,
        provider_payment_id: stripePaymentIntentId || null,
        status: paymentProvider === 'free' ? 'succeeded' : 'succeeded', // Always succeeded in this demo
        amount_cents: amountCents,
        currency: 'USD',
        receipt_url: receiptUrl || null,
        metadata: {
          course_id: courseId,
          user_id: userId,
          demo_mode: true,
        },
      })
      .select()
      .single();
    
    if (paymentError || !payment) {
      console.error('Error creating payment:', paymentError);
      return { success: false, error: `Failed to create payment: ${paymentError?.message}` };
    }
    
    // Step 4: Update Order Status
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', order.id);
    
    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError);
    }
    
    // Step 5: Create Enrollment (this is what Stripe webhook would do)
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        purchased_as: purchaseType,
        order_id: order.id,
        status: 'active',
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (enrollmentError || !enrollment) {
      console.error('Error creating enrollment:', enrollmentError);
      return { success: false, error: `Failed to create enrollment: ${enrollmentError?.message}` };
    }
    
    // Step 6: Update course stats
    const { error: statsError } = await supabase.rpc('increment_course_enrollments', {
      p_course_id: courseId,
    });
    
    if (statsError) {
      console.error('Error updating course stats:', statsError);
      // Don't fail enrollment if stats update fails
    }
    
    // Revalidate paths
    revalidatePath('/student-dashboard');
    revalidatePath(`/learn/${courseId}/player`);
    revalidatePath(`/courses/${courseId}`);
    
    return { 
      success: true, 
      data: {
        enrollment,
        order,
        payment,
      }
    };
  } catch (error) {
    console.error('Error in createEnrollment:', error);
    return { success: false, error: 'Failed to create enrollment. Please try again.' };
  }
};

/**
 * Get student enrolled courses with progress
 */
export const getStudentEnrolledCourses = async (userId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        created_at,
        courses (
          id,
          title,
          subtitle,
          description,
          thumbnail_url,
          level,
          estimated_duration_hours,
          instructor_id,
          profiles:instructor_id (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching enrolled courses:', error);
      return { success: false, error: `Failed to fetch enrolled courses: ${error.message}` };
    }
    
    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      (data || []).map(async (enrollment) => {
        // Extract course ID - Supabase returns single object in array format
        const courses = enrollment.courses as { id: string } | { id: string }[] | null | undefined;
        const courseId = Array.isArray(courses) && courses.length > 0
          ? courses[0].id
          : (courses as { id: string } | null)?.id;
        
        if (!courseId) {
          return {
            ...enrollment,
            progress: { progress_percent: 0, total_lessons: 0, completed_lessons: 0 },
          };
        }
        
        const { data: progressData } = await supabase
          .from('v_course_progress')
          .select('progress_percent, total_lessons, completed_lessons')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single();
        
        return {
          ...enrollment,
          progress: progressData || { progress_percent: 0, total_lessons: 0, completed_lessons: 0 },
        };
      })
    );
    
    return { success: true, data: coursesWithProgress };
  } catch (error) {
    console.error('Error in getStudentEnrolledCourses:', error);
    return { success: false, error: 'Failed to fetch enrolled courses' };
  }
};

/**
 * Mark lesson as complete and update progress
 */
export const markLessonComplete = async (userId: string, lessonId: string, courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Check if user is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (!enrollment) {
      return { success: false, error: 'Not enrolled in this course' };
    }
    
    // Mark lesson as complete
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error marking lesson complete:', error);
      return { success: false, error: `Failed to mark lesson complete: ${error.message}` };
    }
    
    // Check if course is now 100% complete
    const { data: progressData } = await supabase
      .from('v_course_progress')
      .select('progress_percent')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (progressData && progressData.progress_percent === 100) {
      // Update enrollment status to completed
      await supabase
        .from('enrollments')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('course_id', courseId);
      
      // Auto-generate certificate using proper certificate generation
      const certResult = await checkAndGenerateCertificate(userId, courseId);
      
      if (!certResult.success) {
        console.log('Certificate generation note:', certResult.error);
      }
    }
    
    revalidatePath('/student-dashboard');
    revalidatePath(`/learn/${courseId}/player`);
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in markLessonComplete:', error);
    return { success: false, error: 'Failed to mark lesson complete' };
  }
};

/**
 * Get course lessons with progress for enrolled student
 */
export const getCourseWithProgress = async (userId: string, courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Check enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (!enrollment) {
      return { success: false, error: 'Not enrolled in this course' };
    }
    
    // Get course with sections and lessons
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        subtitle,
        description,
        thumbnail_url,
        instructor_id,
        profiles:instructor_id (
          full_name,
          avatar_url
        )
      `)
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      return { success: false, error: 'Course not found' };
    }
    
    // Get sections
    const { data: sections, error: sectionsError } = await supabase
      .from('course_sections')
      .select('id, title, description, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (sectionsError) {
      return { success: false, error: 'Failed to load course sections' };
    }
    
    // Get all lessons for this course separately
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, lesson_type, video_url, content_md, duration_minutes, order_index, is_preview, section_id')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (lessonsError) {
      return { success: false, error: 'Failed to load course lessons' };
    }
    
    // Filter to only include lessons with actual content (video URL or content markdown)
    const lessonsWithContent = (allLessons || []).filter(lesson => {
      const hasVideo = lesson.video_url && lesson.video_url.trim() !== '';
      const hasContent = lesson.content_md && lesson.content_md.trim() !== '';
      return hasVideo || hasContent;
    });
    
    // Group lessons by section_id
    interface LessonData {
      id: string;
      title: string;
      lesson_type: string;
      video_url: string | null;
      content_md: string | null;
      duration_minutes: number | null;
      order_index: number;
      is_preview: boolean;
      section_id: string;
    }
    
    const lessonsBySection = new Map<string, LessonData[]>();
    lessonsWithContent.forEach(lesson => {
      if (lesson.section_id) {
        if (!lessonsBySection.has(lesson.section_id)) {
          lessonsBySection.set(lesson.section_id, []);
        }
        lessonsBySection.get(lesson.section_id)!.push(lesson);
      }
    });
    
    // Combine sections with their lessons
    const sectionsWithLessons = (sections || []).map(section => ({
      ...section,
      lessons: lessonsBySection.get(section.id) || [],
    }));
    
    // Get lesson progress
    const { data: lessonProgress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, completed_at')
      .eq('user_id', userId);
    
    const progressMap = new Map(
      (lessonProgress || []).map(lp => [lp.lesson_id, lp])
    );
    
    // Enhance sections with progress and filter out empty sections
    const sectionsWithProgress = sectionsWithLessons
      .map(section => ({
        ...section,
        lessons: section.lessons.map((lesson: LessonData) => ({
          ...lesson,
          progress: progressMap.get(lesson.id) || { completed: false },
        })).sort((a: LessonData & { progress: unknown }, b: LessonData & { progress: unknown }) => a.order_index - b.order_index),
      }))
      .filter(section => section.lessons.length > 0); // Only include sections with lessons
    
    // Get overall progress
    const { data: overallProgress } = await supabase
      .from('v_course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    return {
      success: true,
      data: {
        course,
        sections: sectionsWithProgress,
        progress: overallProgress || { progress_percent: 0, total_lessons: 0, completed_lessons: 0 },
        enrollment,
      },
    };
  } catch (error) {
    console.error('Error in getCourseWithProgress:', error);
    return { success: false, error: 'Failed to load course data' };
  }
};

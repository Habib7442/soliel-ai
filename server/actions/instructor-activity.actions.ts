"use server";

import { createServerClient } from "@/lib/supabase-server";

// ==========================================
// UNIFIED INSTRUCTOR ACTIVITY ACTIONS
// ==========================================

// 1. Get ALL reviews for an instructor across all courses
export const getInstructorReviews = async (instructorId: string, limit = 20) => {
  try {
    const supabase = await createServerClient();
    
    // First, get all course IDs for this instructor
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('instructor_id', instructorId);
      
    if (courseError) throw courseError;
    if (!courses || courses.length === 0) return { success: true, data: [] };
    
    const courseIds = courses.map(c => c.id);
    
    // Now fetch reviews for these courses
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        course_id,
        user_id,
        rating,
        comment,
        created_at,
        instructor_response,
        responded_at,
        profiles!inner (
          full_name,
          avatar_url
        ),
        courses!inner (
          title
        )
      `)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reviewsError) throw reviewsError;
    
    // Map to flatten structure if needed
    const formattedReviews = reviews.map((r: any) => ({
      ...r,
      user: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
      course_title: Array.isArray(r.courses) ? r.courses[0].title : r.courses.title
    }));

    return { success: true, data: formattedReviews };
  } catch (error: any) {
    console.error('Error fetching instructor reviews:', error);
    return { success: false, error: error.message };
  }
};

// 2. Get ALL Q&A threads for an instructor across all courses
export const getInstructorQnaThreads = async (instructorId: string, filter: 'all' | 'unresolved' = 'all', limit = 20) => {
  try {
    const supabase = await createServerClient();
    
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', instructorId);
      
    if (courseError) throw courseError;
    if (!courses || courses.length === 0) return { success: true, data: [] };
    
    const courseIds = courses.map(c => c.id);
    
    let query = supabase
      .from('qna_threads')
      .select(`
        id,
        course_id,
        title,
        created_at,
        is_resolved,
        profiles!inner (
          full_name,
          avatar_url
        ),
        courses!inner (
          title
        )
      `)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (filter === 'unresolved') {
      query = query.eq('is_resolved', false);
    }

    const { data: threads, error: threadsError } = await query;

    if (threadsError) throw threadsError;

    const formattedThreads = threads.map((t: any) => ({
      ...t,
      user: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles,
      course_title: Array.isArray(t.courses) ? t.courses[0].title : t.courses.title
    }));

    return { success: true, data: formattedThreads };
  } catch (error: any) {
    console.error('Error fetching instructor Q&A:', error);
    return { success: false, error: error.message };
  }
};

// 3. Get ALL pending assignment submissions
export const getPendingAssignments = async (instructorId: string, limit = 20) => {
  try {
    const supabase = await createServerClient();
    
    // This is more complex because we need to go Course -> Lesson -> Assignment -> Submission
    // But we can simplify by selecting submissions where assignment.lesson.course.instructor_id = instructorId
    // Supabase nested filtering can handle this!
    
    const { data: submissions, error } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        submitted_at,
        grade,
        assignment_id,
        profiles!assignment_submissions_student_id_fkey (
          full_name,
          avatar_url
        ),
        assignments!inner (
          title,
          lessons!inner (
            title,
            courses!inner (
              id,
              title,
              instructor_id
            )
          )
        )
      `)
      .eq('assignments.lessons.courses.instructor_id', instructorId)
      .is('grade', null) // Only ungraded
      .order('submitted_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const formattedSubmissions = submissions.map((s: any) => ({
      id: s.id,
      submitted_at: s.submitted_at,
      student: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles,
      assignment_title: s.assignments?.title,
      course_title: s.assignments?.lessons?.courses?.title,
      course_id: s.assignments?.lessons?.courses?.id
    }));

    return { success: true, data: formattedSubmissions };
  } catch (error: any) {
    console.error('Error fetching pending assignments:', error);
    return { success: false, error: error.message };
  }
};

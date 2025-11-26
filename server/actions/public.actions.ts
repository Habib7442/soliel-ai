"use server";

import { createServerClient } from "@/lib/supabase-server";

export interface PublicCourse {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  level: string | null;
  language: string | null;
  thumbnail_url: string | null;
  price_cents: number;
  currency: string;
  estimated_duration_hours: number | null;
  is_published: boolean;
  allow_in_bundles: boolean;
  bundle_discount_percent: number | null;
  intro_video_url: string | null;
  learning_outcomes: string[] | null;
  prerequisites: string | null;
  instructor: {
    full_name: string | null;
    avatar_url: string | null;
    bio_md: string | null;
  };
  stats: {
    total_enrollments: number;
    average_rating: number;
    total_reviews: number;
  };
  category: string | null;
  lessons_count: number;
  sections?: Array<{
    id: string;
    title: string;
    description: string | null;
    order_index: number;
    lessons: Array<{
      id: string;
      title: string;
      lesson_type: string;
      is_preview: boolean;
      duration_minutes?: number;
      order_index: number;
      video_url?: string | null;
    }>;
  }>;
}

export interface CourseFilters {
  category?: string;
  level?: string;
  priceMin?: number;
  priceMax?: number;
  bundlesOnly?: boolean;
  search?: string;
}

/**
 * Fetch all published courses with stats, instructor info, and category
 */
export const getPublicCourses = async (filters?: CourseFilters, limit?: number) => {
  try {
    const supabase = await createServerClient();
    
    // Build the query
    let query = supabase
      .from('courses')
      .select(`
        id,
        title,
        subtitle,
        description,
        level,
        language,
        thumbnail_url,
        intro_video_url,
        price_cents,
        currency,
        estimated_duration_hours,
        is_published,
        allow_in_bundles,
        bundle_discount_percent,
        learning_outcomes,
        prerequisites,
        profiles:instructor_id (
          full_name,
          avatar_url
        ),
        course_stats (
          total_enrollments,
          average_rating,
          total_reviews
        )
      `)
      .eq('is_published', true)
      .eq('status', 'published');

    // Apply filters
    if (filters?.category && filters.category !== 'All') {
      // Get category ID first
      const { data: categoryData } = await supabase
        .from('course_categories')
        .select('id')
        .eq('name', filters.category)
        .single();
      
      if (categoryData) {
        const { data: coursesInCategory } = await supabase
          .from('course_category_map')
          .select('course_id')
          .eq('category_id', categoryData.id);
        
        if (coursesInCategory) {
          const courseIds = coursesInCategory.map(c => c.course_id);
          query = query.in('id', courseIds);
        }
      }
    }

    if (filters?.level && filters.level !== 'All') {
      query = query.eq('level', filters.level.toLowerCase());
    }

    if (filters?.priceMin !== undefined) {
      query = query.gte('price_cents', filters.priceMin * 100);
    }

    if (filters?.priceMax !== undefined) {
      query = query.lte('price_cents', filters.priceMax * 100);
    }

    if (filters?.bundlesOnly) {
      query = query.eq('allow_in_bundles', true);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit);
    }

    // Order by most recent
    query = query.order('created_at', { ascending: false });

    const { data: courses, error } = await query;

    if (error) {
      console.error('Error fetching public courses:', error);
      return { success: false, error: `Failed to fetch courses: ${error.message}`, data: [] };
    }

    if (!courses) {
      return { success: true, data: [] };
    }

    // Get categories and lessons count for each course
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        // Get category name
        const { data: categoryMap } = await supabase
          .from('course_category_map')
          .select('category_id')
          .eq('course_id', course.id)
          .limit(1)
          .single();

        let categoryName = null;
        if (categoryMap) {
          const { data: category } = await supabase
            .from('course_categories')
            .select('name')
            .eq('id', categoryMap.category_id)
            .single();
          categoryName = category?.name || null;
        }

        // Get lessons count
        const { count: lessonsCount } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', course.id);

        return {
          ...course,
          instructor: {
            ...(Array.isArray(course.profiles) ? course.profiles[0] : course.profiles),
            bio_md: null
          },
          stats: (() => {
            // Handle course_stats - could be array, object, or null
            if (Array.isArray(course.course_stats)) {
              return course.course_stats.length > 0
                ? course.course_stats[0]
                : { total_enrollments: 0, average_rating: 0, total_reviews: 0 };
            } else if (course.course_stats && typeof course.course_stats === 'object') {
              return course.course_stats;
            }
            return { total_enrollments: 0, average_rating: 0, total_reviews: 0 };
          })(),
          category: categoryName,
          lessons_count: lessonsCount || 0,
        };
      })
    );

    return { success: true, data: coursesWithDetails as PublicCourse[] };
  } catch (error) {
    console.error('Error in getPublicCourses:', error);
    return { success: false, error: 'Failed to fetch courses. Please try again.', data: [] };
  }
};

/**
 * Get a single course with all details for the course details page
 */
export const getPublicCourse = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    // Fetch course with instructor profile and stats (no auth required for public courses)
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        subtitle,
        description,
        level,
        language,
        thumbnail_url,
        intro_video_url,
        price_cents,
        currency,
        estimated_duration_hours,
        is_published,
        allow_in_bundles,
        bundle_discount_percent,
        learning_outcomes,
        prerequisites,
        profiles:instructor_id (
          full_name,
          avatar_url
        ),
        course_stats (
          total_enrollments,
          average_rating,
          total_reviews
        )
      `)
      .eq('id', courseId)
      .eq('is_published', true)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      return { success: false, error: `Failed to fetch course: ${error.message}` };
    }

    if (!course) {
      return { success: false, error: 'Course not found' };
    }

    // Get category name
    const { data: categoryMap } = await supabase
      .from('course_category_map')
      .select('category_id')
      .eq('course_id', course.id)
      .limit(1)
      .single();

    let categoryName = null;
    if (categoryMap) {
      const { data: category } = await supabase
        .from('course_categories')
        .select('name')
        .eq('id', categoryMap.category_id)
        .single();
      categoryName = category?.name || null;
    }

    // Get lessons count
    const { count: lessonsCount } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course.id);

    // Get course sections with lessons
    const { data: sections, error: sectionsError } = await supabase
      .from('course_sections')
      .select(`
        id,
        title,
        description,
        order_index,
        lessons (
          id,
          title,
          lesson_type,
          is_preview,
          duration_minutes,
          order_index,
          video_url
        )
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
    }

    // Get instructor bio from instructor_profiles table
    let instructorBio = null;
    if (course.profiles) {
      const instructorProfile = Array.isArray(course.profiles) ? course.profiles[0] : course.profiles;
      if (instructorProfile) {
        // Fetch the full course data to get instructor_id
        const { data: courseData } = await supabase
          .from('courses')
          .select('instructor_id')
          .eq('id', courseId)
          .single();
        
        if (courseData?.instructor_id) {
          const { data: instructorData } = await supabase
            .from('instructor_profiles')
            .select('bio_md')
            .eq('user_id', courseData.instructor_id)
            .single();
          
          if (instructorData) {
            instructorBio = instructorData.bio_md;
          }
        }
      }
    }

    const courseWithDetails = {
      ...course,
      instructor: {
        ...(Array.isArray(course.profiles) ? course.profiles[0] : course.profiles),
        bio_md: instructorBio
      },
      stats: (() => {
        // Handle course_stats - could be array, object, or null
        if (Array.isArray(course.course_stats)) {
          return course.course_stats.length > 0
            ? course.course_stats[0]
            : { total_enrollments: 0, average_rating: 0, total_reviews: 0 };
        } else if (course.course_stats && typeof course.course_stats === 'object') {
          return course.course_stats;
        }
        return { total_enrollments: 0, average_rating: 0, total_reviews: 0 };
      })(),
      category: categoryName,
      lessons_count: lessonsCount || 0,
      sections: sections || [],
    };

    return { success: true, data: courseWithDetails as PublicCourse };
  } catch (error) {
    console.error('Error in getPublicCourse:', error);
    return { success: false, error: 'Failed to fetch course. Please try again.' };
  }
};

/**
 * Get all unique course categories
 */
export const getCourseCategories = async () => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('course_categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return { success: false, error: `Failed to fetch categories: ${error.message}`, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getCourseCategories:', error);
    return { success: false, error: 'Failed to fetch categories. Please try again.', data: [] };
  }
};

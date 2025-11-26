"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface CreateReviewParams {
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewParams {
  reviewId: string;
  rating?: number;
  comment?: string;
}

export interface InstructorReplyParams {
  reviewId: string;
  instructorId: string;
  reply: string;
}

// Create a review
export const createReview = async (params: CreateReviewParams) => {
  try {
    const supabase = await createServerClient();
    
    // Check if user is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', params.userId)
      .eq('course_id', params.courseId)
      .single();

    if (!enrollment) {
      return { success: false, error: 'You must be enrolled in this course to leave a review' };
    }

    // Check if user already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', params.userId)
      .eq('course_id', params.courseId)
      .single();

    if (existingReview) {
      return { success: false, error: 'You have already reviewed this course' };
    }

    // Create review
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        course_id: params.courseId,
        user_id: params.userId,
        rating: params.rating,
        comment: params.comment,
        status: 'visible', // Changed from 'approved' to 'visible'
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return { success: false, error: `Failed to create review: ${error.message}` };
    }

    // Update course stats
    await updateCourseStats(params.courseId);

    revalidatePath(`/courses/${params.courseId}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in createReview:', error);
    return { success: false, error: 'Failed to create review' };
  }
};

// Get course reviews
export const getCourseReviews = async (courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        status,
        instructor_reply,
        replied_at,
        created_at,
        updated_at,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('course_id', courseId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return { success: false, error: `Failed to fetch reviews: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCourseReviews:', error);
    return { success: false, error: 'Failed to fetch reviews' };
  }
};

// Update a review (student only)
export const updateReview = async (params: UpdateReviewParams) => {
  try {
    const supabase = await createServerClient();
    
    const updateData: {
      updated_at: string;
      rating?: number;
      comment?: string;
    } = {
      updated_at: new Date().toISOString()
    };

    if (params.rating !== undefined) {
      updateData.rating = params.rating;
    }
    
    if (params.comment !== undefined) {
      updateData.comment = params.comment;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', params.reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return { success: false, error: `Failed to update review: ${error.message}` };
    }

    // Update course stats
    if (params.rating !== undefined) {
      await updateCourseStats(data.course_id);
    }

    revalidatePath(`/courses/${data.course_id}`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateReview:', error);
    return { success: false, error: 'Failed to update review' };
  }
};

// Instructor reply to review
export const replyToReview = async (params: InstructorReplyParams) => {
  try {
    const supabase = await createServerClient();
    
    // Verify instructor owns the course
    const { data: review } = await supabase
      .from('reviews')
      .select('course_id')
      .eq('id', params.reviewId)
      .single();

    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', review.course_id)
      .single();

    if (!course || course.instructor_id !== params.instructorId) {
      return { success: false, error: 'You are not authorized to reply to this review' };
    }

    // Add reply
    const { data, error } = await supabase
      .from('reviews')
      .update({
        instructor_reply: params.reply,
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.reviewId)
      .select()
      .single();

    if (error) {
      console.error('Error replying to review:', error);
      return { success: false, error: `Failed to reply: ${error.message}` };
    }

    revalidatePath(`/courses/${review.course_id}`);
    revalidatePath(`/instructor/courses/${review.course_id}/reviews`);
    return { success: true, data };
  } catch (error) {
    console.error('Error in replyToReview:', error);
    return { success: false, error: 'Failed to reply to review' };
  }
};

// Delete review (admin only)
export const deleteReview = async (reviewId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data: review } = await supabase
      .from('reviews')
      .select('course_id')
      .eq('id', reviewId)
      .single();

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Error deleting review:', error);
      return { success: false, error: `Failed to delete review: ${error.message}` };
    }

    if (review) {
      await updateCourseStats(review.course_id);
      revalidatePath(`/courses/${review.course_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteReview:', error);
    return { success: false, error: 'Failed to delete review' };
  }
};

// Helper function to update course stats
async function updateCourseStats(courseId: string) {
  try {
    const supabase = await createServerClient();
    
    // Calculate average rating and total reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('course_id', courseId)
      .eq('status', 'visible');

    if (!reviews || reviews.length === 0) {
      // No reviews, set to null
      await supabase
        .from('course_stats')
        .upsert({
          course_id: courseId,
          average_rating: null,
          total_reviews: 0,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'course_id'
        });
      return;
    }

    const totalReviews = reviews.length;
    const sumRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = sumRatings / totalReviews;

    // Update course_stats
    await supabase
      .from('course_stats')
      .upsert({
        course_id: courseId,
        average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        total_reviews: totalReviews,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'course_id'
      });

  } catch (error) {
    console.error('Error updating course stats:', error);
  }
}

// Get user's review for a course
export const getUserReview = async (userId: string, courseId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching user review:', error);
      return { success: false, error: `Failed to fetch review: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getUserReview:', error);
    return { success: false, error: 'Failed to fetch review' };
  }
};

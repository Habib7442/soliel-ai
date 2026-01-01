"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { CourseFAQ } from "@/types/db";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================
// PUBLIC ACTIONS (No auth required)
// ============================================

/**
 * Get active FAQs for a specific course
 */
export async function getCourseFAQs(
  courseId: string
): Promise<ActionResult<CourseFAQ[]>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("course_faqs")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as CourseFAQ[] };
  } catch (error) {
    console.error("Error fetching course FAQs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch course FAQs",
    };
  }
}

/**
 * Search course FAQs by query
 */
export async function searchCourseFAQs(
  courseId: string,
  query: string
): Promise<ActionResult<CourseFAQ[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("course_faqs")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_active", true)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "english",
      })
      .order("order_index", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as CourseFAQ[] };
  } catch (error) {
    console.error("Error searching course FAQs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search course FAQs",
    };
  }
}

// ============================================
// INSTRUCTOR/ADMIN ACTIONS
// ============================================

/**
 * Check if user can manage course FAQs (instructor or admin)
 */
async function canManageCourseFAQs(courseId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Super admin can manage all
    if (profile?.role === "super_admin") return true;

    // Check if instructor owns the course
    if (profile?.role === "instructor") {
      const { data: course } = await supabase
        .from("courses")
        .select("instructor_id")
        .eq("id", courseId)
        .single();

      return course?.instructor_id === user.id;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get all FAQs for a course (including inactive) - instructor/admin only
 */
export async function getAllCourseFAQs(
  courseId: string
): Promise<ActionResult<CourseFAQ[]>> {
  if (!(await canManageCourseFAQs(courseId))) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("course_faqs")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as CourseFAQ[] };
  } catch (error) {
    console.error("Error fetching all course FAQs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch course FAQs",
    };
  }
}

/**
 * Create a new course FAQ
 */
export async function createCourseFAQ(input: {
  course_id: string;
  question: string;
  answer_md: string;
  category?: string;
  order_index?: number;
  is_active?: boolean;
}): Promise<ActionResult<CourseFAQ>> {
  if (!(await canManageCourseFAQs(input.course_id))) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("course_faqs")
      .insert({
        course_id: input.course_id,
        question: input.question,
        answer_md: input.answer_md,
        category: input.category || null,
        order_index: input.order_index ?? 0,
        is_active: input.is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/courses/${input.course_id}`);
    revalidatePath(`/learn/${input.course_id}`);

    return { success: true, data: data as CourseFAQ };
  } catch (error) {
    console.error("Error creating course FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create course FAQ",
    };
  }
}

/**
 * Update a course FAQ
 */
export async function updateCourseFAQ(
  id: string,
  courseId: string,
  input: {
    question?: string;
    answer_md?: string;
    category?: string;
    order_index?: number;
    is_active?: boolean;
  }
): Promise<ActionResult<CourseFAQ>> {
  if (!(await canManageCourseFAQs(courseId))) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("course_faqs")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/learn/${courseId}`);

    return { success: true, data: data as CourseFAQ };
  } catch (error) {
    console.error("Error updating course FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update course FAQ",
    };
  }
}

/**
 * Delete a course FAQ
 */
export async function deleteCourseFAQ(
  id: string,
  courseId: string
): Promise<ActionResult> {
  if (!(await canManageCourseFAQs(courseId))) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createServerClient();

    const { error } = await supabase.from("course_faqs").delete().eq("id", id);

    if (error) throw error;

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/learn/${courseId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting course FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete course FAQ",
    };
  }
}

/**
 * Toggle course FAQ active status
 */
export async function toggleCourseFAQStatus(
  id: string,
  courseId: string,
  is_active: boolean
): Promise<ActionResult<CourseFAQ>> {
  if (!(await canManageCourseFAQs(courseId))) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("course_faqs")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/learn/${courseId}`);

    return { success: true, data: data as CourseFAQ };
  } catch (error) {
    console.error("Error toggling course FAQ status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle course FAQ status",
    };
  }
}

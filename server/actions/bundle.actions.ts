"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// Types for bundles
export interface Bundle {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  price_cents: number;
  currency: string;
  discount_percent: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BundleWithCourses extends Bundle {
  bundle_courses: Array<{
    course_id: string;
    order_index: number;
    courses: {
      id: string;
      title: string;
      subtitle: string | null;
      thumbnail_url: string | null;
      price_cents: number;
      currency: string;
      level: string;
      instructor_id: string;
      profiles?: {
        full_name: string | null;
      };
    };
  }>;
}

/**
 * Get all active bundles with their courses
 */
export async function getAllBundles() {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("bundles")
      .select(
        `
        *,
        bundle_courses(
          course_id,
          order_index,
          courses(
            id,
            title,
            subtitle,
            thumbnail_url,
            price_cents,
            currency,
            level,
            instructor_id,
            profiles(full_name)
          )
        )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bundles:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as BundleWithCourses[] };
  } catch (error) {
    console.error("Unexpected error fetching bundles:", error);
    return { success: false, error: "Failed to fetch bundles" };
  }
}

/**
 * Get bundle by ID with courses
 */
export async function getBundleById(bundleId: string) {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("bundles")
      .select(
        `
        *,
        bundle_courses(
          course_id,
          order_index,
          courses(
            id,
            title,
            subtitle,
            description,
            thumbnail_url,
            intro_video_url,
            price_cents,
            currency,
            level,
            instructor_id,
            estimated_duration_hours,
            learning_outcomes,
            profiles(full_name, avatar_url)
          )
        )
      `
      )
      .eq("id", bundleId)
      .single();

    if (error) {
      console.error("Error fetching bundle:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as BundleWithCourses };
  } catch (error) {
    console.error("Unexpected error fetching bundle:", error);
    return { success: false, error: "Failed to fetch bundle" };
  }
}

/**
 * Calculate bundle pricing with discount logic
 * - Buy 2 courses: 10% off
 * - Buy 3+ courses: 20% off
 */
export async function calculateBundlePrice(coursePrices: number[]): Promise<{
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}> {
  const courseCount = coursePrices.length;
  const originalPrice = coursePrices.reduce((sum, price) => sum + price, 0);

  let discountPercent = 0;
  if (courseCount >= 3) {
    discountPercent = 20;
  } else if (courseCount >= 2) {
    discountPercent = 10;
  }

  const discountAmount = Math.round((originalPrice * discountPercent) / 100);
  const finalPrice = originalPrice - discountAmount;

  return {
    originalPrice,
    discountPercent,
    discountAmount,
    finalPrice,
  };
}

/**
 * Create a new bundle (Admin/Instructor only)
 */
export async function createBundle(
  name: string,
  description: string,
  courseIds: string[],
  coverUrl?: string,
  customDiscount?: number
) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user is admin or instructor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "instructor"].includes(profile.role)) {
      return { success: false, error: "Only admins and instructors can create bundles" };
    }

    // Fetch course prices to calculate bundle price
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, price_cents")
      .in("id", courseIds);

    if (coursesError || !courses || courses.length === 0) {
      return { success: false, error: "Invalid course selection" };
    }

    // Calculate bundle pricing
    const pricing = await calculateBundlePrice(courses.map((c) => c.price_cents));
    
    // Use custom discount if provided, otherwise use automatic discount
    const finalDiscount = customDiscount !== undefined ? customDiscount : pricing.discountPercent;
    const originalPrice = pricing.originalPrice;
    const discountAmount = Math.round((originalPrice * finalDiscount) / 100);
    const finalPrice = originalPrice - discountAmount;

    // Create bundle
    const { data: bundle, error: bundleError } = await supabase
      .from("bundles")
      .insert({
        name,
        description,
        cover_url: coverUrl,
        price_cents: finalPrice,
        discount_percent: finalDiscount,
        created_by: user.id,
      })
      .select()
      .single();

    if (bundleError) {
      console.error("Error creating bundle:", bundleError);
      return { success: false, error: bundleError.message };
    }

    // Add courses to bundle
    const bundleCourses = courseIds.map((courseId, index) => ({
      bundle_id: bundle.id,
      course_id: courseId,
      order_index: index,
    }));

    const { error: linkError } = await supabase
      .from("bundle_courses")
      .insert(bundleCourses);

    if (linkError) {
      console.error("Error linking courses to bundle:", linkError);
      // Rollback: delete the bundle
      await supabase.from("bundles").delete().eq("id", bundle.id);
      return { success: false, error: "Failed to link courses" };
    }

    revalidatePath("/bundles");
    revalidatePath("/admin-bundles");

    return { success: true, data: bundle };
  } catch (error) {
    console.error("Unexpected error creating bundle:", error);
    return { success: false, error: "Failed to create bundle" };
  }
}

/**
 * Update bundle
 */
export async function updateBundle(
  bundleId: string,
  updates: {
    name?: string;
    description?: string;
    cover_url?: string;
    is_active?: boolean;
    courseIds?: string[];
    customDiscount?: number;
  }
) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user is admin or instructor
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "instructor"].includes(profile.role)) {
      return { success: false, error: "Only admins and instructors can update bundles" };
    }

    // If courseIds are being updated, recalculate pricing
    if (updates.courseIds && updates.courseIds.length > 0) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, price_cents")
        .in("id", updates.courseIds);

      if (courses && courses.length > 0) {
        const pricing = await calculateBundlePrice(courses.map((c) => c.price_cents));

        // Use custom discount if provided, otherwise use automatic discount
        const finalDiscount = updates.customDiscount !== undefined ? updates.customDiscount : pricing.discountPercent;
        const originalPrice = pricing.originalPrice;
        const discountAmount = Math.round((originalPrice * finalDiscount) / 100);
        const finalPrice = originalPrice - discountAmount;

        // Update bundle courses
        await supabase.from("bundle_courses").delete().eq("bundle_id", bundleId);

        const bundleCourses = updates.courseIds.map((courseId, index) => ({
          bundle_id: bundleId,
          course_id: courseId,
          order_index: index,
        }));

        await supabase.from("bundle_courses").insert(bundleCourses);

        // Update bundle with new pricing
        const updateData: Record<string, unknown> = {
          ...updates,
          price_cents: finalPrice,
          discount_percent: finalDiscount,
          updated_at: new Date().toISOString(),
        };
        delete updateData.courseIds;
        delete updateData.customDiscount;
        
        const { error } = await supabase
          .from("bundles")
          .update(updateData)
          .eq("id", bundleId);

        if (error) {
          return { success: false, error: error.message };
        }
      }
    } else {
      // Update bundle without course changes
      const { error } = await supabase
        .from("bundles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bundleId);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/bundles");
    revalidatePath(`/bundles/${bundleId}`);
    revalidatePath("/admin-bundles");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating bundle:", error);
    return { success: false, error: "Failed to update bundle" };
  }
}

/**
 * Delete bundle (soft delete by setting is_active to false)
 */
export async function deleteBundle(bundleId: string) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return { success: false, error: "Only super admins can delete bundles" };
    }

    // Soft delete
    const { error } = await supabase
      .from("bundles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", bundleId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/bundles");
    revalidatePath("/admin-bundles");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting bundle:", error);
    return { success: false, error: "Failed to delete bundle" };
  }
}

/**
 * Check if user has access to all courses in bundle
 */
export async function checkBundleAccess(userId: string, bundleId: string) {
  try {
    const supabase = await createServerClient();

    // Get all courses in bundle
    const { data: bundleCourses } = await supabase
      .from("bundle_courses")
      .select("course_id")
      .eq("bundle_id", bundleId);

    if (!bundleCourses || bundleCourses.length === 0) {
      return { success: false, hasAccess: false };
    }

    // Check enrollments
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .in(
        "course_id",
        bundleCourses.map((bc) => bc.course_id)
      );

    const hasAccess = enrollments && enrollments.length === bundleCourses.length;

    return { success: true, hasAccess };
  } catch (error) {
    console.error("Error checking bundle access:", error);
    return { success: false, hasAccess: false };
  }
}

/**
 * Get bundles for admin management (includes inactive)
 */
export async function getAdminBundles() {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("bundles")
      .select(
        `
        *,
        bundle_courses(
          course_id,
          courses(
            id,
            title,
            price_cents
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching admin bundles:", error);
    return { success: false, error: "Failed to fetch bundles" };
  }
}

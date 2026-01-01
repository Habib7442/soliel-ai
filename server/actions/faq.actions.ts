"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { FAQ, FAQCategory } from "@/types/db";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================
// PUBLIC ACTIONS (No auth required)
// ============================================

/**
 * Get all active FAQs (public access)
 */
export async function getActiveFAQs(): Promise<ActionResult<FAQ[]>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as FAQ[] };
  } catch (error) {
    console.error("Error fetching active FAQs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch FAQs",
    };
  }
}

/**
 * Get FAQ categories with count (public access)
 */
export async function getFAQCategories(): Promise<ActionResult<FAQCategory[]>> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("faqs")
      .select("category")
      .eq("is_active", true);

    if (error) throw error;

    // Group by category and count
    const categoryMap = new Map<string, number>();
    data.forEach((row) => {
      const count = categoryMap.get(row.category) || 0;
      categoryMap.set(row.category, count + 1);
    });

    const categories: FAQCategory[] = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching FAQ categories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

/**
 * Search FAQs by query (public access)
 */
export async function searchFAQs(query: string): Promise<ActionResult<FAQ[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const supabase = await createServerClient();

    // Use full-text search with tsvector
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("is_active", true)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "english",
      })
      .order("display_order", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as FAQ[] };
  } catch (error) {
    console.error("Error searching FAQs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search FAQs",
    };
  }
}

// ============================================
// ADMIN ACTIONS (Requires admin role)
// ============================================

/**
 * Check if user is admin
 */
async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('🔐 isAdmin check - user:', user?.id, user?.email);

    if (!user) {
      console.log('❌ isAdmin: No user found');
      return false;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log('👤 isAdmin check - profile:', profile, 'error:', error);
    console.log('🎯 isAdmin check - role:', profile?.role, '=== super_admin?', profile?.role === "super_admin");

    return profile?.role === "super_admin";
  } catch (error) {
    console.error('💥 isAdmin error:', error);
    return false;
  }
}

/**
 * Get all FAQs (admin only - includes inactive)
 */
export async function getAllFAQs(): Promise<ActionResult<FAQ[]>> {
  try {
    if (!(await isAdmin())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as FAQ[] };
  } catch (error) {
    console.error("Error fetching all FAQs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch FAQs",
    };
  }
}

/**
 * Create a new FAQ (admin only)
 */
export async function createFAQ(input: {
  question: string;
  answer: string;
  category: string;
  display_order?: number;
  is_active?: boolean;
}): Promise<ActionResult<FAQ>> {
  try {
    if (!(await isAdmin())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("faqs")
      .insert({
        question: input.question,
        answer: input.answer,
        category: input.category,
        display_order: input.display_order ?? 0,
        is_active: input.is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/faq");
    revalidatePath("/admin-faq");

    return { success: true, data: data as FAQ };
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create FAQ",
    };
  }
}

/**
 * Update an existing FAQ (admin only)
 */
export async function updateFAQ(
  id: string,
  input: {
    question?: string;
    answer?: string;
    category?: string;
    display_order?: number;
    is_active?: boolean;
  }
): Promise<ActionResult<FAQ>> {
  try {
    if (!(await isAdmin())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("faqs")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/faq");
    revalidatePath("/admin-faq");

    return { success: true, data: data as FAQ };
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update FAQ",
    };
  }
}

/**
 * Delete a FAQ (admin only)
 */
export async function deleteFAQ(id: string): Promise<ActionResult> {
  try {
    if (!(await isAdmin())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerClient();

    const { error } = await supabase.from("faqs").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/faq");
    revalidatePath("/admin-faq");

    return { success: true };
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete FAQ",
    };
  }
}

/**
 * Toggle FAQ active status (admin only)
 */
export async function toggleFAQStatus(
  id: string,
  is_active: boolean
): Promise<ActionResult<FAQ>> {
  try {
    if (!(await isAdmin())) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("faqs")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/faq");
    revalidatePath("/admin-faq");

    return { success: true, data: data as FAQ };
  } catch (error) {
    console.error("Error toggling FAQ status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle FAQ status",
    };
  }
}

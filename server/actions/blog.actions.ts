"use server";

import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-server";
import type { Blog, BlogCategory, BlogWithAuthor, BlogWithCategories } from "@/types/db";

// Helper function to generate URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .trim();
}

// ============================================
// BLOG CATEGORY ACTIONS
// ============================================

export async function getAllBlogCategories() {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("name", { ascending: true });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as BlogCategory[] };
}

export async function createBlogCategory(categoryData: {
  name: string;
  description?: string;
}) {
  const adminClient = await createAdminClient();
  
  const slug = generateSlug(categoryData.name);
  
  const { data, error } = await adminClient
    .from("blog_categories")
    .insert({
      name: categoryData.name,
      slug,
      description: categoryData.description || null,
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as BlogCategory };
}

export async function updateBlogCategory(
  categoryId: string,
  updates: Partial<BlogCategory>
) {
  const adminClient = await createAdminClient();
  
  // If name is being updated, regenerate slug
  if (updates.name) {
    updates.slug = generateSlug(updates.name);
  }
  
  const { data, error } = await adminClient
    .from("blog_categories")
    .update(updates)
    .eq("id", categoryId)
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as BlogCategory };
}

export async function deleteBlogCategory(categoryId: string) {
  const adminClient = await createAdminClient();
  
  const { error } = await adminClient
    .from("blog_categories")
    .delete()
    .eq("id", categoryId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// ============================================
// BLOG ACTIONS
// ============================================

export async function getAllBlogs(params?: {
  status?: 'draft' | 'published' | 'archived';
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createServerClient();
  
  let query = supabase
    .from("blogs")
    .select(`
      *,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      ),
      blog_category_relations (
        blog_categories (
          id,
          name,
          slug
        )
      )
    `)
    .order("created_at", { ascending: false });
  
  // Apply filters
  if (params?.status) {
    query = query.eq("status", params.status);
  }
  
  if (params?.search) {
    query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`);
  }
  
  if (params?.categoryId) {
    // Filter by category through junction table
    query = query.filter("blog_category_relations.category_id", "eq", params.categoryId);
  }
  
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as BlogWithCategories[] };
}

export async function getBlogBySlug(slug: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from("blogs")
    .select(`
      *,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      ),
      blog_category_relations (
        blog_categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq("slug", slug)
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as BlogWithCategories };
}

export async function getBlogById(blogId: string) {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from("blogs")
    .select(`
      *,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      ),
      blog_category_relations (
        blog_categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq("id", blogId)
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as BlogWithCategories };
}

export async function createBlog(blogData: {
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  author_id: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  status?: 'draft' | 'published' | 'archived';
  category_ids?: string[];
}) {
  const adminClient = await createAdminClient();
  
  // Generate slug from title
  const slug = generateSlug(blogData.title);
  
  // Create blog
  const { data: blog, error: blogError } = await adminClient
    .from("blogs")
    .insert({
      title: blogData.title,
      slug,
      subtitle: blogData.subtitle || null,
      content: blogData.content,
      excerpt: blogData.excerpt || null,
      featured_image_url: blogData.featured_image_url || null,
      author_id: blogData.author_id,
      meta_title: blogData.meta_title || null,
      meta_description: blogData.meta_description || null,
      meta_keywords: blogData.meta_keywords || null,
      og_title: blogData.og_title || null,
      og_description: blogData.og_description || null,
      og_image_url: blogData.og_image_url || null,
      status: blogData.status || 'draft',
      published_at: blogData.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();
  
  if (blogError) {
    return { success: false, error: blogError.message };
  }
  
  // Add category relations if provided
  if (blogData.category_ids && blogData.category_ids.length > 0) {
    const relations = blogData.category_ids.map(categoryId => ({
      blog_id: blog.id,
      category_id: categoryId,
    }));
    
    const { error: relationsError } = await adminClient
      .from("blog_category_relations")
      .insert(relations);
    
    if (relationsError) {
      // Rollback: delete the blog
      await adminClient.from("blogs").delete().eq("id", blog.id);
      return { success: false, error: relationsError.message };
    }
  }
  
  return { success: true, data: blog as Blog };
}

export async function updateBlog(
  blogId: string,
  updates: Partial<Blog> & { category_ids?: string[] }
) {
  const adminClient = await createAdminClient();
  
  // If title is being updated, regenerate slug
  if (updates.title) {
    updates.slug = generateSlug(updates.title);
  }
  
  // If status is changing to published and published_at is null, set it
  if (updates.status === 'published' && !updates.published_at) {
    updates.published_at = new Date().toISOString();
  }
  
  // Extract category_ids from updates
  const { category_ids, ...blogUpdates } = updates;
  
  // Update blog
  const { data, error } = await adminClient
    .from("blogs")
    .update(blogUpdates)
    .eq("id", blogId)
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Update category relations if provided
  if (category_ids !== undefined) {
    // Delete existing relations
    await adminClient
      .from("blog_category_relations")
      .delete()
      .eq("blog_id", blogId);
    
    // Add new relations
    if (category_ids.length > 0) {
      const relations = category_ids.map(categoryId => ({
        blog_id: blogId,
        category_id: categoryId,
      }));
      
      const { error: relationsError } = await adminClient
        .from("blog_category_relations")
        .insert(relations);
      
      if (relationsError) {
        return { success: false, error: relationsError.message };
      }
    }
  }
  
  return { success: true, data: data as Blog };
}

export async function deleteBlog(blogId: string) {
  const adminClient = await createAdminClient();
  
  // Delete blog (cascade will handle relations)
  const { error } = await adminClient
    .from("blogs")
    .delete()
    .eq("id", blogId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

export async function publishBlog(blogId: string) {
  const adminClient = await createAdminClient();
  
  const { data, error } = await adminClient
    .from("blogs")
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq("id", blogId)
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as Blog };
}

export async function unpublishBlog(blogId: string) {
  const adminClient = await createAdminClient();
  
  const { data, error } = await adminClient
    .from("blogs")
    .update({
      status: 'draft',
    })
    .eq("id", blogId)
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as Blog };
}

export async function archiveBlog(blogId: string) {
  const adminClient = await createAdminClient();
  
  const { data, error } = await adminClient
    .from("blogs")
    .update({
      status: 'archived',
    })
    .eq("id", blogId)
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as Blog };
}

// Get related blogs (same categories, exclude current blog)
export async function getRelatedBlogs(blogId: string, limit: number = 3) {
  const supabase = await createServerClient();
  
  // Get current blog's categories
  const { data: currentBlog } = await supabase
    .from("blog_category_relations")
    .select("category_id")
    .eq("blog_id", blogId);
  
  if (!currentBlog || currentBlog.length === 0) {
    return { success: true, data: [] };
  }
  
  const categoryIds = currentBlog.map(rel => rel.category_id);
  
  // Get blogs with same categories
  const { data, error } = await supabase
    .from("blogs")
    .select(`
      *,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      ),
      blog_category_relations!inner (
        blog_categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq("status", "published")
    .neq("id", blogId)
    .in("blog_category_relations.category_id", categoryIds)
    .limit(limit);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: data as BlogWithCategories[] };
}

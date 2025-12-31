// generated types (supabase)
export type Course = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  level: string | null;
  language: string | null;
  thumbnail_url: string | null;
  intro_video_url: string | null;
  price_cents: number;
  currency: string;
  is_published: boolean;
  status: string | null;
  instructor_id: string;
  created_at: string;
  updated_at: string;
  prerequisites: string | null;
  estimated_duration_hours: number | null;
  learning_outcomes: string[] | null;
  target_audience: string | null;
  requirements: string | null;
  allow_in_bundles: boolean | null;
  bundle_discount_percent: number | null;
  enable_qna: boolean | null;
  enable_reviews: boolean | null;
  enable_certificates: boolean | null;
  drip_schedule: Record<string, unknown> | null;
  completion_criteria: Record<string, unknown> | null;
};

// Blog types
export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Blog = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_id: string;
  
  // SEO Metadata
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  
  // Publishing
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
};

export type BlogWithAuthor = Blog & {
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};

export type BlogWithCategories = BlogWithAuthor & {
  blog_category_relations: {
    blog_categories: BlogCategory;
  }[];
};

export type BlogCategoryRelation = {
  id: string;
  blog_id: string;
  category_id: string;
  created_at: string;
};
import { getBlogBySlug, getRelatedBlogs } from "@/server/actions/blog.actions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Facebook, Twitter, Linkedin } from "lucide-react";

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBlogBySlug(slug);

  if (!result.success || !result.data) {
    return {
      title: "Blog Post Not Found",
    };
  }

  const blog = result.data;

  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description || blog.excerpt || blog.content.substring(0, 160),
    keywords: blog.meta_keywords?.split(",") || [],
    authors: blog.profiles ? [{ name: blog.profiles.full_name || "Unknown" }] : [],
    openGraph: {
      title: blog.og_title || blog.meta_title || blog.title,
      description: blog.og_description || blog.meta_description || blog.excerpt || blog.content.substring(0, 160),
      images: blog.og_image_url || blog.featured_image_url ? [{
        url: blog.og_image_url || blog.featured_image_url || "",
        alt: blog.title,
      }] : [],
      type: "article",
      publishedTime: blog.published_at || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.og_title || blog.meta_title || blog.title,
      description: blog.og_description || blog.meta_description || blog.excerpt || blog.content.substring(0, 160),
      images: blog.og_image_url || blog.featured_image_url ? [blog.og_image_url || blog.featured_image_url || ""] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const [blogResult, relatedResult] = await Promise.all([
    getBlogBySlug(slug),
    getBlogBySlug(slug).then(async (result) => {
      if (result.success && result.data) {
        return getRelatedBlogs(result.data.id, 3);
      }
      return { success: false };
    }),
  ]);

  if (!blogResult.success) {
    notFound();
  }

  if (!('data' in blogResult) || !blogResult.data) {
    notFound();
  }

  const blog = blogResult.data;
  const relatedBlogs = (relatedResult.success && 'data' in relatedResult && relatedResult.data) ? relatedResult.data : [];

  // Current URL for sharing
  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/blog/${blog.slug}`;

  return (
    <div className="min-h-screen py-12">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {/* Featured Image */}
        {blog.featured_image_url && (
          <div className="relative h-96 w-full overflow-hidden rounded-lg mb-8">
            <Image
              src={blog.featured_image_url}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          {blog.blog_category_relations?.map((rel) => (
            <Link key={rel.blog_categories.id} href={`/blog?category=${rel.blog_categories.slug}`}>
              <Badge variant="secondary" className="cursor-pointer">
                {rel.blog_categories.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#FF0000] to-[#CC0000] bg-clip-text text-transparent">
          {blog.title}
        </h1>

        {/* Subtitle */}
        {blog.subtitle && (
          <p className="text-xl text-muted-foreground mb-6">{blog.subtitle}</p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{blog.profiles?.full_name || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {blog.published_at
                ? new Date(blog.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Draft"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, "<br />") }}
        />

        {/* Social Sharing */}
        <div className="border-t border-b py-6 mb-12">
          <h3 className="text-lg font-semibold mb-4">Share this post</h3>
          <div className="flex gap-4">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(blog.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          </div>
        </div>

        {/* Related Posts */}
        {relatedBlogs && relatedBlogs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link key={relatedBlog.id} href={`/blog/${relatedBlog.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {relatedBlog.featured_image_url && (
                      <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={relatedBlog.featured_image_url}
                          alt={relatedBlog.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-base">
                        {relatedBlog.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {relatedBlog.excerpt || relatedBlog.content.substring(0, 100)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
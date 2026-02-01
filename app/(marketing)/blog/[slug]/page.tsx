import { getBlogBySlug, getRelatedBlogs } from "@/server/actions/blog.actions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
    <div className="min-h-screen relative overflow-hidden selection:bg-primary selection:text-white">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/2 left-0 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-12 group hover:bg-transparent hover:text-primary transition-colors pl-0">
            <ArrowLeft className="h-5 w-5 mr-3 transition-transform group-hover:-translate-x-1" />
            <span className="font-black uppercase tracking-widest text-xs">Back to Articles</span>
          </Button>
        </Link>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8">
          {blog.blog_category_relations?.map((rel) => (
            <Link key={rel.blog_categories.id} href={`/blog?category=${rel.blog_categories.slug}`}>
              <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/20 cursor-pointer px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                {rel.blog_categories.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-gray-900 leading-[1.1]">
          {blog.title}
        </h1>

        {/* Subtitle */}
        {blog.subtitle && (
          <p className="text-2xl text-muted-foreground/80 mb-10 font-medium leading-relaxed">
            {blog.subtitle}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-8 mb-12 pb-12 border-b border-gray-100/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                {blog.profiles?.avatar_url ? (
                  <Image src={blog.profiles.avatar_url} alt={blog.profiles.full_name || ""} width={48} height={48} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-gray-400">
                    {blog.profiles?.full_name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">Written by</span>
              <span className="text-lg font-black text-gray-900">{blog.profiles?.full_name || "Anonymous"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border-2 border-white shadow-sm">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">Published on</span>
              <span className="text-lg font-black text-gray-900">
                {blog.published_at
                  ? new Date(blog.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Draft Version"}
              </span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {blog.featured_image_url && (
          <div className="relative h-[500px] w-full overflow-hidden rounded-[3rem] shadow-2xl shadow-black/10 mb-16 group">
            <Image
              src={blog.featured_image_url}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg prose-gray max-w-none mb-20 prose-headings:font-black prose-headings:tracking-tight prose-p:font-medium prose-p:leading-relaxed prose-a:text-primary prose-a:font-black prose-img:rounded-[2rem] prose-strong:font-black"
          dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, "<br />") }}
        />

        {/* Social Sharing */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[3rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-20">
          <h3 className="text-2xl font-black mb-8 tracking-tight">Spread the <span className="text-primary italic">knowledge.</span></h3>
          <div className="flex flex-wrap gap-4">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#1877F2] text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
            >
              <Facebook className="h-5 w-5" />
              Share
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(blog.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#1DA1F2] text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-sky-500/20"
            >
              <Twitter className="h-5 w-5" />
              Tweet
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#0A66C2] text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-blue-700/20"
            >
              <Linkedin className="h-5 w-5" />
              Post
            </a>
          </div>
        </div>

        {/* Related Posts */}
        {relatedBlogs && relatedBlogs.length > 0 && (
          <div className="pb-32">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black tracking-tight">More like <span className="text-primary italic">this.</span></h2>
              <Link href="/blog" className="text-sm font-black uppercase tracking-widest text-primary hover:underline underline-offset-8">
                View all articles
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedBlogs.map((relatedBlog) => (
                <Link key={relatedBlog.id} href={`/blog/${relatedBlog.slug}`} className="group h-full">
                  <Card className="h-full border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/70 backdrop-blur-xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col">
                    {relatedBlog.featured_image_url && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={relatedBlog.featured_image_url}
                          alt={relatedBlog.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    )}
                    <CardHeader className="p-6">
                      <CardTitle className="line-clamp-2 text-lg font-black leading-tight group-hover:text-primary transition-colors">
                        {relatedBlog.title}
                      </CardTitle>
                    </CardHeader>
                    <CardFooter className="p-6 pt-0 mt-auto">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Calendar className="h-3 w-3" />
                        <span>{relatedBlog.published_at ? new Date(relatedBlog.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}</span>
                      </div>
                    </CardFooter>
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
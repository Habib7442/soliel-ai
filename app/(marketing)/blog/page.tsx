import { getAllBlogs, getAllBlogCategories } from "@/server/actions/blog.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Blog | Soliel AI",
  description: "Insights, guides, and updates from Soliel AI - your learning platform",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  // Await searchParams in Next.js 15+
  const params = await searchParams;
  
  // Fetch published blogs and categories
  const [blogsResult, categoriesResult] = await Promise.all([
    getAllBlogs({ status: "published", search: params.search }),
    getAllBlogCategories(),
  ]);

  const blogs = blogsResult.success ? blogsResult.data : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];

  // Filter by category if selected
  const filteredBlogs = params.category
    ? blogs?.filter((blog) =>
        blog.blog_category_relations?.some(
          (rel) => rel.blog_categories.slug === params.category
        )
      )
    : blogs;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#FF0000] to-[#CC0000] bg-clip-text text-transparent">
            Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Insights, guides, and updates to help you on your learning journey
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <form action="/blog" method="get" className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  name="search"
                  placeholder="Search blog posts..."
                  defaultValue={params.search}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Link href="/blog">
              <Badge
                variant={!params.category ? "default" : "outline"}
                className="cursor-pointer"
              >
                All Posts
              </Badge>
            </Link>
            {categories?.map((category) => (
              <Link key={category.id} href={`/blog?category=${category.slug}`}>
                <Badge
                  variant={
                    params.category === category.slug ? "default" : "outline"
                  }
                  className="cursor-pointer"
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        {filteredBlogs && filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {blog.featured_image_url && (
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                      <Image
                        src={blog.featured_image_url}
                        alt={blog.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {blog.blog_category_relations?.map((rel) => (
                        <Badge key={rel.blog_categories.id} variant="secondary">
                          {rel.blog_categories.name}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                    {blog.subtitle && (
                      <CardDescription className="line-clamp-1">
                        {blog.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {blog.excerpt || blog.content.substring(0, 150) + "..."}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{blog.profiles?.full_name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {blog.published_at
                            ? new Date(blog.published_at).toLocaleDateString()
                            : "Draft"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              No blog posts found.{" "}
              {params.search && (
                <>
                  Try a different search term or{" "}
                  <Link href="/blog" className="text-primary underline">
                    view all posts
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
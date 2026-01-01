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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-gray-950 border-b dark:border-gray-800 pb-32 pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5 rounded-full px-4 py-1.5 text-sm uppercase tracking-wider font-semibold">
              Our Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
              Insights & <span className="text-primary">Updates</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Expert guides, industry trends, and the latest news to help you master your craft.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-20">
        {/* Search and Filters Bar */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-12">
          <form action="/blog" method="get" className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                name="search"
                placeholder="Search articles..."
                defaultValue={params.search}
                className="pl-12 h-12 border border-muted bg-white dark:bg-gray-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
              />
            </div>
            <Button type="submit" className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium transition-all shadow-md hover:shadow-lg">
              Search
            </Button>
          </form>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <Link href="/blog">
              <Badge
                variant={!params.category ? "default" : "outline"}
                className={`cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !params.category 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 border-muted"
                }`}
              >
                All Posts
              </Badge>
            </Link>
            {categories?.map((category) => (
              <Link key={category.id} href={`/blog?category=${category.slug}`}>
                <Badge
                  variant={params.category === category.slug ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    params.category === category.slug 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border-muted"
                  }`}
                >
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        {filteredBlogs && filteredBlogs.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {filteredBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] group">
                <Card className="h-full border border-gray-100 dark:border-gray-800 hover:border-primary/20 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                  {blog.featured_image_url && (
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={blog.featured_image_url}
                        alt={blog.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {blog.blog_category_relations?.slice(0, 2).map((rel) => (
                        <Badge key={rel.blog_categories.id} variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                          {rel.blog_categories.name}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {blog.title}
                    </CardTitle>
                    {blog.subtitle && (
                      <CardDescription className="line-clamp-1 text-base mt-2">
                        {blog.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-6 text-sm leading-relaxed">
                      {blog.excerpt || blog.content.substring(0, 150) + "..."}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                        <span className="font-medium">{blog.profiles?.full_name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {blog.published_at
                            ? new Date(blog.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
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
          <div className="text-center py-20 bg-white/50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              We couldn't find any posts matching your search criteria.
            </p>
            {params.search && (
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/blog">
                  Clear Search
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      {/* Hero Section */}
      <div className="relative pt-20 pb-32 md:pt-32 md:pb-40 selection:bg-primary selection:text-white">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors px-4 py-1.5 text-sm font-bold uppercase tracking-widest rounded-full mb-8">
            Our Blog
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 tracking-tight text-gray-900 leading-[1.1]">
            Insights & <br />
            <span className="text-primary italic">Updates</span>
          </h1>
          <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Expert guides, industry trends, and the latest news to help you master your craft with Soliel AI.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-20 pb-32">
        {/* Search and Filters Bar */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white/50 p-8 mb-16">
          <form action="/blog" method="get" className="flex flex-col md:flex-row gap-5 mb-8">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={22} />
              <Input
                type="text"
                name="search"
                placeholder="Search articles..."
                defaultValue={params.search}
                className="pl-14 h-16 border-gray-100 bg-gray-50/50 focus:bg-white rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-lg font-medium"
              />
            </div>
            <Button type="submit" className="h-16 px-10 rounded-2xl bg-gray-900 hover:bg-primary text-white text-lg font-black transition-all shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95">
              Search
            </Button>
          </form>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <Link href="/blog">
              <Badge
                className={`cursor-pointer px-6 py-2.5 rounded-xl text-sm font-bold transition-all border-0 ${
                  !params.category 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-gray-100/50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                All Posts
              </Badge>
            </Link>
            {categories?.map((category) => (
              <Link key={category.id} href={`/blog?category=${category.slug}`}>
                <Badge
                  className={`cursor-pointer px-6 py-2.5 rounded-xl text-sm font-bold transition-all border-0 ${
                    params.category === category.slug 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-gray-100/50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {filteredBlogs.map((blog) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="group h-full">
                <Card className="h-full border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col">
                  {blog.featured_image_url && (
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image
                        src={blog.featured_image_url}
                        alt={blog.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}
                  <CardHeader className="pb-4 pt-8 px-8 flex-grow">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.blog_category_relations?.slice(0, 1).map((rel) => (
                        <Badge key={rel.blog_categories.id} className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-0 rounded-lg px-3 py-1">
                          {rel.blog_categories.name}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-2xl font-black mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {blog.title}
                    </CardTitle>
                    {blog.subtitle && (
                      <CardDescription className="line-clamp-2 text-base font-medium leading-relaxed">
                        {blog.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="px-8 pb-10 mt-auto">
                    <p className="text-muted-foreground/80 line-clamp-3 mb-8 text-sm leading-relaxed font-normal">
                      {blog.excerpt || blog.content.substring(0, 150) + "..."}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                           <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="text-gray-600">{blog.profiles?.full_name || "Soliel AI"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 opacity-50" />
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
          <div className="text-center py-32 bg-white/50 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-gray-100 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tight">No articles found</h3>
              <p className="text-xl text-muted-foreground/70 mb-10 max-w-sm mx-auto leading-relaxed">
                We couldn't find any posts matching your search criteria. Try another keyword?
              </p>
              {params.search && (
                <Button asChild className="rounded-2xl h-14 px-10 bg-gray-900 text-white font-black text-lg shadow-xl shadow-black/10 hover:bg-primary transition-all">
                  <Link href="/blog">
                    Clear Search
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
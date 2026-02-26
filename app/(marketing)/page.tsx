import { HeroSection } from "@/components/layout/HeroSection";
import { Courses } from "@/components/layout/Courses";
import { BundlesSection } from "@/components/layout/BundlesSection";
import { EnterpriseSection } from "@/components/layout/EnterpriseSection";
import { FeaturesSection } from "@/components/layout/FeaturesSection";
import { TestimonialsSection } from "@/components/layout/TestimonialsSection";
import { HowItWorksSection } from "@/components/layout/HowItWorksSection";
import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/enums";
import { getAllBlogs } from "@/server/actions/blog.actions";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";
import Image from "next/image";

export default async function Home() {
  const supabase = await createServerClient();
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  
  // Fetch latest published blogs
  const blogsResult = await getAllBlogs({ status: "published", limit: 3 });
  const blogs = blogsResult.success ? blogsResult.data : [];
  
  return (
    <div className="w-full">
      <HeroSection />
      <Courses />
      <BundlesSection />
      <HowItWorksSection />
      <EnterpriseSection />
      
      {/* Blog Section */}
      {blogs && blogs.length > 0 && (
        <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6">
                Insights
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                Latest from <span className="text-primary italic">Our Blog.</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                Insights, guides, and updates to help you on your learning journey.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/blog/${blog.slug}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300">
                  {blog.featured_image_url && (
                    <div className="relative h-32 w-full overflow-hidden flex-shrink-0">
                      <Image
                        src={blog.featured_image_url}
                        alt={blog.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {blog.blog_category_relations?.slice(0, 1).map((rel) => (
                        <span key={rel.blog_categories.id} className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                          {rel.blog_categories.name}
                        </span>
                      ))}
                    </div>
                    
                    <h3 className="text-sm font-bold mb-3 group-hover:text-primary transition-colors line-clamp-1 leading-tight">
                      {blog.title}
                    </h3>
                    
                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                          {blog.profiles?.avatar_url ? (
                            <Image src={blog.profiles.avatar_url} alt={blog.profiles.full_name || ""} width={20} height={20} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                              {blog.profiles?.full_name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-gray-500">{blog.profiles?.full_name?.split(' ')[0] || "Author"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>
                          {blog.published_at
                            ? new Date(blog.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center">
              <Button asChild size="xl" variant="outline" className="rounded-2xl border-gray-200 group hover:border-primary hover:text-primary px-10 transition-all">
                <Link href="/blog" className="flex items-center gap-2">
                  View All Posts
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
      
      <TestimonialsSection />
      <FeaturesSection />
    </div>
  );
}
import { HeroSection } from "@/components/layout/HeroSection";
import { Courses } from "@/components/layout/Courses";
import { BundlesSection } from "@/components/layout/BundlesSection";
import { EnterpriseSection } from "@/components/layout/EnterpriseSection";
import { FeaturesSection } from "@/components/layout/FeaturesSection";
import { LabsSection } from "@/components/layout/LabsSection";
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
  
  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const userRole = profile?.role || UserRole.STUDENT;
    
    switch (userRole) {
      case UserRole.INSTRUCTOR:
        redirect("/instructor-dashboard");
      case UserRole.COMPANY_ADMIN:
        redirect("/company-dashboard");
      case UserRole.SUPER_ADMIN:
        redirect("/admin-dashboard");
      default:
        redirect("/student-dashboard");
    }
  }
  
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
      <LabsSection />
      
      {/* Blog Section */}
      {blogs && blogs.length > 0 && (
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
              {blogs.slice(0, 3).map((blog) => (
                <Link key={blog.id} href={`/blog/${blog.slug}`} className="group flex flex-col bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100/50 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500">
                  {blog.featured_image_url && (
                    <div className="relative h-60 w-full overflow-hidden">
                      <Image
                        src={blog.featured_image_url}
                        alt={blog.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.blog_category_relations?.slice(0, 2).map((rel) => (
                        <span key={rel.blog_categories.id} className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full">
                          {rel.blog_categories.name}
                        </span>
                      ))}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {blog.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground/80 line-clamp-3 mb-8 leading-relaxed font-medium">
                      {blog.excerpt || blog.content.substring(0, 120) + "..."}
                    </p>
                    
                    <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                          {blog.profiles?.avatar_url ? (
                            <Image src={blog.profiles.avatar_url} alt={blog.profiles.full_name || ""} width={32} height={32} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                              {blog.profiles?.full_name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold text-gray-600">{blog.profiles?.full_name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {blog.published_at
                            ? new Date(blog.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
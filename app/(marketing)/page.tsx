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
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#FF0000] to-[#CC0000] bg-clip-text text-transparent">
                Latest from Our Blog
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Insights, guides, and updates to help you on your learning journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 max-w-7xl mx-auto">
            {blogs.slice(0, 3).map((blog) => (
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
                      {blog.blog_category_relations?.slice(0, 2).map((rel) => (
                        <Badge key={rel.blog_categories.id} variant="secondary" className="text-xs">
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
                      {blog.excerpt || blog.content.substring(0, 120) + "..."}
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
          
          <div className="text-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/blog">
                View All Posts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}
      
      <TestimonialsSection />
      <FeaturesSection />
    </div>
  );
}
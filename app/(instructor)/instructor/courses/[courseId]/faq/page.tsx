import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CourseFAQPage({ params }: { params: Promise<{ courseId: string }> }) {
  const supabase = await createServerClient();
  
  // Unwrap params
  const { courseId } = await params;
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
  
  if (courseError || !course) {
    return <div>Course not found</div>;
  }
  
  // Verify instructor owns this course
  if (course.instructor_id !== user.id) {
    redirect("/instructor-dashboard");
  }
  
  // Fetch FAQs for this course
  const { data: faqs, error: faqsError } = await supabase
    .from('course_faqs')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Course FAQ</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}`}>Back to Course</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Support for course-specific issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Button>Add New FAQ</Button>
                </div>
                
                {faqs && faqs.length > 0 ? (
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{faq.question}</h3>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                        <div className="mt-2 text-muted-foreground prose max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: faq.answer_md || '' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No FAQs added yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Add frequently asked questions to help students get quick answers to common issues.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>FAQ Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Total FAQs</h3>
                    <p className="text-2xl font-bold">{faqs?.length || 0}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">FAQ Statistics</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Published</span>
                        <span>{faqs?.filter(f => f).length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Drafts</span>
                        <span>0</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Best Practices</h3>
                    <ul className="text-muted-foreground text-sm mt-1 space-y-1">
                      <li>• Keep questions concise</li>
                      <li>• Provide clear, helpful answers</li>
                      <li>• Update regularly</li>
                      <li>• Group related questions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
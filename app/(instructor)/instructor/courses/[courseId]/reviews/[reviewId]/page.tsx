import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReviewDetailPage({ 
  params 
}: { 
  params: Promise<{ courseId: string; reviewId: string }> 
}) {
  const supabase = await createServerClient();
  
  // Unwrap params
  const { courseId, reviewId } = await params;
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch review details
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (full_name, avatar_url, email),
      courses (title)
    `)
    .eq('id', reviewId)
    .single();
  
  if (reviewError || !review) {
    return <div>Review not found</div>;
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
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Review Details</h1>
            <p className="text-muted-foreground">Feedback for {review.courses?.title || course.title}</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}/reviews`}>Back to Reviews</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Student Review</CardTitle>
                <CardDescription>Detailed feedback and rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center">
                      {review.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{review.profiles?.full_name || 'Anonymous Student'}</h3>
                      <p className="text-sm text-muted-foreground">{review.profiles?.email || 'No email provided'}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-6 h-6 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  {review.comment ? (
                    <div dangerouslySetInnerHTML={{ __html: review.comment }} />
                  ) : (
                    <p className="text-muted-foreground italic">No detailed comment provided.</p>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Review Metadata</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Submitted</h4>
                      <p>{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                      <p className="capitalize">{review.status || 'visible'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Respond to Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Public Response</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your response will be visible to all students viewing this course.
                    </p>
                    <div className="border rounded-lg p-4 min-h-[120px]">
                      {/* In a real implementation, this would be a rich text editor */}
                      <p className="text-muted-foreground">Response editor would go here</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Review Status</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant={review.status === 'visible' ? 'default' : 'outline'}>Visible</Button>
                      <Button variant={review.status === 'hidden' ? 'default' : 'outline'}>Hidden</Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button className="w-full">Save Response</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Course Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Course</h3>
                    <p className="text-muted-foreground">{review.courses?.title || course.title}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Average Rating</h3>
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2">4.2/5</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Total Reviews</h3>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-sm text-muted-foreground mt-1">+3 this month</p>
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
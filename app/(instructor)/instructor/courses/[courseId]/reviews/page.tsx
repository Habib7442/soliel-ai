import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CourseReviewsPage({ params }: { params: Promise<{ courseId: string }> }) {
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
  
  // Fetch reviews for this course
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (full_name, avatar_url)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  // Calculate average rating
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  // Count reviews by star rating
  const ratingCounts = [1, 2, 3, 4, 5].map(star => ({
    star,
    count: reviews ? reviews.filter(r => r.rating === star).length : 0
  }));
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Course Reviews</p>
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
                <CardTitle>Student Reviews</CardTitle>
                <CardDescription>Leave feedback and star ratings</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-2 font-medium">{review.profiles?.full_name || 'Anonymous'}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-muted-foreground">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No reviews yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Review Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium">Average Rating</h3>
                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-6 h-6 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-2xl font-bold">{averageRating.toFixed(1)}</span>
                      <span className="ml-1 text-muted-foreground">({reviews?.length || 0} reviews)</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Rating Distribution</h3>
                    <div className="mt-2 space-y-2">
                      {ratingCounts.map(({ star, count }) => (
                        <div key={star} className="flex items-center">
                          <span className="w-8 text-sm">{star}★</span>
                          <div className="flex-1 mx-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full" 
                                style={{ width: reviews && reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                              ></div>
                            </div>
                          </div>
                          <span className="w-8 text-sm text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Your Response</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Respond to student reviews to build trust and improve your course
                    </p>
                    <Button className="w-full mt-2" variant="outline">
                      Respond to Reviews
                    </Button>
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
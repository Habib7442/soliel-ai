import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LessonDetailPage({ 
  params 
}: { 
  params: Promise<{ courseId: string; lessonId: string }> 
}) {
  const supabase = await createServerClient();
  
  // Unwrap params
  const { courseId, lessonId } = await params;
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch lesson details
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();
  
  if (lessonError || !lesson) {
    return <div>Lesson not found</div>;
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
  
  // Fetch lesson assets
  const { data: assets, error: assetsError } = await supabase
    .from('lesson_assets')
    .select('*')
    .eq('lesson_id', lessonId);
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{lesson.title}</h1>
            <p className="text-muted-foreground">Lesson in {course.title}</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}/curriculum`}>Back to Curriculum</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
                <CardDescription>Edit your lesson details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {lesson.content_md ? (
                    <div dangerouslySetInnerHTML={{ __html: lesson.content_md }} />
                  ) : (
                    <p className="text-muted-foreground">No content added yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Video URL</h3>
                  <p className="text-muted-foreground text-sm">
                    {lesson.video_url || "No video added"}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Downloadable</h3>
                  <p className="text-muted-foreground text-sm">
                    {lesson.downloadable ? "Yes" : "No"}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Order Index</h3>
                  <p className="text-muted-foreground text-sm">
                    {lesson.order_index}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Lesson Assets</CardTitle>
                <CardDescription>PDFs, slides, and other materials</CardDescription>
              </CardHeader>
              <CardContent>
                {assets && assets.length > 0 ? (
                  <div className="space-y-3">
                    {assets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <h4 className="font-medium text-sm">{asset.name}</h4>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {asset.file_url}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No assets added yet.</p>
                )}
                
                <Button className="w-full mt-4" variant="outline">
                  Add Asset
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
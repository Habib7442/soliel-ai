import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CourseNotesPage({ params }: { params: Promise<{ courseId: string }> }) {
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
  
  // Fetch Q&A threads for this course
  const { data: threads, error: threadsError } = await supabase
    .from('qna_threads')
    .select(`
      *,
      profiles (full_name, avatar_url),
      qna_messages (count)
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Notes & Q&A</p>
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
                <CardTitle>Q&A Discussions</CardTitle>
                <CardDescription>Peer and instructor discussions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Button>Create New Discussion</Button>
                </div>
                
                {threads && threads.length > 0 ? (
                  <div className="space-y-4">
                    {threads.map((thread) => (
                      <div key={thread.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{thread.title}</h3>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/instructor/courses/${courseId}/notes/${thread.id}`}>
                              View Discussion
                            </Link>
                          </Button>
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>Started by {thread.profiles?.full_name || 'Unknown User'}</span>
                            <span className="mx-2">•</span>
                            <span>{thread.qna_messages?.[0]?.count || 0} messages</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No discussions started yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Notes Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Total Discussions</h3>
                    <p className="text-2xl font-bold">{threads?.length || 0}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Discussion Statistics</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unanswered</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolved</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Most Active</span>
                        <span>N/A</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Personal Notes</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Create and manage your personal course notes
                    </p>
                    <Button className="w-full mt-2" variant="outline">
                      View My Notes
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
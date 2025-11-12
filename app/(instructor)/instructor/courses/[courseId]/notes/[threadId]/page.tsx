import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NotesThreadPage({ 
  params 
}: { 
  params: Promise<{ courseId: string; threadId: string }> 
}) {
  const supabase = await createServerClient();
  
  // Unwrap params
  const { courseId, threadId } = await params;
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch thread details
  const { data: thread, error: threadError } = await supabase
    .from('qna_threads')
    .select(`
      *,
      profiles (full_name, avatar_url),
      courses (title)
    `)
    .eq('id', threadId)
    .single();
  
  if (threadError || !thread) {
    return <div>Discussion thread not found</div>;
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
  
  // Fetch messages for this thread
  const { data: messages, error: messagesError } = await supabase
    .from('qna_messages')
    .select(`
      *,
      profiles (full_name, avatar_url)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{thread.title}</h1>
            <p className="text-muted-foreground">Discussion in {thread.courses?.title || course.title}</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}/notes`}>Back to Discussions</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Discussion Thread</CardTitle>
                <CardDescription>Conversation between students and instructors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Original post */}
                  <div className="border-b pb-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                        {thread.profiles?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{thread.profiles?.full_name || 'Unknown User'}</h3>
                          <span className="text-sm text-muted-foreground">
                            {new Date(thread.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2 prose max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: thread.title }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Replies */}
                  {messages && messages.length > 0 ? (
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div key={message.id} className="flex items-start space-x-4">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                            {message.profiles?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{message.profiles?.full_name || 'Unknown User'}</h4>
                              <span className="text-sm text-muted-foreground">
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2 prose max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: message.body_md || '' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No replies yet. Be the first to respond!</p>
                    </div>
                  )}
                  
                  {/* Reply form */}
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-semibold mb-4">Add Your Response</h3>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 min-h-[120px]">
                        {/* In a real implementation, this would be a rich text editor */
}
                        <p className="text-muted-foreground">Reply editor would go here</p>
                      </div>
                      <div className="flex justify-end">
                        <Button>Post Reply</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Thread Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Started By</h3>
                    <p className="text-muted-foreground">{thread.profiles?.full_name || 'Unknown User'}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Created</h3>
                    <p className="text-muted-foreground">
                      {new Date(thread.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Replies</h3>
                    <p className="text-2xl font-bold">{messages?.length || 0}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Participants</h3>
                    <p className="text-muted-foreground">2 students, 1 instructor</p>
                    <p className="text-sm text-muted-foreground mt-1">Last activity: Just now</p>
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
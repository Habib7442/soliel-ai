import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Star, 
  Edit, 
  Layout, 
  FileQuestion, 
  GraduationCap, 
  MessageCircle, 
  HelpCircle,
  MessageSquare,
  Clock,
  MoreVertical,
  ChevronRight,
  Layers
} from "lucide-react";

interface CourseManagePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseManagePage({ params }: CourseManagePageProps) {
  const { courseId } = await params;
  
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== UserRole.INSTRUCTOR && profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  // Fetch course data
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('instructor_id', user.id)
    .single();
  
  if (error || !course) {
    console.error('❌ [CourseManagePage] Error fetching course:', error);
    redirect("/instructor-dashboard");
  }
  
  // Fetch sections with lessons
  const { data: sections } = await supabase
    .from('course_sections')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  // Calculate actual lesson count from sections
  const lessonCount = sections?.reduce((total, section) => {
    return total + (section.lessons?.length || 0);
  }, 0) || 0;
  
  // Fetch student count
  const { count: studentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);
  
  // Fetch live average rating and reviews count
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('rating')
    .eq('course_id', courseId);
    // Removed visibility filter to avoid hiding stats for instructor
  
  const totalReviews = reviewsData?.length || 0;
  const averageRating = totalReviews > 0 
    ? reviewsData!.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews 
    : 0;
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white pb-20">
      {/* Background Pattern & Blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      {/* Header Container */}
      <div className="relative pt-6 pb-6 border-b border-gray-100/50 backdrop-blur-sm bg-white/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-4">
           <Button variant="ghost" size="sm" asChild className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-bold">
              <Link href="/instructor-dashboard">
                 <ArrowLeft className="h-4 w-4 mr-2" />
                 Dashboard
              </Link>
           </Button>
           
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Course Manager</span>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl pt-10 relative z-10">
        
        {/* Course Header Info */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between mb-12">
           <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-3">
                 <Badge variant={course.is_published ? "default" : "secondary"} className={`rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest ${course.is_published ? "bg-green-500 hover:bg-green-600 text-white border-0" : "bg-gray-100 text-gray-600 border-0"}`}>
                   {course.is_published ? 'Published' : course.status}
                 </Badge>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{course.category || "General"}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-[1.1]">
                 {course.title}
              </h1>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl">
                 {course.subtitle || "No subtitle provided."}
              </p>
           </div>
           
           <div className="flex gap-3">
              <Button asChild size="lg" className="h-14 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black tracking-tight shadow-xl shadow-black/10 transition-all active:scale-95 border-0 px-8">
                 <Link href={`/instructor/courses/${courseId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                 </Link>
              </Button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-blue-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 flex items-center gap-6">
                 <div className="h-14 w-14 rounded-[1.25rem] bg-blue-100 text-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <Layers className="h-7 w-7" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em] mb-1">Content</p>
                   <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{lessonCount} <span className="text-lg text-gray-400 font-medium">lessons</span></h3>
                 </div>
              </CardContent>
           </Card>
           
           <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-green-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 flex items-center gap-6">
                 <div className="h-14 w-14 rounded-[1.25rem] bg-green-100 text-green-600 flex items-center justify-center shadow-lg shadow-green-500/10">
                    <Users className="h-7 w-7" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-green-600/60 uppercase tracking-[0.2em] mb-1">Community</p>
                   <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{studentCount} <span className="text-lg text-gray-400 font-medium">students</span></h3>
                 </div>
              </CardContent>
           </Card>
           
           <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-purple-50/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 flex items-center gap-6">
                 <div className="h-14 w-14 rounded-[1.25rem] bg-purple-100 text-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/10">
                    <Star className="h-7 w-7" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-purple-600/60 uppercase tracking-[0.2em] mb-1">Rating</p>
                   <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{averageRating.toFixed(1)} <span className="text-lg text-gray-400 font-medium">/ 5.0</span></h3>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-8 overflow-x-auto no-scrollbar border-b border-gray-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
               Overview
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
               Curriculum
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
               Quizzes
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
               Assignments
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
               People
            </TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
               FAQ
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
               Reviews
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 font-bold text-muted-foreground data-[state=active]:text-primary transition-all">
               Q&A
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                 <Card className="border-0 shadow-sm bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                       <CardTitle className="text-xl font-black">About Course</CardTitle>
                    </CardHeader>
                  <CardContent className="p-8 pt-2">
                       <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap">
                          {course.description || "No description provided."}
                       </div>
                    </CardContent>
                 </Card>
              </div>
              
              <div className="space-y-6">
                 <Card className="border-0 shadow-sm bg-gray-50/50 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                       <CardTitle className="text-lg font-black">Meta Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-2 space-y-6">
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-muted-foreground">Level</span>
                          <Badge variant="outline" className="bg-white capitalize font-bold">{course.level}</Badge>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-muted-foreground">Language</span>
                          <span className="font-bold text-gray-900">{course.language}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-muted-foreground">Price</span>
                          <span className="font-black text-primary text-lg">${(course.price_cents / 100).toFixed(2)}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-muted-foreground">Last Updated</span>
                          <span className="font-medium text-gray-900 text-sm">{new Date(course.updated_at).toLocaleDateString()}</span>
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </div>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-2xl font-black text-gray-900">Curriculum</CardTitle>
                    <CardDescription className="text-base font-medium mt-1">Manage your course structure</CardDescription>
                 </div>
                 <Button asChild className="rounded-xl h-12 bg-gray-900 hover:bg-primary font-bold shadow-lg shadow-black/10">
                    <Link href={`/instructor/courses/${courseId}/curriculum`}>
                       <Layout className="w-4 h-4 mr-2" />
                       Manage Sections
                    </Link>
                 </Button>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {sections && sections.length > 0 ? (
                  <div className="space-y-6">
                    {sections.map((section, index) => (
                      <div key={section.id} className="group border border-gray-100 bg-white rounded-[1.5rem] p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex gap-4">
                             <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-50 text-gray-400 font-black flex items-center justify-center border border-gray-100">
                                {index + 1}
                             </div>
                             <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-none mb-1 group-hover:text-primary transition-colors">
                                  {section.title}
                                </h3>
                                {section.description && (
                                  <p className="text-sm text-muted-foreground font-medium line-clamp-1">
                                    {section.description}
                                  </p>
                                )}
                             </div>
                          </div>
                        </div>
                        
                        {/* Lessons list */}
                        {section.lessons && section.lessons.length > 0 && (
                          <div className="pl-14 space-y-2">
                             <div className="flex items-center gap-2 mb-3">
                                <div className="h-px bg-gray-100 flex-grow" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-gray-300">Lessons</span>
                                <div className="h-px bg-gray-100 flex-grow" />
                             </div>
                            {section.lessons
                              .sort((a: any, b: any) => a.order_index - b.order_index)
                              .map((lesson: any) => (
                              <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                                <span className="flex-1 text-sm font-semibold text-gray-700">{lesson.title}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-gray-400 bg-white border-gray-200">{lesson.lesson_type}</Badge>
                                  {lesson.is_preview && (
                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-green-50 text-green-600">Free Preview</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium mb-6">Start building your masterpiece.</p>
                    <Button asChild variant="outline" className="rounded-xl font-bold">
                      <Link href={`/instructor/courses/${courseId}/curriculum`}>Add First Section</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden py-12">
               <div className="text-center">
                  <div className="w-20 h-20 bg-purple-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <FileQuestion className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Quiz Management</h3>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
                     Assess student knowledge with interactive quizzes. Create multiple choice, true/false, and more.
                  </p>
                  <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-bold bg-gray-900 hover:bg-primary shadow-xl shadow-black/10 transition-all active:scale-95">
                     <Link href={`/instructor/courses/${courseId}/quizzes`}>Launch Quiz Builder</Link>
                  </Button>
               </div>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden py-12">
               <div className="text-center">
                  <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <GraduationCap className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Assignments</h3>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
                     Create hands-on assignments for students to upload and get graded.
                  </p>
                  <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-bold bg-gray-900 hover:bg-primary shadow-xl shadow-black/10 transition-all active:scale-95">
                     <Link href={`/instructor/courses/${courseId}/assignments`}>Manage Assignments</Link>
                  </Button>
               </div>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden py-12">
               <div className="text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Community & Students</h3>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
                     Track student progress, send announcements, and manage enrollments.
                  </p>
                  <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-bold bg-gray-900 hover:bg-primary shadow-xl shadow-black/10 transition-all active:scale-95">
                     <Link href={`/instructor/courses/${courseId}/students`}>View Student Directory</Link>
                  </Button>
               </div>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden py-12">
               <div className="text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <HelpCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Knowledge Base</h3>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
                     Build a robust FAQ section to help students find answers quickly.
                  </p>
                  <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-bold bg-gray-900 hover:bg-primary shadow-xl shadow-black/10 transition-all active:scale-95">
                     <Link href={`/instructor/courses/${courseId}/faq`}>Manage FAQs</Link>
                  </Button>
               </div>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden py-12">
               <div className="text-center">
                  <div className="w-20 h-20 bg-yellow-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <Star className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Reviews & Ratings</h3>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
                     See what students are saying about your course and reply to feedback.
                  </p>
                  <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-bold bg-gray-900 hover:bg-primary shadow-xl shadow-black/10 transition-all active:scale-95">
                     <Link href={`/instructor/courses/${courseId}/reviews`}>View All Reviews</Link>
                  </Button>
               </div>
            </Card>
          </TabsContent>

          {/* Notes/Q&A Tab */}
          <TabsContent value="notes" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden py-12">
               <div className="text-center">
                  <div className="w-20 h-20 bg-pink-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <MessageSquare className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Course Discussions</h3>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
                     Engage with your students in Q&A threads and discussions.
                  </p>
                  <Button asChild size="lg" className="rounded-2xl h-14 px-8 font-bold bg-gray-900 hover:bg-primary shadow-xl shadow-black/10 transition-all active:scale-95">
                     <Link href={`/instructor/courses/${courseId}/notes`}>Enter Discussion Board</Link>
                  </Button>
               </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
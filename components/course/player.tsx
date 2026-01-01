"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VideoPlayer } from "./VideoPlayer";
import { ReviewForm } from "./ReviewForm";
import { CourseFaqDisplay } from "./CourseFaqDisplay";
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Play, 
  FileText, 
  Video as VideoIcon, 
  HelpCircle, 
  Clipboard, 
  Code,
  ChevronLeft,
  ChevronRight,
  Star,
  ChevronDown,
  Award,
  Download,
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { markLessonComplete } from "@/server/actions/enrollment.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CoursePlayerProps {
  course: {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    thumbnail_url?: string;
    instructor_id: string;
    profiles?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    order_index: number;
    lessons: Array<{
      id: string;
      title: string;
      lesson_type: string;
      video_url?: string;
      content_md?: string;
      duration_minutes?: number;
      order_index: number;
      is_preview: boolean;
      progress?: {
        completed: boolean;
        completed_at?: string;
      };
    }>;
  }>;
  progress: {
    progress_percent: number;
    total_lessons: number;
    completed_lessons: number;
  };
  enrollment: {
    id: string;
    status: string;
  };
  userId: string;
  userReview?: {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
  } | null;
}

export function CoursePlayer({ course, sections, progress, enrollment, userId, userReview }: CoursePlayerProps) {
  const router = useRouter();
  const [currentLesson, setCurrentLesson] = useState(() => {
    // Find first uncompleted lesson or first lesson
    for (const section of sections) {
      const uncompleted = section.lessons.find(l => !l.progress?.completed);
      if (uncompleted) return uncompleted;
    }
    return sections[0]?.lessons[0] || null;
  });
  const [markingComplete, setMarkingComplete] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  // Default to open on desktop, standard practice
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Mobile sheet state
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  
  // Build ordered lesson list
  const allLessons = sections
    .sort((a, b) => a.order_index - b.order_index)
    .flatMap(section => 
      section.lessons
        .sort((a, b) => a.order_index - b.order_index)
        .map(lesson => ({ ...lesson, sectionOrder: section.order_index }))
    );
  
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const hasNext = currentIndex < allLessons.length - 1;
  const hasPrevious = currentIndex > 0;

  // Icons helper
  const getLessonIcon = (lesson: typeof currentLesson) => {
    if (!lesson) return <Circle className="h-4 w-4" />;
    
    if (lesson.progress?.completed) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    
    switch (lesson.lesson_type) {
      case 'video': return <Play className="h-3 w-3 fill-current" />;
      case 'text': return <FileText className="h-3 w-3" />;
      case 'quiz': return <HelpCircle className="h-3 w-3" />;
      case 'assignment': return <Clipboard className="h-3 w-3" />;
      case 'lab': return <Code className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };
  
  const handleMarkComplete = async () => {
    if (!currentLesson || currentLesson.progress?.completed) return;
    
    setMarkingComplete(true);
    // Optimistic update
    const result = await markLessonComplete(userId, currentLesson.id, course.id);
    
    if (result.success) {
      toast.success("Lesson marked as complete!");
      router.refresh();
      
      // Auto-advance
      if (hasNext) {
        setCurrentLesson(allLessons[currentIndex + 1]);
      }
    } else {
      toast.error(result.error || "Failed to mark lesson complete");
    }
    
    setMarkingComplete(false);
  };
  
  const goToNext = () => {
    if (hasNext) {
      setCurrentLesson(allLessons[currentIndex + 1]);
    }
  };
  
  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentLesson(allLessons[currentIndex - 1]);
    }
  };
  
  // Render the accordion content - reused for both sidebar and mobile sheet
  const renderSyllabus = (isMobile: boolean = false) => (
    <div className={cn("pb-20", !isMobile && "h-full")}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-1">Content</h2>
          <div className="flex items-center justify-between text-xs">
              <span>{allLessons.length} lessons</span>
              <span>{progress.completed_lessons} completed</span>
          </div>
      </div>
      <Accordion type="single" collapsible defaultValue={sections.find(s => s.lessons.some(l => l.id === currentLesson?.id))?.id} className="w-full">
          {sections.map((section, idx) => (
            <AccordionItem key={section.id} value={section.id} className="border-b border-gray-100 dark:border-gray-800">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
                  <div className="text-left">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">Section {idx + 1}</p>
                      <p className="text-sm font-semibold line-clamp-1">{section.title}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-0">
                  <div className="flex flex-col">
                      {section.lessons.map((lesson) => {
                        const isActive = currentLesson?.id === lesson.id;
                        const isCompleted = lesson.progress?.completed;
                        
                        return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                  setCurrentLesson(lesson);
                                  if(isMobile) setMobileInfoOpen(false);
                              }}
                              className={cn(
                                  "flex items-start gap-3 px-4 py-3 text-left transition-colors border-l-2",
                                  isActive 
                                    ? "bg-primary/5 border-primary" 
                                    : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
                              )}
                            >
                              <div className="mt-0.5">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-500/10" />
                                  ) : (
                                    <div className={cn(
                                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                                        isActive ? "border-primary" : "border-gray-300 dark:border-gray-600"
                                    )}>
                                        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                    </div>
                                  )}
                              </div>
                              <div>
                                  <p className={cn(
                                    "text-sm leading-tight mb-1",
                                    isActive ? "font-medium text-primary" : "text-gray-700 dark:text-gray-300",
                                    isCompleted && !isActive && "text-muted-foreground decoration-gray-400"
                                  )}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    {lesson.lesson_type === 'video' && <Play className="h-3 w-3" />}
                                    {lesson.lesson_type === 'text' && <FileText className="h-3 w-3" />}
                                    {lesson.lesson_type === 'quiz' && <HelpCircle className="h-3 w-3" />}
                                    {lesson.duration_minutes && <span>{lesson.duration_minutes}m</span>}
                                  </div>
                              </div>
                            </button>
                        )
                      })}
                  </div>
                </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
       {/* Top Navigation Bar */}
       <header className="sticky top-0 z-40 flex items-center h-16 px-4 border-b bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-sm w-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
             <Button variant="ghost" size="icon" asChild className="mr-2 flex-shrink-0">
                <Link href="/student-dashboard">
                   <ChevronLeft className="h-5 w-5" />
                   <span className="sr-only">Back</span>
                </Link>
             </Button>
             <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
             <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 truncate">
                   {course.title}
                </h1>
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                   <span>{Math.round(progress.progress_percent)}% complete</span>
                   <Progress value={progress.progress_percent} className="h-1.5 w-24" />
                </div>
             </div>
          </div>
          
          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
             {/* Desktop Toggle */}
             <Button 
                variant="ghost" 
                size="sm" 
                className="hidden lg:flex"
                onClick={() => setSidebarOpen(!sidebarOpen)}
             >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {sidebarOpen ? 'Focus Mode' : 'Show Syllabus'}
             </Button>
             
             {/* Mobile Sheet Trigger */}
             <Sheet open={mobileInfoOpen} onOpenChange={setMobileInfoOpen}>
               <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Menu className="h-4 w-4 mr-2" />
                    Syllabus
                  </Button>
               </SheetTrigger>
               <SheetContent side="right" className="p-0 w-80 sm:w-96">
                  {renderSyllabus(true)}
               </SheetContent>
             </Sheet>
             
             {/* Mobile Progress Ring */}
             <div className="lg:hidden text-xs font-bold ring-2 ring-gray-100 rounded-full px-2 py-1">
                {Math.round(progress.progress_percent)}%
             </div>
          </div>
       </header>

       {/* Main Player Area - Responsive container */}
       <div className="container max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row items-start gap-8 relative">
          
             {/* Main Content Column */}
             <main className={cn(
                "flex-1 min-w-0 transition-all duration-300",
                sidebarOpen ? "lg:mr-0" : "mr-0"
             )}>
                 <div className="space-y-6 md:space-y-8">
                     
                     {/* Video/Content Container */}
                     <div className="bg-black rounded-xl md:rounded-2xl overflow-hidden shadow-xl md:shadow-2xl aspect-video relative flex items-center justify-center group w-full">
                        {currentLesson?.lesson_type === 'video' && currentLesson.video_url ? (
                           <VideoPlayer url={currentLesson.video_url} title={currentLesson.title} />
                        ) : (
                           <div className="text-center p-4 md:p-8 bg-gray-900 w-full h-full flex flex-col items-center justify-center text-gray-300">
                              {currentLesson?.lesson_type === 'quiz' ? (
                                 <HelpCircle className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50" />
                              ) : currentLesson?.lesson_type === 'assignment' ? (
                                 <Clipboard className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50" />
                              ) : currentLesson?.lesson_type === 'lab' ? (
                                 <Code className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50" />
                              ) : (
                                 <FileText className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50" />
                              )}
                              <h3 className="text-lg md:text-xl font-medium text-white mb-2 line-clamp-2 px-4">
                                 {currentLesson ? currentLesson.title : 'Select a lesson'}
                              </h3>
                           </div>
                        )}
                     </div>

                     {/* Lesson Control Bar */}
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                           <Button 
                              variant="ghost" 
                              onClick={goToPrevious} 
                              disabled={!hasPrevious}
                              className="flex-1 sm:flex-none hover:bg-gray-100 dark:hover:bg-gray-700"
                           >
                              <ChevronLeft className="h-4 w-4 mr-2" /> Prev
                           </Button>
                           <Button 
                              variant="ghost" 
                              onClick={goToNext} 
                              disabled={!hasNext}
                              className="flex-1 sm:flex-none hover:bg-gray-100 dark:hover:bg-gray-700"
                           >
                              Next <ChevronRight className="h-4 w-4 ml-2" />
                           </Button>
                        </div>

                        {!currentLesson?.progress?.completed && currentLesson?.lesson_type !== 'quiz' && (
                           <Button 
                              onClick={handleMarkComplete} 
                              disabled={markingComplete}
                              className="w-full sm:w-auto min-w-[160px]"
                           >
                              {markingComplete ? "Updating..." : (
                                 <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Completed
                                 </>
                              )}
                           </Button>
                        )}
                     </div>

                     {/* Lesson Details */}
                     <div className="flex flex-col gap-6">
                        <div className="space-y-2">
                           <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                              {currentLesson?.title}
                           </h2>
                           <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {currentLesson?.duration_minutes && (
                                 <span className="flex items-center">
                                    <span className="h-1 w-1 bg-gray-400 rounded-full mr-2" />
                                    {currentLesson.duration_minutes} min
                                 </span>
                              )}
                              <Badge variant="outline" className="capitalize font-normal text-xs">
                                 {currentLesson?.lesson_type}
                              </Badge>
                           </div>
                        </div>

                        {/* Content Renderer */}
                         {currentLesson?.lesson_type === 'text' && currentLesson.content_md && (
                            <div className="prose prose-gray dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                               <ReactMarkdown>{currentLesson.content_md}</ReactMarkdown>
                            </div>
                         )}

                         {currentLesson?.lesson_type === 'lab' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                               <Code className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                               <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">Interactive Lab Session</h3>
                               <p className="text-blue-700 dark:text-blue-300 mb-6">This lesson requires you to complete a coding exercise.</p>
                               <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                                  <Link href={`/learn/${course.id}/labs`}>Open Lab Environment</Link>
                               </Button>
                            </div>
                         )}
                     </div>
                     
                     {/* Footer sections (Instructor, Feedback, FAQ) */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-200 dark:border-gray-800 pb-20">
                         {/* Instructor Column */}
                         <div className="space-y-8">
                           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <h3 className="font-semibold text-lg mb-4">About the Instructor</h3>
                              <div className="flex items-center gap-4">
                                 <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                    {course.profiles?.avatar_url ? (
                                      <img src={course.profiles.avatar_url} alt="Instructor" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="font-bold text-gray-500 text-xl">{course.profiles?.full_name?.charAt(0)}</span>
                                    )}
                                 </div>
                                 <div>
                                    <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{course.profiles?.full_name}</p>
                                    <p className="text-sm text-primary font-medium">Course Creator</p>
                                 </div>
                              </div>
                              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                                 {course.description ? course.description.substring(0, 200) + "..." : "No bio available."}
                              </p>
                           </div>
                           
                           {/* FAQ in left column below instructor */}
                           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <CourseFaqDisplay courseId={course.id} />
                           </div>
                         </div>
                         
                         {/* Review Column */}
                         <div className="space-y-8">
                             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                                  Rate this Course
                                </h3>
                                
                                <ReviewForm courseId={course.id} userId={userId} existingReview={userReview} />
                             </div>
                         </div>
                     </div>
                 </div>
             </main>

             {/* Desktop Sticky Sidebar Playlist */}
             <aside className={cn(
                "hidden lg:block w-80 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden sticky top-24 transition-all duration-300 shadow-sm",
                sidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 p-0 border-0 overflow-hidden"
             )}>
                <div className="max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                   {renderSyllabus(false)}
                </div>
             </aside>
          </div>
          
           {/* Completion Banner - Fixed Bottom */}
           {progress.progress_percent === 100 && (
               <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-full max-w-md px-4">
                  <div className="bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-full shadow-2xl flex items-center gap-4 pr-6 border border-white/10 ring-4 ring-black/5 dark:ring-white/10">
                     <div className="bg-green-500 rounded-full p-2 shrink-0">
                        <Award className="h-5 w-5 text-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">Course Completed!</p>
                        <p className="text-xs opacity-80 truncate">You&apos;ve earned your certificate.</p>
                     </div>
                     <Button size="sm" variant="secondary" asChild className="ml-2 rounded-full whitespace-nowrap px-4 bg-white text-black hover:bg-gray-200 dark:bg-black dark:text-white dark:hover:bg-gray-800">
                        <Link href="/profile">View Certificate</Link>
                     </Button>
                  </div>
               </div>
           )}
       </div>
    </div>
  );
}

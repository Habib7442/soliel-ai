"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { VideoPlayer } from "./VideoPlayer";
import { ReviewForm } from "./ReviewForm";
import { CourseFaqDisplay } from "./CourseFaqDisplay";
import { QuizRenderer } from "./QuizRenderer";
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
  Clock,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { markLessonComplete } from "@/server/actions/enrollment.actions";
import { getQuizByLessonId, getStudentQuizAttempts, type Quiz, type QuizQuestion, type QuizAttempt } from "@/server/actions/quiz.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AssignmentRenderer } from "./AssignmentRenderer";

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
  
  // Quiz state
  const [quizData, setQuizData] = useState<{ quiz: Quiz; questions: QuizQuestion[] } | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [validQuizLessonIds, setValidQuizLessonIds] = useState<Set<string>>(new Set());
  
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
  const getLessonIcon = (lesson: any) => {
    if (!lesson) return <Circle className="h-4 w-4" />;
    
    if (lesson.progress?.completed) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    
    switch (lesson.lesson_type) {
      case 'video': return <Play className="h-3 w-3 fill-current" />;
      case 'text': return <FileText className="h-3 w-3" />;
      case 'quiz': return <HelpCircle className="h-3 w-3" />;
      case 'assignment': return <Clipboard className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };
  
  const handleMarkComplete = async (explicitLessonId?: string, skipAutoAdvance: boolean = false) => {
    const lessonToMark = explicitLessonId 
      ? allLessons.find(l => l.id === explicitLessonId) 
      : currentLesson;

    if (!lessonToMark || lessonToMark.progress?.completed) return;
    
    setMarkingComplete(true);
    const result = await markLessonComplete(userId, lessonToMark.id, course.id);
    
    if (result.success) {
      toast.success("Lesson marked as complete!");
      router.refresh();
      
      // Auto-advance
      if (hasNext && !skipAutoAdvance) {
        setCurrentLesson(allLessons[currentIndex + 1]);
      }
    } else {
      toast.error(result.error || "Failed to mark lesson complete");
    }
    
    setMarkingComplete(false);
  };

  // Validate all quiz lessons on mount to determine which ones have actual content
  useEffect(() => {
    const validateQuizLessons = async () => {
      const quizLessons = allLessons.filter(l => l.lesson_type === 'quiz');
      const validIds = new Set<string>();
      
      for (const lesson of quizLessons) {
        const result = await getQuizByLessonId(lesson.id);
        if (result.success && result.data) {
          validIds.add(lesson.id);
        }
      }
      
      setValidQuizLessonIds(validIds);
    };
    
    if (allLessons.length > 0) {
      validateQuizLessons();
    }
  }, [sections]); // Run when sections change

  // Fetch quiz data when a quiz lesson is selected
  useEffect(() => {
    const fetchQuizData = async () => {
      if (currentLesson?.lesson_type === 'quiz') {
        setLoadingQuiz(true);
        
        // Fetch quiz and questions
        const quizResult = await getQuizByLessonId(currentLesson.id);
          if (quizResult.success) {
            if (quizResult.data) {
              setQuizData(quizResult.data);
              
              // Fetch student's previous attempts
              const attemptsResult = await getStudentQuizAttempts(quizResult.data.quiz.id, userId);
              if (attemptsResult.success && attemptsResult.data) {
                setQuizAttempts(attemptsResult.data);
              }
            } else {
              setQuizData(null);
            }
          } else {
            toast.error(quizResult.error || "Failed to load quiz");
          }
        
        setLoadingQuiz(false);
      } else {
        setQuizData(null);
        setQuizAttempts([]);
      }
    };

    fetchQuizData();
  }, [currentLesson?.id, currentLesson?.lesson_type, userId]);
  
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
      <div className="p-6 border-b border-gray-100 bg-white/50 sticky top-0 z-10 backdrop-blur-sm">
          <h2 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Course Content</h2>
          <div className="flex items-center justify-between text-xs font-bold text-gray-900">
              <span>{allLessons.length} lessons</span>
              <span className="text-primary">{progress.completed_lessons} completed</span>
          </div>
      </div>
      <Accordion type="single" collapsible defaultValue={sections.find(s => s.lessons.some(l => l.id === currentLesson?.id))?.id} className="w-full">
          {sections.map((section, idx) => (
            <AccordionItem key={section.id} value={section.id} className="border-b border-gray-50 last:border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50 transition-colors">
                  <div className="text-left">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Section {idx + 1}</p>
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">{section.title}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-0">
                  <div className="flex flex-col bg-gray-50/30">
                      {section.lessons
                        .filter(lesson => {
                          // Hide quiz lessons that don't have actual quiz content
                          if (lesson.lesson_type === 'quiz') {
                            return validQuizLessonIds.has(lesson.id);
                          }
                          return true;
                        })
                        .map((lesson) => {
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
                                  "flex items-start gap-4 px-6 py-3 text-left transition-all border-l-[3px]",
                                  isActive 
                                    ? "bg-primary/5 border-primary" 
                                    : "bg-transparent border-transparent hover:bg-gray-100/50"
                              )}
                            >
                              <div className="mt-0.5">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-500/10" />
                                  ) : (
                                    <div className={cn(
                                        "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
                                        isActive ? "border-primary" : "border-gray-300"
                                    )}>
                                        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                    </div>
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm leading-tight mb-1 truncate",
                                    isActive ? "font-bold text-primary" : "font-medium text-gray-700",
                                    isCompleted && !isActive && "text-muted-foreground line-through decoration-gray-300"
                                  )}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                    {getLessonIcon(lesson)}
                                    {lesson.lesson_type === 'quiz' && (
                                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0 text-[8px] px-1.5 py-0 h-4 font-black">QUIZ</Badge>
                                    )}
                                    {lesson.lesson_type === 'assignment' && (
                                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-[8px] px-1.5 py-0 h-4 font-black">ASSIGNMENT</Badge>
                                    )}
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
    <div className="min-h-screen relative bg-white selection:bg-primary selection:text-white">
       {/* Background Blobs (Subtler for focus) */}
       <div className="fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
       
       {/* Top Navigation Bar */}
       <header className="sticky top-0 z-40 flex items-center h-16 px-4 md:px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_30px_rgb(0,0,0,0.02)] w-full transition-all">
          <div className="flex items-center gap-4 flex-1 min-w-0">
             <Button variant="ghost" size="icon" asChild className="mr-2 flex-shrink-0 hover:bg-gray-100 rounded-xl w-10 h-10">
                <Link href="/student-dashboard">
                   <ChevronLeft className="h-5 w-5" />
                   <span className="sr-only">Back</span>
                </Link>
             </Button>
             <div className="hidden md:block w-px h-6 bg-gray-200 flex-shrink-0" />
             <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-black text-gray-900 tracking-tight line-clamp-1 truncate">
                   {course.title}
                </h1>
                <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                   <span>{Math.round(progress.progress_percent)}% complete</span>
                   <Progress value={progress.progress_percent} className="h-1.5 w-24 bg-gray-100" />
                </div>
             </div>
          </div>
          
          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
             {/* Desktop Toggle */}
             <Button 
                variant="ghost" 
                size="sm" 
                className="hidden lg:flex text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl px-4"
                onClick={() => setSidebarOpen(!sidebarOpen)}
             >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {sidebarOpen ? 'Focus Mode' : 'Show Syllabus'}
             </Button>
             
             {/* Mobile Sheet Trigger */}
             <Sheet open={mobileInfoOpen} onOpenChange={setMobileInfoOpen}>
               <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden rounded-xl border-gray-200">
                    <Menu className="h-4 w-4 mr-2" />
                    Syllabus
                  </Button>
               </SheetTrigger>
               <SheetContent side="right" className="p-0 w-80 sm:w-96 rounded-l-[2rem] border-l border-gray-100 shadow-2xl">
                  <VisuallyHidden>
                    <SheetTitle>Course Syllabus</SheetTitle>
                  </VisuallyHidden>
                  {renderSyllabus(true)}
               </SheetContent>
             </Sheet>
             
             {/* Mobile Progress Ring */}
             <div className="lg:hidden text-[10px] font-black ring-2 ring-gray-100 rounded-full w-8 h-8 flex items-center justify-center bg-white">
                {Math.round(progress.progress_percent)}%
             </div>
          </div>
       </header>

       {/* Main Player Area - Responsive container */}
       <div className="container max-w-[1400px] mx-auto px-4 py-6 md:py-8 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-8 relative">
          
             {/* Main Content Column */}
             <main className={cn(
                "flex-1 min-w-0 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
                sidebarOpen ? "lg:mr-0" : "mr-0"
             )}>
                 <div className="space-y-6 md:space-y-8">
                     
                     {/* Video/Content Container */}
                     <div className="bg-black rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 aspect-video relative flex items-center justify-center group w-full ring-1 ring-white/10">
                        {currentLesson?.lesson_type === 'video' && currentLesson.video_url ? (
                           <VideoPlayer url={currentLesson.video_url} title={currentLesson.title} />
                        ) : (
                           <div className="text-center p-4 md:p-8 bg-gray-900 w-full h-full flex flex-col items-center justify-center text-gray-300">
                              {currentLesson?.lesson_type === 'quiz' ? (
                                 <HelpCircle className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50 text-purple-400" />
                              ) : currentLesson?.lesson_type === 'assignment' ? (
                                 <Clipboard className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50 text-blue-400" />
                              ) : (
                                 <FileText className="h-12 w-12 md:h-16 md:w-16 mb-4 opacity-50 text-gray-400" />
                              )}
                              <h3 className="text-xl md:text-2xl font-black text-white mb-2 line-clamp-2 px-4 tracking-tight">
                                 {currentLesson ? currentLesson.title : 'Select a lesson'}
                              </h3>
                           </div>
                        )}
                     </div>

                     {/* Lesson Control Bar */}
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                           <Button 
                              variant="outline" 
                              onClick={goToPrevious} 
                              disabled={!hasPrevious}
                              className="flex-1 sm:flex-none rounded-xl font-bold border-gray-200 bg-white/50 hover:bg-white"
                           >
                              <ChevronLeft className="h-4 w-4 mr-2" /> Prev
                           </Button>
                           <Button 
                              variant="outline" 
                              onClick={goToNext} 
                              disabled={!hasNext}
                              className="flex-1 sm:flex-none rounded-xl font-bold border-gray-200 bg-white/50 hover:bg-white"
                           >
                              Next <ChevronRight className="h-4 w-4 ml-2" />
                           </Button>
                        </div>

                        {!currentLesson?.progress?.completed && currentLesson?.lesson_type !== 'quiz' && (
                           <Button 
                              onClick={() => handleMarkComplete()} 
                              disabled={markingComplete}
                              className="w-full sm:w-auto min-w-[180px] rounded-xl bg-gray-900 text-white hover:bg-primary font-black shadow-lg shadow-black/5 transaction-all active:scale-95"
                           >
                              {markingComplete ? "Updating..." : (
                                 <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Completed
                                 </>
                              )}
                           </Button>
                        )}
                         {currentLesson?.progress?.completed && (
                           <Button 
                              disabled
                              variant="secondary"
                              className="w-full sm:w-auto min-w-[180px] rounded-xl bg-green-100 text-green-700 font-black opacity-100 disabled:opacity-100 border border-green-200 shadow-sm"
                           >
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Completed
                           </Button>
                         )}
                     </div>

                     {/* Lesson Details */}
                     <div className="flex flex-col gap-6">
                        <div className="space-y-3 px-2">
                           <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter leading-tight">
                              {currentLesson?.title}
                           </h2>
                           <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                              {currentLesson?.duration_minutes && (
                                 <span className="flex items-center bg-gray-100/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs border border-gray-200/50">
                                    <Clock className="w-3 h-3 mr-2" />
                                    {currentLesson.duration_minutes} min
                                 </span>
                              )}
                              <Badge variant="outline" className="capitalize font-bold text-[10px] bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-wider border-gray-200/50">
                                 {currentLesson?.lesson_type}
                              </Badge>
                           </div>
                        </div>

                        {/* Content Renderer */}
                         {currentLesson?.lesson_type === 'text' && currentLesson.content_md && (
                            <div className="prose prose-gray prose-lg max-w-none bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                               <ReactMarkdown>{currentLesson.content_md}</ReactMarkdown>
                            </div>
                         )}

 


                         {currentLesson?.lesson_type === 'assignment' && (
                            <AssignmentRenderer
                              lessonId={currentLesson.id}
                              title={currentLesson.title}
                              courseId={course.id}
                              userId={userId}
                              onComplete={() => {
                                handleMarkComplete(currentLesson.id, true);
                              }}
                            />
                         )}

                          {currentLesson?.lesson_type === 'quiz' && (
                            loadingQuiz ? (
                              <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-lg font-bold text-gray-600">Loading quiz...</p>
                              </div>
                            ) : quizData ? (
                              <QuizRenderer
                                quiz={quizData.quiz}
                                questions={quizData.questions}
                                userId={userId}
                                previousAttempts={quizAttempts}
                                onComplete={() => {
                                  handleMarkComplete(currentLesson.id, true);
                                }}
                                onNextLesson={goToNext}
                              />
                            ) : (
                              <div className="bg-amber-50/10 backdrop-blur-xl p-12 rounded-[2.5rem] border border-amber-200/50 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mb-6 text-amber-600 shadow-xl shadow-amber-500/10">
                                  <HelpCircle className="h-10 w-10 opacity-80" />
                                </div>
                                <h3 className="text-2xl font-black text-amber-900 mb-2 tracking-tight">Quiz Coming Soon</h3>
                                <p className="text-amber-800/60 max-w-md font-medium mb-8">
                                  This quiz is currently being prepared. Check back soon for new challenges!
                                </p>
                                <div className="flex gap-4">
                                  {hasPrevious && (
                                    <Button 
                                      variant="outline" 
                                      onClick={goToPrevious}
                                      className="rounded-xl font-bold border-amber-200 text-amber-900 hover:bg-amber-100/50"
                                    >
                                      <ChevronLeft className="h-4 w-4 mr-2" /> Back to Previous
                                    </Button>
                                  )}
                                  {hasNext && (
                                    <Button 
                                      onClick={goToNext}
                                      className="rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
                                    >
                                      Skip to Next <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                     </div>
                     
                     {/* Footer sections - Flex Layout with Sticky Right Sidebar */}
                     <div className="flex flex-col lg:flex-row items-start gap-8 pt-8 border-t border-gray-100/50 pb-20">
                         {/* Main Content Column - Instructor & FAQ */}
                         <div className="flex-1 space-y-6 min-w-0">
                           <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                              <h3 className="font-black text-lg mb-6 tracking-tight flex items-center gap-2">About the Instructor</h3>
                              <div className="flex items-center gap-5">
                                 <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-black/5 ring-1 ring-black/5">
                                    {course.profiles?.avatar_url ? (
                                      <img src={course.profiles.avatar_url} alt="Instructor" className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="font-black text-gray-400 text-xl">{course.profiles?.full_name?.charAt(0)}</span>
                                    )}
                                 </div>
                                 <div className="overflow-hidden">
                                    <p className="font-black text-gray-900 text-lg leading-tight truncate">{course.profiles?.full_name}</p>
                                    <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">Course Creator</p>
                                 </div>
                              </div>
                              <div className="mt-6 text-sm text-muted-foreground leading-relaxed font-medium prose prose-sm prose-gray max-w-none">
                                 <ReactMarkdown>
                                    {course.description || "No bio available."}
                                 </ReactMarkdown>
                              </div>
                           </div>
                           
                           {/* FAQ */}
                           <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                              <CourseFaqDisplay courseId={course.id} />
                           </div>
                         </div>
                         
                         {/* Sticky Right Sidebar - Rate this Course */}
                         <aside className="w-full lg:w-96 shrink-0">
                             <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 sticky top-24">
                                <h3 className="font-black text-lg mb-6 flex items-center gap-2 tracking-tight">
                                  <Star className="h-5 w-5 text-amber-400 fill-current" />
                                  Rate this Course
                                </h3>
                                
                                <ReviewForm courseId={course.id} userId={userId} existingReview={userReview} />
                             </div>

                             {/* Course Quizzes Card */}
                             {allLessons.some(l => l.lesson_type === 'quiz') && (
                               <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 mt-8">
                                 <h3 className="font-black text-lg mb-6 flex items-center gap-2 tracking-tight">
                                   <HelpCircle className="h-5 w-5 text-primary fill-current/20" />
                                   Course Quizzes
                                 </h3>
                                 
                                 <div className="space-y-4">
                                   {allLessons.filter(l => l.lesson_type === 'quiz').map((quizLesson) => {
                                      // Check if this quiz is completed
                                      const isCompleted = quizLesson.progress?.completed;
                                      
                                      return (
                                       <div key={quizLesson.id} className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                                         <div className="flex items-center justify-between mb-3">
                                           <div className="flex items-center gap-3">
                                              <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                isCompleted ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                                              )}>
                                                {isCompleted ? <Award className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
                                              </div>
                                              <div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{quizLesson.title}</h4>
                                                <p className="text-xs text-muted-foreground font-medium">Test your knowledge</p>
                                              </div>
                                           </div>
                                         </div>
                                         
                                         <Button 
                                           onClick={() => {
                                             setCurrentLesson(quizLesson);
                                             window.scrollTo({ top: 0, behavior: 'smooth' });
                                           }}
                                           variant={isCompleted ? "outline" : "default"}
                                           className={cn(
                                             "w-full rounded-xl font-bold h-10 shadow-lg transition-all",
                                             isCompleted 
                                               ? "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 shadow-green-500/5" 
                                               : "bg-gray-900 text-white hover:bg-primary shadow-gray-900/20 hover:shadow-primary/20"
                                           )}
                                         >
                                           {isCompleted ? "Retake Quiz" : "Start Quiz"}
                                         </Button>
                                       </div>
                                      );
                                   })}
                                 </div>
                               </div>
                             )}
                         </aside>
                     </div>
                 </div>
             </main>

             {/* Desktop Sticky Sidebar Playlist */}
             <aside className={cn(
                "hidden lg:block w-96 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2rem] overflow-hidden sticky top-24 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-[0_8px_30px_rgb(0,0,0,0.02)]",
                sidebarOpen ? "w-96 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-8 p-0 border-0"
             )}>
                <div className="max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                   {renderSyllabus(false)}
                </div>
             </aside>
          </div>
          
           {/* Completion Banner - Fixed Bottom */}
           {progress.progress_percent === 100 && (
               <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-full max-w-md px-4">
                  <div className="bg-gray-900 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4 pr-6 border border-white/10 ring-4 ring-black/5 backdrop-blur-md">
                     <div className="bg-green-500 rounded-2xl p-3 shrink-0 shadow-lg shadow-green-500/20">
                        <Award className="h-6 w-6 text-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="font-black text-base truncate">Course Completed!</p>
                        <p className="text-xs opacity-80 truncate font-medium">You&apos;ve earned your certificate.</p>
                     </div>
                     <Button size="sm" variant="secondary" asChild className="ml-2 rounded-xl whitespace-nowrap px-6 h-10 bg-white text-black hover:bg-gray-200 font-bold border-0 shadow-lg">
                        <Link href="/profile">View</Link>
                     </Button>
                  </div>
               </div>
           )}
       </div>
    </div>
  );
}

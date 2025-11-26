"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { VideoPlayer } from "./VideoPlayer";
import { ReviewForm } from "./ReviewForm";
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
  ChevronDown
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { markLessonComplete } from "@/server/actions/enrollment.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  
  const allLessons = sections.flatMap(s => s.lessons).sort((a, b) => a.order_index - b.order_index);
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const hasNext = currentIndex < allLessons.length - 1;
  const hasPrevious = currentIndex > 0;
  
  const getLessonIcon = (lesson: typeof currentLesson) => {
    if (!lesson) return <Circle className="h-4 w-4" />;
    
    if (lesson.progress?.completed) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    
    switch (lesson.lesson_type) {
      case 'video':
        return <VideoIcon className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      case 'assignment':
        return <Clipboard className="h-4 w-4" />;
      case 'lab':
        return <Code className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };
  
  const handleMarkComplete = async () => {
    if (!currentLesson || currentLesson.progress?.completed) return;
    
    setMarkingComplete(true);
    const result = await markLessonComplete(userId, currentLesson.id, course.id);
    
    if (result.success) {
      toast.success("Lesson marked as complete!");
      router.refresh();
      
      // Auto-advance to next lesson
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
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/student-dashboard">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground mt-1">
                by {course.profiles?.full_name || 'Unknown Instructor'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#FF6B35]">
                {progress.progress_percent}%
              </div>
              <p className="text-sm text-muted-foreground">
                {progress.completed_lessons} of {progress.total_lessons} completed
              </p>
            </div>
          </div>
          
          <Progress value={progress.progress_percent} className="mt-4 h-3" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Curriculum */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="w-full">
                  {sections.map((section) => (
                    <AccordionItem key={section.id} value={section.id} className="border-b last:border-0">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800">
                        <span className="text-sm font-semibold text-left">{section.title}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <div className="space-y-1">
                          {section.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => setCurrentLesson(lesson)}
                              className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                currentLesson?.id === lesson.id
                                  ? 'bg-[#FF6B35]/10 border-l-4 border-[#FF6B35]'
                                  : 'pl-4'
                              }`}
                            >
                              {getLessonIcon(lesson)}
                              <span className={`text-sm flex-1 ${
                                currentLesson?.id === lesson.id ? 'font-semibold text-[#FF6B35]' : ''
                              }`}>
                                {lesson.title}
                              </span>
                              {lesson.duration_minutes && (
                                <span className="text-xs text-muted-foreground">
                                  {lesson.duration_minutes}m
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {currentLesson ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {currentLesson.lesson_type}
                          </Badge>
                          {currentLesson.progress?.completed && (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Video Lesson */}
                    {currentLesson.lesson_type === 'video' && currentLesson.video_url && (
                      <VideoPlayer url={currentLesson.video_url} title={currentLesson.title} />
                    )}
                    
                    {/* Text/PDF Lesson */}
                    {currentLesson.lesson_type === 'text' && currentLesson.content_md && (
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{currentLesson.content_md}</ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Quiz Lesson */}
                    {currentLesson.lesson_type === 'quiz' && (
                      <div className="text-center py-12">
                        <HelpCircle className="h-16 w-16 mx-auto mb-4 text-[#FF6B35]" />
                        <h3 className="text-xl font-semibold mb-2">Quiz Coming Soon</h3>
                        <p className="text-muted-foreground">Interactive quiz functionality will be available here</p>
                      </div>
                    )}
                    
                    {/* Assignment Lesson */}
                    {currentLesson.lesson_type === 'assignment' && (
                      <div className="text-center py-12">
                        <Clipboard className="h-16 w-16 mx-auto mb-4 text-[#FF6B35]" />
                        <h3 className="text-xl font-semibold mb-2">Assignment Submission</h3>
                        <p className="text-muted-foreground mb-4">
                          Assignment submission interface will be available here
                        </p>
                        {currentLesson.content_md && (
                          <div className="prose dark:prose-invert max-w-none text-left mt-6">
                            <ReactMarkdown>{currentLesson.content_md}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Lab Lesson */}
                    {currentLesson.lesson_type === 'lab' && (
                      <div className="text-center py-12">
                        <Code className="h-16 w-16 mx-auto mb-4 text-[#FF6B35]" />
                        <h3 className="text-xl font-semibold mb-2">Interactive Lab</h3>
                        <p className="text-muted-foreground mb-4">
                          Navigate to the Labs section to access this hands-on exercise
                        </p>
                        <Button asChild>
                          <Link href={`/learn/${course.id}/labs`}>
                            Go to Labs
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Navigation Buttons */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={goToPrevious}
                        disabled={!hasPrevious}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      
                      {!currentLesson.progress?.completed && currentLesson.lesson_type !== 'quiz' && (
                        <Button
                          onClick={handleMarkComplete}
                          disabled={markingComplete}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {markingComplete ? (
                            "Marking..."
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Complete
                            </>
                          )}
                        </Button>
                      )}
                      
                      <Button
                        onClick={goToNext}
                        disabled={!hasNext}
                        className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D]"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Review Section */}
                <Card>
                  <Collapsible open={reviewOpen} onOpenChange={setReviewOpen}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            <CardTitle className="text-lg">
                              {userReview ? 'Update Your Review' : 'Rate This Course'}
                            </CardTitle>
                          </div>
                          <ChevronDown className={`h-5 w-5 transition-transform ${reviewOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {userReview && (
                          <p className="text-sm text-muted-foreground mt-1">
                            You rated this course {userReview.rating} stars
                          </p>
                        )}
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <ReviewForm
                          courseId={course.id}
                          userId={userId}
                          existingReview={userReview}
                        />
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No lesson selected</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

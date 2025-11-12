import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  type: string;
  order_index: number;
  quiz_options: QuizOption[];
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score_percent: number;
  started_at: string;
  submitted_at: string;
  profiles: Profile;
}

export default async function QuizDetailPage({ 
  params 
}: { 
  params: Promise<{ courseId: string; quizId: string }> 
}) {
  const supabase = await createServerClient();
  
  // Unwrap params
  const { courseId, quizId } = await params;
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Fetch quiz details
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();
  
  if (quizError || !quiz) {
    return <div>Quiz not found</div>;
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
  
  // Fetch questions for this quiz
  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select(`
      *,
      quiz_options (*)
    `)
    .eq('quiz_id', quizId)
    .order('order_index');
  
  // Fetch attempts for this quiz
  const { data: attempts, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select(`
      *,
      profiles (full_name, email)
    `)
    .eq('quiz_id', quizId)
    .order('submitted_at', { ascending: false });
  
  // Calculate average score
  const averageScore = attempts && attempts.length > 0 
    ? attempts.reduce((sum, attempt) => sum + (attempt.score_percent || 0), 0) / attempts.length 
    : 0;
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            <p className="text-muted-foreground">Quiz in {course.title}</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href={`/instructor/courses/${courseId}/quizzes`}>Back to Quizzes</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Questions</CardTitle>
                <CardDescription>Manage your quiz questions and answers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Button>Add Question</Button>
                </div>
                
                {questions && questions.length > 0 ? (
                  <div className="space-y-6">
                    {questions.map((question: QuizQuestion, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">Question {index + 1}</h3>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                        <p className="mt-2 text-muted-foreground">{question.question}</p>
                        
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">Options:</h4>
                          <div className="space-y-2">
                            {question.quiz_options?.map((option: QuizOption) => (
                              <div 
                                key={option.id} 
                                className={`flex items-center p-2 rounded ${option.is_correct ? 'bg-green-100' : 'bg-gray-100'}`}
                              >
                                <span className="mr-2">{option.option_text}</span>
                                {option.is_correct && (
                                  <span className="inline-flex items-center rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No questions added yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Total Attempts</h3>
                    <p className="text-2xl font-bold">{attempts?.length || 0}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Average Score</h3>
                    <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Pass Rate</h3>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: attempts && attempts.length > 0 
                              ? `${(attempts.filter(a => (a.score_percent || 0) >= 60).length / attempts.length) * 100}%` 
                              : '0%' 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>
                          {attempts ? attempts.filter(a => (a.score_percent || 0) >= 60).length : 0} passed
                        </span>
                        <span>
                          {attempts ? attempts.filter(a => (a.score_percent || 0) < 60).length : 0} failed
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Recent Attempts</h3>
                    {attempts && attempts.length > 0 ? (
                      <div className="mt-2 space-y-3">
                        {attempts.slice(0, 3).map((attempt: QuizAttempt) => (
                          <div key={attempt.id} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium">{attempt.profiles?.full_name || 'Unknown Student'}</p>
                              <p className="text-muted-foreground">
                                {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'Not submitted'}
                              </p>
                            </div>
                            <div>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                (attempt.score_percent || 0) >= 60 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {attempt.score_percent || 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-2">No attempts yet.</p>
                    )}
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
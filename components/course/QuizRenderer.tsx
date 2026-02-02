"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { 
  startQuizAttempt, 
  submitQuizAttempt,
  type Quiz,
  type QuizQuestion,
  type QuizAttempt
} from "@/server/actions/quiz.actions";
import { cn } from "@/lib/utils";

interface QuizRendererProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  userId: string;
  previousAttempts: QuizAttempt[];
  onComplete?: () => void;
  onNextLesson?: () => void;
}

export function QuizRenderer({ 
  quiz, 
  questions, 
  userId, 
  previousAttempts,
  onComplete,
  onNextLesson
}: QuizRendererProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<QuizAttempt | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(quiz.time_limit_minutes * 60);
  const [hasStarted, setHasStarted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const canAttempt = quiz.max_attempts === 0 || previousAttempts.length < quiz.max_attempts;
  const bestAttempt = previousAttempts.length > 0 
    ? previousAttempts.reduce((best, current) => 
        (current.score || 0) > (best.score || 0) ? current : best
      )
    : null;

  // Timer effect
  useEffect(() => {
    if (!hasStarted || showResults || quiz.time_limit_minutes === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, showResults, quiz.time_limit_minutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = async () => {
    const result = await startQuizAttempt(quiz.id, userId);
    
    if (result.success && result.data) {
      setAttemptId(result.data.id);
      setHasStarted(true);
      setStartTime(Date.now());
      toast.success("Quiz started! Good luck!");
    } else {
      toast.error(result.error || "Failed to start quiz");
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: Array.isArray(value) ? value : [value]
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    const result = await submitQuizAttempt(attemptId, answers, quiz.id, timeTaken);

    if (result.success && result.data) {
      setResults(result.data);
      setShowResults(true);
      
      if (result.data.passed) {
        toast.success(`Congratulations! You passed with ${result.data.score.toFixed(1)}%`);
        onComplete?.();
      } else {
        toast.error(`You scored ${result.data.score.toFixed(1)}%. Keep trying!`);
      }
    } else {
      toast.error(result.error || "Failed to submit quiz");
    }

    setIsSubmitting(false);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setResults(null);
    setHasStarted(false);
    setAttemptId(null);
    setTimeRemaining(quiz.time_limit_minutes * 60);
  };

  // Not started view
  if (!hasStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-10 pb-6 border-b border-gray-100/50">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <CardTitle className="text-3xl font-black tracking-tight">{quiz.title}</CardTitle>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {totalQuestions} Questions • {quiz.passing_score}% to Pass
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary border-0 px-4 py-2 text-xs font-black uppercase tracking-widest">
                Quiz
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-10 space-y-8">
            {/* Quiz Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50/50 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black text-blue-600 mb-2">{totalQuestions}</div>
                <div className="text-xs font-black text-blue-600/60 uppercase tracking-widest">Questions</div>
              </div>
              
              {quiz.time_limit_minutes > 0 && (
                <div className="bg-orange-50/50 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-orange-600 mb-2">{quiz.time_limit_minutes}</div>
                  <div className="text-xs font-black text-orange-600/60 uppercase tracking-widest">Minutes</div>
                </div>
              )}
              
              <div className="bg-green-50/50 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black text-green-600 mb-2">{quiz.passing_score}%</div>
                <div className="text-xs font-black text-green-600/60 uppercase tracking-widest">Passing Score</div>
              </div>
            </div>

            {/* Previous Attempts */}
            {previousAttempts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black tracking-tight">Your Previous Attempts</h3>
                <div className="space-y-3">
                  {previousAttempts.slice(0, 3).map((attempt, idx) => (
                    <div 
                      key={attempt.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                    >
                      <div className="flex items-center gap-4">
                        {attempt.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            Attempt {previousAttempts.length - idx}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {new Date(attempt.started_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900">{attempt.score?.toFixed(1)}%</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Score */}
            {bestAttempt && (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Trophy className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Best Score</p>
                    <p className="text-2xl font-black text-gray-900">{bestAttempt.score?.toFixed(1)}%</p>
                  </div>
                </div>
                
                {quiz.show_correct_answers && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setResults(bestAttempt);
                      setShowResults(true);
                    }}
                    className="rounded-xl font-bold bg-white hover:bg-gray-50 text-gray-700 h-11 px-6 border-gray-200"
                  >
                    View Answers
                  </Button>
                )}
              </div>
            )}

            {/* Attempts Warning */}
            {quiz.max_attempts > 0 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-900">
                    {canAttempt 
                      ? `You have ${quiz.max_attempts - previousAttempts.length} attempt${quiz.max_attempts - previousAttempts.length === 1 ? '' : 's'} remaining`
                      : 'You have used all your attempts for this quiz'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Start Button */}
            <Button
              onClick={handleStartQuiz}
              disabled={!canAttempt}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all"
            >
              {previousAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  if (showResults && results) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-10 space-y-8">
            {/* Score Display */}
            <div className="text-center space-y-6">
              <div className={cn(
                "w-32 h-32 rounded-full mx-auto flex items-center justify-center",
                results.passed 
                  ? "bg-green-50 text-green-600" 
                  : "bg-red-50 text-red-600"
              )}>
                {results.passed ? (
                  <Trophy className="h-16 w-16" />
                ) : (
                  <XCircle className="h-16 w-16" />
                )}
              </div>

              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">
                  {results.passed ? 'Congratulations!' : 'Keep Trying!'}
                </h2>
                <p className="text-lg font-medium text-muted-foreground">
                  You scored <span className="font-black text-gray-900">{results.score.toFixed(1)}%</span>
                </p>
              </div>

              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{results.score.toFixed(1)}%</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Score</p>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{quiz.passing_score}%</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Required</p>
                </div>
                {results.time_taken_seconds && (
                  <>
                    <div className="h-12 w-px bg-gray-200" />
                    <div className="text-center">
                      <p className="text-2xl font-black text-gray-900">{formatTime(results.time_taken_seconds)}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Time Taken</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Review Answers (if enabled) */}
            {quiz.show_correct_answers && (
              <div className="space-y-4">
                <h3 className="text-xl font-black tracking-tight">Review Your Answers</h3>
                <div className="space-y-4">
                  {questions.map((question, idx) => {
                    const studentAnswer = results.answers[question.id] || [];
                    const isCorrect = 
                      studentAnswer.length === question.correct_answers.length &&
                      studentAnswer.every(ans => question.correct_answers.includes(ans));

                    return (
                      <div 
                        key={question.id}
                        className={cn(
                          "p-6 rounded-2xl border-2",
                          isCorrect 
                            ? "bg-green-50/50 border-green-200" 
                            : "bg-red-50/50 border-red-200"
                        )}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-black text-gray-900 mb-2">
                              Question {idx + 1}
                            </p>
                            <p className="text-base font-medium text-gray-700">
                              {question.question_text}
                            </p>
                          </div>
                        </div>

                        <div className="ml-9 space-y-2">
                          <div>
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                              Your Answer:
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {studentAnswer.length > 0 ? studentAnswer.join(', ') : 'No answer'}
                            </p>
                          </div>

                          {!isCorrect && (
                            <div>
                              <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">
                                Correct Answer:
                              </p>
                              <p className="text-sm font-medium text-green-700">
                                {question.correct_answers.join(', ')}
                              </p>
                            </div>
                          )}

                          {question.explanation && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                                Explanation:
                              </p>
                              <p className="text-sm font-medium text-gray-600">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {canAttempt && !results.passed && (
                <Button
                  onClick={handleRetry}
                  className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Try Again
                </Button>
              )}
              {results.passed && onNextLesson && (
                <Button
                  onClick={onNextLesson}
                  className="flex-1 h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black shadow-xl shadow-black/10"
                >
                  Go to Next Lesson
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Timer and Progress */}
      <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Progress</p>
            <p className="text-2xl font-black tracking-tight">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          {quiz.time_limit_minutes > 0 && (
            <div className="flex items-center gap-3 px-6 py-3 bg-orange-50 rounded-2xl">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs font-black text-orange-600/60 uppercase tracking-widest">Time Left</p>
                <p className="text-lg font-black text-orange-600">{formatTime(timeRemaining)}</p>
              </div>
            </div>
          )}
        </div>

        <Progress 
          value={(answeredCount / totalQuestions) * 100} 
          className="h-2 mt-6"
        />
      </Card>

      {/* Question Card */}
      <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 pb-6 border-b border-gray-100/50">
          <div className="flex items-start justify-between gap-6">
            <CardTitle className="text-2xl font-black tracking-tight flex-1">
              {currentQuestion.question_text}
            </CardTitle>
            <Badge className="bg-gray-100 text-gray-600 border-0 px-4 py-2 text-xs font-black uppercase tracking-widest">
              {currentQuestion.question_type === 'multiple' ? 'Multiple Choice' : 'Single Choice'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-10 space-y-6">
          {/* Options */}
          {currentQuestion.question_type === 'single' ? (
            <RadioGroup
              value={answers[currentQuestion.id]?.[0] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center space-x-4 p-5 rounded-2xl border-2 transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                      answers[currentQuestion.id]?.[0] === option
                        ? "border-primary bg-primary/10"
                        : "border-gray-100 bg-white"
                    )}
                  >
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label 
                      htmlFor={`option-${idx}`} 
                      className="flex-1 text-base font-medium cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center space-x-4 p-5 rounded-2xl border-2 transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                    answers[currentQuestion.id]?.includes(option)
                      ? "border-primary bg-primary/10"
                      : "border-gray-100 bg-white"
                  )}
                >
                  <Checkbox
                    id={`option-${idx}`}
                    checked={answers[currentQuestion.id]?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const current = answers[currentQuestion.id] || [];
                      if (checked) {
                        handleAnswerChange(currentQuestion.id, [...current, option]);
                      } else {
                        handleAnswerChange(currentQuestion.id, current.filter(a => a !== option));
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`option-${idx}`} 
                    className="flex-1 text-base font-medium cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="rounded-2xl h-12 px-6 font-black"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount < totalQuestions}
                className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black shadow-xl shadow-primary/20"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                <CheckCircle2 className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="rounded-2xl h-12 px-6 font-black"
              >
                Next
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Answer Status */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={cn(
                  "w-10 h-10 rounded-xl font-black text-sm transition-all",
                  idx === currentQuestionIndex
                    ? "bg-primary text-white scale-110"
                    : answers[questions[idx].id]
                    ? "bg-green-100 text-green-600 hover:bg-green-200"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  createQuiz, 
  addQuizQuestions, 
  getCourseQuizzes,
  getQuizWithQuestions,
  updateQuiz,
  deleteQuiz
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { useQuizStore, type QuizQuestion, type Quiz } from "@/hooks/useQuizStore";
import { PlusCircle, Edit, Trash2, Plus, X, Settings, Loader2 } from "lucide-react";

interface QuizManagerProps {
  courseId: string;
}

export const QuizManager = ({ courseId }: QuizManagerProps) => {
  const { quizzes, setQuizzes, setQuizzesLoading, quizzesLoading } = useInstructorStore();
  const {
    currentQuiz,
    questions,
    currentQuestion,
    editingQuestionIndex,
    isQuizDialogOpen,
    isQuestionDialogOpen,
    isSettingsDialogOpen,
    setCurrentQuiz,
    setQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    setCurrentQuestion,
    setEditingQuestionIndex,
    setIsQuizDialogOpen,
    setIsQuestionDialogOpen,
    setIsSettingsDialogOpen,
    resetQuizForm,
    resetQuestionForm,
  } = useQuizStore();

  const [quizFormData, setQuizFormData] = useState({
    title: "",
    passing_score: 70,
    max_attempts: 0,
    time_limit_minutes: 0,
    randomize_questions: false,
    show_correct_answers: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Record<string, number>>({});

  // Fetch quizzes and their question counts
  useEffect(() => {
    const fetchQuizzes = async () => {
      setQuizzesLoading(true);
      const result = await getCourseQuizzes(courseId);
      if (result.success && result.data) {
        setQuizzes(result.data);
        
        // Fetch question count for each quiz
        const counts: Record<string, number> = {};
        await Promise.all(
          result.data.map(async (quiz) => {
            const quizResult = await getQuizWithQuestions(quiz.id);
            if (quizResult.success && quizResult.data?.questions) {
              counts[quiz.id] = quizResult.data.questions.length;
            } else {
              counts[quiz.id] = 0;
            }
          })
        );
        setQuizQuestions(counts);
      }
      setQuizzesLoading(false);
    };

    fetchQuizzes();
  }, [courseId, setQuizzes, setQuizzesLoading]);

  // Initialize question form
  useEffect(() => {
    if (!currentQuestion) {
      resetQuestionForm();
    }
  }, [currentQuestion, resetQuestionForm]);

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quizFormData.title.trim()) {
      toast.error("Quiz title is required");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a placeholder lesson for the quiz
      const lessonId = courseId; // Temporary - should create proper lesson
      
      const quizResult = await createQuiz({
        lesson_id: lessonId,
        title: quizFormData.title,
        passing_score: quizFormData.passing_score,
        max_attempts: quizFormData.max_attempts || undefined,
        time_limit_minutes: quizFormData.time_limit_minutes || undefined,
        randomize_questions: quizFormData.randomize_questions,
        show_correct_answers: quizFormData.show_correct_answers,
      });

      if (!quizResult.success || !quizResult.data) {
        toast.error(quizResult.error || "Failed to create quiz");
        setIsSubmitting(false);
        return;
      }

      // Add questions with options
      const questionsData = questions.map((q) => ({
        question: q.question,
        type: q.type,
        order_index: q.order_index,
        quiz_options: q.quiz_options || [],
      }));

      const questionsResult = await addQuizQuestions(
        quizResult.data.id,
        questionsData
      );

      if (questionsResult.success) {
        toast.success("Quiz created successfully!");
        const updatedQuizzes = await getCourseQuizzes(courseId);
        if (updatedQuizzes.success && updatedQuizzes.data) {
          setQuizzes(updatedQuizzes.data);
        }
        resetQuizForm();
        setQuizFormData({
          title: "",
          passing_score: 70,
          max_attempts: 0,
          time_limit_minutes: 0,
          randomize_questions: false,
          show_correct_answers: true,
        });
        setIsQuizDialogOpen(false);
      } else {
        toast.error(questionsResult.error || "Failed to add questions");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOrUpdateQuestion = () => {
    if (!currentQuestion) return;

    if (!currentQuestion.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (!currentQuestion.quiz_options || currentQuestion.quiz_options.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    const hasCorrectAnswer = currentQuestion.quiz_options.some(opt => opt.is_correct);
    if (!hasCorrectAnswer) {
      toast.error("Please select at least one correct answer");
      return;
    }

    if (editingQuestionIndex !== null) {
      updateQuestion(editingQuestionIndex, currentQuestion);
      toast.success("Question updated!");
    } else {
      addQuestion(currentQuestion);
      toast.success("Question added!");
    }
    
    resetQuestionForm();
    setIsQuestionDialogOpen(false);
  };

  const handleEditQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
    setIsQuestionDialogOpen(true);
  };

  const addOption = () => {
    if (!currentQuestion) return;
    const newOptions = [
      ...(currentQuestion.quiz_options || []),
      { option_text: "", is_correct: false },
    ];
    setCurrentQuestion({ ...currentQuestion, quiz_options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    if (!currentQuestion?.quiz_options) return;
    const newOptions = [...currentQuestion.quiz_options];
    newOptions[index] = { ...newOptions[index], option_text: value };
    setCurrentQuestion({ ...currentQuestion, quiz_options: newOptions });
  };

  const removeOption = (index: number) => {
    if (!currentQuestion?.quiz_options || currentQuestion.quiz_options.length <= 2) {
      toast.error("At least 2 options are required");
      return;
    }
    const newOptions = currentQuestion.quiz_options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, quiz_options: newOptions });
  };

  const toggleCorrectAnswer = (index: number) => {
    if (!currentQuestion?.quiz_options) return;
    
    const newOptions = [...currentQuestion.quiz_options];
    
    if (currentQuestion.type === 'multiple_choice') {
      newOptions[index] = { ...newOptions[index], is_correct: !newOptions[index].is_correct };
    } else {
      // For single choice and true/false, only one can be correct
      newOptions.forEach((opt, i) => {
        newOptions[i] = { ...opt, is_correct: i === index };
      });
    }
    
    setCurrentQuestion({ ...currentQuestion, quiz_options: newOptions });
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    const result = await deleteQuiz(quizId);
    if (result.success) {
      toast.success("Quiz deleted successfully!");
      const updatedQuizzes = await getCourseQuizzes(courseId);
      if (updatedQuizzes.success && updatedQuizzes.data) {
        setQuizzes(updatedQuizzes.data);
      }
    } else {
      toast.error(result.error || "Failed to delete quiz");
    }
  };

  const openQuizSettings = async (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setQuizFormData({
      title: quiz.title,
      passing_score: quiz.passing_score || 70,
      max_attempts: quiz.max_attempts || 0,
      time_limit_minutes: quiz.time_limit_minutes || 0,
      randomize_questions: quiz.randomize_questions || false,
      show_correct_answers: quiz.show_correct_answers !== false,
    });
    setIsSettingsDialogOpen(true);
  };

  const handleQuizSettingsUpdate = async () => {
    if (!currentQuiz) return;

    setIsSubmitting(true);
    try {
      const result = await updateQuiz(currentQuiz.id, {
        title: quizFormData.title,
        passing_score: quizFormData.passing_score,
        max_attempts: quizFormData.max_attempts || undefined,
        time_limit_minutes: quizFormData.time_limit_minutes || undefined,
        randomize_questions: quizFormData.randomize_questions,
        show_correct_answers: quizFormData.show_correct_answers,
      });

      if (result.success) {
        toast.success("Quiz settings updated!");
        const updatedQuizzes = await getCourseQuizzes(courseId);
        if (updatedQuizzes.success && updatedQuizzes.data) {
          setQuizzes(updatedQuizzes.data);
        }
        setIsSettingsDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to update quiz");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditQuestions = async (quizId: string) => {
    const quizResult = await getQuizWithQuestions(quizId);
    if (quizResult.success && quizResult.data) {
      setQuestions(quizResult.data.questions || []);
      const quiz = quizzes.find(q => q.id === quizId);
      if (quiz) {
        setCurrentQuiz(quiz);
        setQuizFormData({
          title: quiz.title,
          passing_score: quiz.passing_score || 70,
          max_attempts: quiz.max_attempts || 0,
          time_limit_minutes: quiz.time_limit_minutes || 0,
          randomize_questions: quiz.randomize_questions || false,
          show_correct_answers: quiz.show_correct_answers !== false,
        });
      }
      setIsQuizDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Quizzes</h2>
          <p className="text-muted-foreground">Create and manage quizzes for your course</p>
        </div>
        <Dialog open={isQuizDialogOpen} onOpenChange={(open) => {
          setIsQuizDialogOpen(open);
          if (!open) {
            resetQuizForm();
            setQuizFormData({
              title: "",
              passing_score: 70,
              max_attempts: 0,
              time_limit_minutes: 0,
              randomize_questions: false,
              show_correct_answers: true,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetQuizForm();
              setQuizFormData({
                title: "",
                passing_score: 70,
                max_attempts: 0,
                time_limit_minutes: 0,
                randomize_questions: false,
                show_correct_answers: true,
              });
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>
                Build a quiz with multiple questions for your students
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleQuizSubmit} className="space-y-6">
              {/* Quiz Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">Quiz Title *</Label>
                  <Input
                    id="title"
                    value={quizFormData.title}
                    onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                    placeholder="Enter quiz title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passing_score">Passing Score (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={quizFormData.passing_score}
                    onChange={(e) => setQuizFormData({ ...quizFormData, passing_score: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attempts">Max Attempts (0 = unlimited)</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    min="0"
                    value={quizFormData.max_attempts}
                    onChange={(e) => {
                      const value = e.target.value;
                      setQuizFormData({ ...quizFormData, max_attempts: value === "" ? 0 : Number(value) });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_limit">Time Limit (minutes, 0 = none)</Label>
                  <Input
                    id="time_limit"
                    type="number"
                    min="0"
                    value={quizFormData.time_limit_minutes}
                    onChange={(e) => {
                      const value = e.target.value;
                      setQuizFormData({ ...quizFormData, time_limit_minutes: value === "" ? 0 : Number(value) });
                    })
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="randomize"
                      checked={quizFormData.randomize_questions}
                      onCheckedChange={(checked) => 
                        setQuizFormData({ ...quizFormData, randomize_questions: !!checked })
                      }
                    />
                    <Label htmlFor="randomize" className="cursor-pointer">
                      Randomize question order
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show_answers"
                      checked={quizFormData.show_correct_answers}
                      onCheckedChange={(checked) => 
                        setQuizFormData({ ...quizFormData, show_correct_answers: !!checked })
                      }
                    />
                    <Label htmlFor="show_answers" className="cursor-pointer">
                      Show correct answers after completion
                    </Label>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Questions ({questions.length})</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      resetQuestionForm();
                      setIsQuestionDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                {questions.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No questions added yet. Click &quot;Add Question&quot; to create questions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{index + 1}. {q.question}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">
                                  {q.type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline">
                                  {q.quiz_options?.length || 0} options
                                </Badge>
                                <Badge variant="outline">
                                  {q.quiz_options?.filter(o => o.is_correct).length || 0} correct
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditQuestion(index)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteQuestion(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQuizDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || questions.length === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Quiz"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Question Dialog */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestionIndex !== null ? "Edit Question" : "Add Question"}
              </DialogTitle>
            </DialogHeader>

            {currentQuestion && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question_text">Question *</Label>
                  <Input
                    id="question_text"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({ 
                      ...currentQuestion, 
                      question: e.target.value 
                    })}
                    placeholder="Enter your question"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question_type">Question Type</Label>
                  <Select
                    value={currentQuestion.type}
                    onValueChange={(value: QuizQuestion['type']) => 
                      setCurrentQuestion({ 
                        ...currentQuestion, 
                        type: value,
                        quiz_options: value === 'true_false' 
                          ? [
                              { option_text: "True", is_correct: false },
                              { option_text: "False", is_correct: false },
                            ]
                          : currentQuestion.quiz_options
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_choice">Single Choice</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    {currentQuestion.type !== 'true_false' && (
                      <Button type="button" size="sm" variant="ghost" onClick={addOption}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {currentQuestion.quiz_options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type={currentQuestion.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                          name="correct"
                          checked={option.is_correct}
                          onChange={() => toggleCorrectAnswer(index)}
                          className="cursor-pointer"
                        />
                        <Input
                          value={option.option_text}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          disabled={currentQuestion.type === 'true_false'}
                        />
                        {currentQuestion.type !== 'true_false' && currentQuestion.quiz_options!.length > 2 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOption(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.type === 'multiple_choice' 
                      ? 'Check all correct answers' 
                      : 'Select the correct answer'}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddOrUpdateQuestion}>
                {editingQuestionIndex !== null ? "Update Question" : "Add Question"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quiz Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Quiz Settings</DialogTitle>
              <DialogDescription>
                Manage quiz settings and configurations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings_title">Quiz Title</Label>
                <Input
                  id="settings_title"
                  value={quizFormData.title}
                  onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings_passing_score">Passing Score (%)</Label>
                <Input
                  id="settings_passing_score"
                  type="number"
                  min="0"
                  max="100"
                  value={quizFormData.passing_score}
                  onChange={(e) => setQuizFormData({ ...quizFormData, passing_score: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings_max_attempts">Max Attempts (0 = unlimited)</Label>
                <Input
                  id="settings_max_attempts"
                  type="number"
                  min="0"
                  value={quizFormData.max_attempts}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuizFormData({ ...quizFormData, max_attempts: value === "" ? 0 : Number(value) });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings_time_limit">Time Limit (minutes, 0 = none)</Label>
                <Input
                  id="settings_time_limit"
                  type="number"
                  min="0"
                  value={quizFormData.time_limit_minutes}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuizFormData({ ...quizFormData, time_limit_minutes: value === "" ? 0 : Number(value) });
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="settings_randomize"
                    checked={quizFormData.randomize_questions}
                    onCheckedChange={(checked) => 
                      setQuizFormData({ ...quizFormData, randomize_questions: !!checked })
                    }
                  />
                  <Label htmlFor="settings_randomize" className="cursor-pointer">
                    Randomize question order
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="settings_show_answers"
                    checked={quizFormData.show_correct_answers}
                    onCheckedChange={(checked) => 
                      setQuizFormData({ ...quizFormData, show_correct_answers: !!checked })
                    }
                  />
                  <Label htmlFor="settings_show_answers" className="cursor-pointer">
                    Show correct answers after completion
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleQuizSettingsUpdate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz List */}
      {quizzesLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading quizzes...</p>
          </CardContent>
        </Card>
      ) : quizzes.length === 0 ? (
        <Alert>
          <AlertDescription>
            No quizzes yet. Click &quot;Create Quiz&quot; to add your first quiz.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {quizQuestions[quiz.id] || 0} Questions
                      </Badge>
                      <Badge variant="outline">Pass: {quiz.passing_score || 70}%</Badge>
                      <Badge variant="outline">
                        {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "No time limit"}
                      </Badge>
                      {quiz.randomize_questions && (
                        <Badge variant="outline">Randomized</Badge>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditQuestions(quiz.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openQuizSettings(quiz)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

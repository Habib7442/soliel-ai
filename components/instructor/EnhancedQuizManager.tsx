"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  addQuizQuestion,
  getCourseQuizzes,
  getQuizWithQuestions,
  updateQuiz,
  updateQuizQuestion,
  deleteQuiz,
  addLesson
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { PlusCircle, Edit, Trash2, Plus, X, Settings } from "lucide-react";

interface QuizManagerProps {
  courseId: string;
}

interface QuizQuestion {
  id?: string;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false';
  options: string[];
  correct_answers: number[];
  explanation?: string;
  order_index: number;
}

// Define types that match what's actually returned from the server
interface QuizFromServer {
  id: string;
  lesson_id: string;
  title: string;
  passing_score?: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  randomize_questions?: boolean;
  show_correct_answers?: boolean;
  created_at: string;
  updated_at: string;
  lessons?: {
    course_id: string;
  };
  questions?: QuizQuestion[];
}

type Quiz = QuizFromServer;

export const EnhancedQuizManager = ({ courseId }: QuizManagerProps) => {
  const { quizzes, setQuizzes, setQuizzesLoading, quizzesLoading } = useInstructorStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizFormData, setQuizFormData] = useState<{
    title: string;
    passing_score: string;
    max_attempts: string;
    time_limit_minutes: string;
    randomize_questions: boolean;
    show_correct_answers: boolean;
  }>({
    title: "",
    passing_score: "70",
    max_attempts: "0", // 0 means unlimited
    time_limit_minutes: "0", // 0 means no time limit
    randomize_questions: false,
    show_correct_answers: true,
  });

  // Track if the form has been touched to handle empty inputs correctly
  const [formTouched, setFormTouched] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<Record<string, QuizQuestion[]>>({});
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    question_text: "",
    question_type: "single_choice",
    options: ["", ""],
    correct_answers: [],
    explanation: "",
    order_index: 0,
  });
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingSingleQuestion, setEditingSingleQuestion] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setQuizzesLoading(true);
      const result = await getCourseQuizzes(courseId);
      if (result.success && result.data) {
        setQuizzes(result.data);
        // Fetch questions for each quiz
        const questionsPromises = result.data.map(async (quiz) => {
          const quizResult = await getQuizWithQuestions(quiz.id);
          if (quizResult.success && quizResult.data) {
            return { quizId: quiz.id, questions: quizResult.data.questions || [] };
          }
          return { quizId: quiz.id, questions: [] };
        });
        
        const questionsResults = await Promise.all(questionsPromises);
        const questionsMap = questionsResults.reduce((acc, { quizId, questions }) => {
          acc[quizId] = questions;
          return acc;
        }, {} as Record<string, QuizQuestion[]>);
        
        setQuizQuestions(questionsMap);
      }
      setQuizzesLoading(false);
    };

    fetchQuizzes();
  }, [courseId, setQuizzes, setQuizzesLoading]);

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

    try {
      // First, create a quiz lesson
      const lessonResult = await addLesson({
        course_id: courseId,
        title: quizFormData.title,
        lesson_type: 'quiz',
      });

      if (!lessonResult.success || !lessonResult.data) {
        toast.error(lessonResult.error || "Failed to create quiz lesson");
        return;
      }

      // Then, create the quiz using the lesson ID
      const quizResult = await createQuiz({
        lesson_id: lessonResult.data.id,
        title: quizFormData.title,
        passing_score: quizFormData.passing_score ? parseInt(quizFormData.passing_score) : undefined,
        max_attempts: quizFormData.max_attempts ? parseInt(quizFormData.max_attempts) : undefined,
        time_limit_minutes: quizFormData.time_limit_minutes ? parseInt(quizFormData.time_limit_minutes) : undefined,
        randomize_questions: quizFormData.randomize_questions,
        show_correct_answers: quizFormData.show_correct_answers,
      });

      if (!quizResult.success || !quizResult.data) {
        toast.error(quizResult.error || "Failed to create quiz");
        return;
      }

      // Add questions
      const questionsResult = await addQuizQuestions(
        quizResult.data.id,
        questions.map((q: QuizQuestion, index: number) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answers: q.correct_answers,
          explanation: q.explanation,
          order_index: index
        }))
      );

      if (questionsResult.success) {
        toast.success("Quiz created successfully!");
        const updatedQuizzes = await getCourseQuizzes(courseId);
        if (updatedQuizzes.success && updatedQuizzes.data) {
          setQuizzes(updatedQuizzes.data);
        }
        resetQuizForm();
        setIsDialogOpen(false);
      } else {
        toast.error(questionsResult.error || "Failed to add questions");
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleQuizUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quizFormData.title.trim()) {
      toast.error("Quiz title is required");
      return;
    }

    if (!selectedQuiz) {
      toast.error("No quiz selected");
      return;
    }

    try {
      // Update quiz settings
      const quizResult = await updateQuiz(selectedQuiz.id, {
        title: quizFormData.title,
        passing_score: quizFormData.passing_score ? parseInt(quizFormData.passing_score) : undefined,
        max_attempts: quizFormData.max_attempts ? parseInt(quizFormData.max_attempts) : undefined,
        time_limit_minutes: quizFormData.time_limit_minutes ? parseInt(quizFormData.time_limit_minutes) : undefined,
        randomize_questions: quizFormData.randomize_questions,
        show_correct_answers: quizFormData.show_correct_answers,
      });

      if (!quizResult.success) {
        toast.error(quizResult.error || "Failed to update quiz");
        return;
      }

      toast.success("Quiz updated successfully!");
      const updatedQuizzes = await getCourseQuizzes(courseId);
      if (updatedQuizzes.success && updatedQuizzes.data) {
        setQuizzes(updatedQuizzes.data);
      }
      setIsSettingsDialogOpen(false);
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (currentQuestion.options.length < 2) {
      toast.error("At least 2 options are required");
      return;
    }

    if (currentQuestion.correct_answers.length === 0) {
      toast.error("Please select at least one correct answer");
      return;
    }

    setQuestions([...questions, { ...currentQuestion, order_index: questions.length }]);
    resetCurrentQuestion();
    setIsQuestionDialogOpen(false);
    toast.success("Question added!");
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_: QuizQuestion, i: number) => i !== index));
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ""],
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length <= 2) {
      toast.error("At least 2 options are required");
      return;
    }
    
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    const newCorrectAnswers = currentQuestion.correct_answers.filter(a => a !== index);
    setCurrentQuestion({ 
      ...currentQuestion, 
      options: newOptions,
      correct_answers: newCorrectAnswers
    });
  };

  const toggleCorrectAnswer = (index: number) => {
    const isMultiple = currentQuestion.question_type === 'multiple_choice';
    
    if (isMultiple) {
      const newCorrectAnswers = currentQuestion.correct_answers.includes(index)
        ? currentQuestion.correct_answers.filter(a => a !== index)
        : [...currentQuestion.correct_answers, index];
      setCurrentQuestion({ ...currentQuestion, correct_answers: newCorrectAnswers });
    } else {
      setCurrentQuestion({ ...currentQuestion, correct_answers: [index] });
    }
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
    setSelectedQuiz(quiz);
    setQuizFormData({
      title: quiz.title,
      passing_score: quiz.passing_score !== undefined ? quiz.passing_score.toString() : "70",
      max_attempts: quiz.max_attempts !== undefined ? quiz.max_attempts.toString() : "0",
      time_limit_minutes: quiz.time_limit_minutes !== undefined ? quiz.time_limit_minutes.toString() : "0",
      randomize_questions: quiz.randomize_questions || false,
      show_correct_answers: quiz.show_correct_answers !== undefined ? quiz.show_correct_answers : true,
    });
    setIsSettingsDialogOpen(true);
  };

  const openAddQuestionDialog = async (quizId: string) => {
    setEditingQuizId(quizId);
    resetCurrentQuestion(); // Reset to empty question for adding new
    setEditingSingleQuestion(false); // Not editing a single question, but adding a new one
    setIsQuestionDialogOpen(true);
  };

  const openEditQuestionDialog = (question: QuizQuestion, quizId: string) => {
    // Set the current question to edit
    setCurrentQuestion(question);
    setEditingQuizId(quizId);
    // Set a flag to indicate we're editing a single question
    setEditingSingleQuestion(true);
    setIsQuestionDialogOpen(true);
  };

  const saveQuestions = async () => {
    if (!editingQuizId) return;
    
    if (editingSingleQuestion) {
      // Update a single question
      if (!currentQuestion.id) {
        toast.error("Question ID is missing");
        return;
      }
      
      const result = await updateQuizQuestion(currentQuestion.id, {
        question_text: currentQuestion.question_text,
        question_type: currentQuestion.question_type,
        options: currentQuestion.options,
        correct_answers: currentQuestion.correct_answers,
        explanation: currentQuestion.explanation,
        order_index: currentQuestion.order_index,
      });
      
      if (result.success) {
        toast.success("Question updated successfully!");
      } else {
        toast.error(result.error || "Failed to update question");
        return;
      }
    } else {
      // Add a new question to an existing quiz
      const result = await addQuizQuestion(editingQuizId, {
        question_text: currentQuestion.question_text,
        question_type: currentQuestion.question_type,
        options: currentQuestion.options,
        correct_answers: currentQuestion.correct_answers,
        explanation: currentQuestion.explanation,
        // Set order_index to the end of existing questions
        order_index: quizQuestions[editingQuizId]?.length || 0,
      });
      
      if (result.success) {
        toast.success("Question added successfully!");
      } else {
        toast.error(result.error || "Failed to add question");
        return;
      }
    }
    
    setIsQuestionDialogOpen(false);
    setEditingQuizId(null);
    setEditingSingleQuestion(false);
    resetCurrentQuestion();
    
    // Refresh the quiz questions
    const updatedQuizzes = await getCourseQuizzes(courseId);
    if (updatedQuizzes.success && updatedQuizzes.data) {
      setQuizzes(updatedQuizzes.data);
      // Fetch questions for each quiz
      const questionsPromises = updatedQuizzes.data.map(async (quiz) => {
        const quizResult = await getQuizWithQuestions(quiz.id);
        if (quizResult.success && quizResult.data) {
          return { quizId: quiz.id, questions: quizResult.data.questions || [] };
        }
        return { quizId: quiz.id, questions: [] };
      });
      
      const questionsResults = await Promise.all(questionsPromises);
      const questionsMap = questionsResults.reduce((acc, { quizId, questions }) => {
        acc[quizId] = questions;
        return acc;
      }, {} as Record<string, QuizQuestion[]>);
      
      setQuizQuestions(questionsMap);
    }
  };

  const resetQuizForm = () => {
    setQuizFormData({ 
      title: "",
      passing_score: "70",
      max_attempts: "0",
      time_limit_minutes: "0",
      randomize_questions: false,
      show_correct_answers: true,
    });
    setQuestions([]);
    resetCurrentQuestion();
    setFormTouched(false);
  };

  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      question_text: "",
      question_type: "single_choice",
      options: ["", ""],
      correct_answers: [],
      explanation: "",
      order_index: 0,
    });
    setEditingSingleQuestion(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Quizzes</h2>
          <p className="text-muted-foreground">Create and manage quizzes for your course</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetQuizForm();
        }}>
          <DialogTrigger asChild>
            <Button>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title *</Label>
                  <Input
                    id="title"
                    value={quizFormData.title}
                    onChange={(e) => {
                      setFormTouched(true);
                      setQuizFormData({ ...quizFormData, title: e.target.value });
                    }}
                    placeholder="Enter quiz title"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passing_score">Passing Score (%)</Label>
                    <Input
                      id="passing_score"
                      type="number"
                      min="0"
                      max="100"
                      value={quizFormData.passing_score}
                      onChange={(e) => {
                        setFormTouched(true);
                        setQuizFormData({ 
                          ...quizFormData, 
                          passing_score: e.target.value
                        });
                      }}
                      placeholder="70"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max_attempts">Maximum Attempts (0 for unlimited)</Label>
                    <Input
                      id="max_attempts"
                      type="number"
                      min="0"
                      value={quizFormData.max_attempts}
                      onChange={(e) => {
                        setFormTouched(true);
                        setQuizFormData({ 
                          ...quizFormData, 
                          max_attempts: e.target.value
                        });
                      }}
                      placeholder="Unlimited"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time_limit_minutes">Time Limit (minutes, 0 for no limit)</Label>
                    <Input
                      id="time_limit_minutes"
                      type="number"
                      min="0"
                      value={quizFormData.time_limit_minutes}
                      onChange={(e) => {
                        setFormTouched(true);
                        setQuizFormData({ 
                          ...quizFormData, 
                          time_limit_minutes: e.target.value
                        });
                      }}
                      placeholder="No time limit"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="randomize_questions" 
                      checked={quizFormData.randomize_questions} 
                      onCheckedChange={(checked) => 
                        setQuizFormData(prev => ({ ...prev, randomize_questions: !!checked }))
                      } 
                    />
                    <Label htmlFor="randomize_questions">Randomize question order</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show_correct_answers" 
                      checked={quizFormData.show_correct_answers} 
                      onCheckedChange={(checked) => 
                        setQuizFormData(prev => ({ ...prev, show_correct_answers: !!checked }))
                      } 
                    />
                    <Label htmlFor="show_correct_answers">Show correct answers after completion</Label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Questions ({questions.length})</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsQuestionDialogOpen(true)}>
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
                                <p className="font-medium">{index + 1}. {q.question_text}</p>
                                <Badge variant="secondary" className="mt-2">
                                  {q.question_type.replace('_', ' ')}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {q.options.length} options • {q.correct_answers.length} correct
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeQuestion(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Quiz
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Question Dialog - Moved outside of Create Quiz Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
        setIsQuestionDialogOpen(open);
        if (!open) {
          setEditingQuizId(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSingleQuestion 
                ? "Edit Question" 
                : editingQuizId 
                  ? "Edit Questions" 
                  : "Add Question"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question_text">Question *</Label>
              <Textarea
                id="question_text"
                value={currentQuestion.question_text}
                onChange={(e) => setCurrentQuestion({ 
                  ...currentQuestion, 
                  question_text: e.target.value 
                })}
                placeholder="Enter your question"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question_type">Question Type</Label>
              <Select
                value={currentQuestion.question_type}
                onValueChange={(value: QuizQuestion['question_type']) => 
                  setCurrentQuestion({ 
                    ...currentQuestion, 
                    question_type: value,
                    correct_answers: value === 'multiple_choice' ? currentQuestion.correct_answers : []
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
                <Button type="button" size="sm" variant="ghost" onClick={addOption}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type={currentQuestion.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                      name="correct"
                      checked={currentQuestion.correct_answers.includes(index)}
                      onChange={() => toggleCorrectAnswer(index)}
                    />
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {currentQuestion.options.length > 2 && (
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
                {currentQuestion.question_type === 'multiple_choice' 
                  ? 'Check all correct answers' 
                  : 'Select the correct answer'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={currentQuestion.explanation || ""}
                onChange={(e) => setCurrentQuestion({ 
                  ...currentQuestion, 
                  explanation: e.target.value 
                })}
                placeholder="Explain why this is the correct answer"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setIsQuestionDialogOpen(false);
              setEditingSingleQuestion(false);
            }}>
              Cancel
            </Button>
            {editingSingleQuestion ? (
              <Button type="button" onClick={saveQuestions}>
                Update Question
              </Button>
            ) : editingQuizId ? (
              <Button type="button" onClick={saveQuestions}>
                Save Questions
              </Button>
            ) : (
              <Button type="button" onClick={addQuestion}>
                Add Question
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          {quizzes.map((quiz: Quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{(quizQuestions[quiz.id] || []).length} Questions</Badge>
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
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Attempts: {quiz.max_attempts || "Unlimited"}</span>
                  <span>Show Answers: {quiz.show_correct_answers ? "Yes" : "No"}</span>
                </div>
                
                {/* Display questions directly in the card */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Questions:</h4>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openAddQuestionDialog(quiz.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                  {quizQuestions[quiz.id] && quizQuestions[quiz.id].length > 0 ? (
                    <div className="space-y-3">
                      {quizQuestions[quiz.id].map((question, index) => (
                        <div key={question.id || index} className="border rounded-md p-3 bg-muted/50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{index + 1}. {question.question_text}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {question.question_type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.options?.length || 0} options
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.correct_answers?.length || 0} correct
                                </Badge>
                              </div>
                              {question.explanation && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  <span className="font-medium">Explanation:</span> {question.explanation}
                                </p>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => openEditQuestionDialog(question, quiz.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No questions added yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quiz Settings</DialogTitle>
            <DialogDescription>
              Manage quiz settings and configurations
            </DialogDescription>
          </DialogHeader>

          {selectedQuiz && (
            <form onSubmit={handleQuizUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-title">Quiz Title</Label>
                <Input
                  id="settings-title"
                  value={quizFormData.title}
                  onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                  placeholder="Enter quiz title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-passing_score">Passing Score (%)</Label>
                  <Input
                    id="settings-passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={quizFormData.passing_score}
                    onChange={(e) => setQuizFormData({ ...quizFormData, passing_score: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="settings-max_attempts">Maximum Attempts</Label>
                  <Input
                    id="settings-max_attempts"
                    type="number"
                    min="0"
                    value={quizFormData.max_attempts}
                    onChange={(e) => setQuizFormData({ ...quizFormData, max_attempts: e.target.value })}
                    placeholder="0 for unlimited"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="settings-time_limit">Time Limit (minutes)</Label>
                  <Input
                    id="settings-time_limit"
                    type="number"
                    min="0"
                    value={quizFormData.time_limit_minutes}
                    onChange={(e) => setQuizFormData({ ...quizFormData, time_limit_minutes: e.target.value })}
                    placeholder="0 for no limit"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="settings-randomize" 
                    checked={quizFormData.randomize_questions} 
                    onCheckedChange={(checked) => 
                      setQuizFormData(prev => ({ ...prev, randomize_questions: !!checked }))
                    } 
                  />
                  <Label htmlFor="settings-randomize">Randomize question order</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="settings-show_answers" 
                    checked={quizFormData.show_correct_answers} 
                    onCheckedChange={(checked) => 
                      setQuizFormData(prev => ({ ...prev, show_correct_answers: !!checked }))
                    } 
                  />
                  <Label htmlFor="settings-show_answers">Show correct answers after completion</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Settings
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
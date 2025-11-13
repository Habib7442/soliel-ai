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
import { toast } from "sonner";
import { 
  createQuiz, 
  addQuizQuestions, 
  getCourseQuizzes,
  getQuizWithQuestions,
  deleteQuiz
} from "@/server/actions/instructor.actions";
import { useInstructorStore } from "@/hooks/useInstructorStore";
import { PlusCircle, Edit, Trash2, Plus, X } from "lucide-react";

interface QuizManagerProps {
  courseId: string;
}

interface QuizQuestion {
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answers: number[];
  explanation?: string;
  order_index: number;
}

export const QuizManager = ({ courseId }: QuizManagerProps) => {
  const { quizzes, setQuizzes, setQuizzesLoading, quizzesLoading } = useInstructorStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [quizFormData, setQuizFormData] = useState({
    title: "",
    is_final: false,
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    question_text: "",
    question_type: "single_choice" as const,
    options: ["", ""],
    correct_answers: [],
    explanation: "",
    order_index: 0,
  });

  useEffect(() => {
    const fetchQuizzes = async () => {
      setQuizzesLoading(true);
      const result = await getCourseQuizzes(courseId);
      if (result.success && result.data) {
        setQuizzes(result.data);
      }
      setQuizzesLoading(false);
    };

    fetchQuizzes();
  }, [courseId]);

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
      // Create quiz first
      const quizResult = await createQuiz({
        lesson_id: courseId, // This should be lesson_id, but using course_id for now
        title: quizFormData.title,
      });

      if (!quizResult.success || !quizResult.data) {
        toast.error(quizResult.error || "Failed to create quiz");
        return;
      }

      // Add questions
      const questionsResult = await addQuizQuestions(
        quizResult.data.id,
        questions
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
    setQuestions(questions.filter((_, i) => i !== index));
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

  const resetQuizForm = () => {
    setQuizFormData({ title: "", is_final: false });
    setQuestions([]);
    resetCurrentQuestion();
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
              <div>
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={quizFormData.title}
                  onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Questions ({questions.length})</Label>
                  <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Question</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="question_text">Question *</Label>
                          <Input
                            id="question_text"
                            value={currentQuestion.question_text}
                            onChange={(e) => setCurrentQuestion({ 
                              ...currentQuestion, 
                              question_text: e.target.value 
                            })}
                            placeholder="Enter your question"
                          />
                        </div>

                        <div>
                          <Label htmlFor="question_type">Question Type</Label>
                          <Select
                            value={currentQuestion.question_type}
                            onValueChange={(value: QuizQuestion['question_type']) => 
                              setCurrentQuestion({ ...currentQuestion, question_type: value })
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

                        <div>
                          <div className="flex items-center justify-between mb-2">
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
                          <p className="text-sm text-muted-foreground mt-1">
                            {currentQuestion.question_type === 'multiple_choice' 
                              ? 'Check all correct answers' 
                              : 'Select the correct answer'}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="explanation">Explanation (Optional)</Label>
                          <Input
                            id="explanation"
                            value={currentQuestion.explanation}
                            onChange={(e) => setCurrentQuestion({ 
                              ...currentQuestion, 
                              explanation: e.target.value 
                            })}
                            placeholder="Explain why this is the correct answer"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={addQuestion}>
                          Add Question
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                    <CardDescription>
                      {quiz.is_final && <Badge className="mt-2">Final Quiz</Badge>}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
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

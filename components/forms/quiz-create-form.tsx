"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createQuiz, addQuizQuestions } from "@/server/actions/instructor.actions";

interface QuizCreateFormProps {
  courseId: string;
  lessonId: string;
  onQuizCreated?: () => void;
}

export function QuizCreateForm({ courseId, lessonId, onQuizCreated }: QuizCreateFormProps) {
  const [quizData, setQuizData] = useState({
    title: "",
    passing_score: 70,
    max_attempts: 0, // 0 means unlimited
    time_limit_minutes: 0, // 0 means no time limit
    randomize_questions: false,
    show_correct_answers: true,
  });
  
  const [questions, setQuestions] = useState([
    {
      question_text: "",
      question_type: "single",
      options: ["", "", "", ""],
      correct_answers: [0],
      explanation: "",
    }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setQuizData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (type === "number" ? parseInt(value) || 0 : value)
    }));
  };

  const handleQuestionChange = (index: number, field: string, value: string | number | boolean) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return newQuestions;
    });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = value;
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
      return newQuestions;
    });
  };

  const handleCorrectAnswerChange = (questionIndex: number, optionIndex: number, checked: boolean) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      let correctAnswers = [...newQuestions[questionIndex].correct_answers];
      
      if (newQuestions[questionIndex].question_type === "single") {
        correctAnswers = [optionIndex];
      } else {
        if (checked) {
          correctAnswers.push(optionIndex);
        } else {
          correctAnswers = correctAnswers.filter(i => i !== optionIndex);
        }
      }
      
      newQuestions[questionIndex] = { ...newQuestions[questionIndex], correct_answers: correctAnswers };
      return newQuestions;
    });
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question_text: "",
        question_type: "single",
        options: ["", "", "", ""],
        correct_answers: [0],
        explanation: "",
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!quizData.title.trim()) {
        toast.error("Quiz title is required");
        setIsSubmitting(false);
        return;
      }

      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) {
          toast.error(`Question ${i + 1} text is required`);
          setIsSubmitting(false);
          return;
        }
        
        const hasNonEmptyOption = q.options.some(opt => opt.trim() !== "");
        if (!hasNonEmptyOption) {
          toast.error(`Question ${i + 1} must have at least one option`);
          setIsSubmitting(false);
          return;
        }
        
        if (q.correct_answers.length === 0) {
          toast.error(`Question ${i + 1} must have at least one correct answer`);
          setIsSubmitting(false);
          return;
        }
      }

      // Create quiz
      const quizResult = await createQuiz({
        lesson_id: lessonId,
        title: quizData.title.trim(),
        passing_score: quizData.passing_score,
        max_attempts: quizData.max_attempts,
        time_limit_minutes: quizData.time_limit_minutes,
        randomize_questions: quizData.randomize_questions,
        show_correct_answers: quizData.show_correct_answers,
      });

      if (!quizResult.success) {
        toast.error("Failed to create quiz", {
          description: quizResult.error
        });
        setIsSubmitting(false);
        return;
      }

      // Add questions to the quiz
      const questionsResult = await addQuizQuestions(
        quizResult.data.id,
        questions.map(q => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          options: q.options.filter(opt => opt.trim() !== ""),
          correct_answers: q.correct_answers,
          explanation: q.explanation.trim() || undefined,
        }))
      );

      if (!questionsResult.success) {
        toast.error("Failed to add questions to quiz", {
          description: questionsResult.error
        });
        setIsSubmitting(false);
        return;
      }

      toast.success("Quiz created successfully!");
      
      // Reset form
      setQuizData({
        title: "",
        passing_score: 70,
        max_attempts: 0,
        time_limit_minutes: 0,
        randomize_questions: false,
        show_correct_answers: true,
      });
      
      setQuestions([
        {
          question_text: "",
          question_type: "single",
          options: ["", "", "", ""],
          correct_answers: [0],
          explanation: "",
        }
      ]);
      
      // Notify parent component
      if (onQuizCreated) {
        onQuizCreated();
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Quiz Title</Label>
          <Input 
            id="title" 
            name="title" 
            value={quizData.title} 
            onChange={handleQuizChange} 
            placeholder="Enter quiz title" 
          />
        </div>
        
        <div>
          <Label htmlFor="passing_score">Passing Score (%)</Label>
          <Input 
            id="passing_score" 
            name="passing_score" 
            type="number" 
            min="0" 
            max="100" 
            value={quizData.passing_score} 
            onChange={handleQuizChange} 
            placeholder="70" 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="max_attempts">Maximum Attempts (0 for unlimited)</Label>
          <Input 
            id="max_attempts" 
            name="max_attempts" 
            type="number" 
            min="0" 
            value={quizData.max_attempts} 
            onChange={handleQuizChange} 
            placeholder="Unlimited" 
          />
        </div>
        
        <div>
          <Label htmlFor="time_limit_minutes">Time Limit (minutes, 0 for no limit)</Label>
          <Input 
            id="time_limit_minutes" 
            name="time_limit_minutes" 
            type="number" 
            min="0" 
            value={quizData.time_limit_minutes} 
            onChange={handleQuizChange} 
            placeholder="No time limit" 
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="randomize_questions" 
            name="randomize_questions" 
            checked={quizData.randomize_questions} 
            onCheckedChange={(checked) => 
              setQuizData(prev => ({ ...prev, randomize_questions: !!checked }))
            } 
          />
          <Label htmlFor="randomize_questions">Randomize question order</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show_correct_answers" 
            name="show_correct_answers" 
            checked={quizData.show_correct_answers} 
            onCheckedChange={(checked) => 
              setQuizData(prev => ({ ...prev, show_correct_answers: !!checked }))
            } 
          />
          <Label htmlFor="show_correct_answers">Show correct answers after completion</Label>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Questions</h3>
        
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium">Question {index + 1}</h4>
                {questions.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeQuestion(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="mb-4">
                <Label>Question Text</Label>
                <Textarea 
                  value={question.question_text} 
                  onChange={(e) => handleQuestionChange(index, "question_text", e.target.value)} 
                  placeholder="Enter your question here" 
                  rows={2} 
                />
              </div>
              
              <div className="mb-4">
                <Label>Question Type</Label>
                <div className="flex space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`single-${index}`}
                      name={`question-type-${index}`}
                      checked={question.question_type === "single"}
                      onChange={() => handleQuestionChange(index, "question_type", "single")}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`single-${index}`}>Single Choice</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`multiple-${index}`}
                      name={`question-type-${index}`}
                      checked={question.question_type === "multiple"}
                      onChange={() => handleQuestionChange(index, "question_type", "multiple")}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={`multiple-${index}`}>Multiple Choice</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <Checkbox 
                      checked={question.correct_answers.includes(optionIndex)} 
                      onCheckedChange={(checked) => 
                        handleCorrectAnswerChange(index, optionIndex, !!checked)
                      } 
                    />
                    <Label htmlFor={`option-${index}-${optionIndex}`}>Option</Label>
                    <Input 
                      id={`option-${index}-${optionIndex}`}
                      value={option} 
                      onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)} 
                      placeholder={`Enter option ${String.fromCharCode(65 + optionIndex)}`} 
                      className="flex-1" 
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Label>Explanation (Optional)</Label>
                <Textarea 
                  value={question.explanation} 
                  onChange={(e) => handleQuestionChange(index, "explanation", e.target.value)} 
                  placeholder="Explanation shown after answering" 
                  rows={2} 
                />
              </div>
            </div>
          ))}
          
          <Button type="button" variant="outline" className="w-full" onClick={addQuestion}>
            + Add Question
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">Save Draft</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Save Quiz"}
        </Button>
      </div>
    </form>
  );
}
"use server";

import { createServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'single' | 'multiple';
  options: string[];
  correct_answers: string[]; // Will be converted from integer indices
  correct_answer_indices?: number[]; // Original indices from DB
  explanation?: string;
  order_index: number;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  passed: boolean;
  started_at: string;
  completed_at?: string;
  time_taken_seconds?: number;
  answers: Record<string, string[]>;
}

/**
 * Get quiz by lesson ID
 */
export const getQuizByLessonId = async (lessonId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();

    if (quizError) {
      console.error('Error fetching quiz:', quizError);
      return { success: false, error: quizError.message };
    }

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return { success: false, error: questionsError.message };
    }

    // Convert integer indices to actual option text and normalize question_type
    const processedQuestions = (questions || []).map((q: any) => ({
      ...q,
      question_type: q.question_type === 'single_choice' ? 'single' : 'multiple', // Normalize type
      correct_answer_indices: q.correct_answers, // Store original indices
      correct_answers: (q.correct_answers || []).map((idx: number) => q.options[idx])
    }));

    return { 
      success: true, 
      data: { 
        quiz: quiz as Quiz, 
        questions: processedQuestions as QuizQuestion[] 
      } 
    };
  } catch (error) {
    console.error('Error in getQuizByLessonId:', error);
    return { success: false, error: 'Failed to fetch quiz' };
  }
};

/**
 * Get student's quiz attempts
 */
export const getStudentQuizAttempts = async (quizId: string, studentId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('student_quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz attempts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as QuizAttempt[] };
  } catch (error) {
    console.error('Error in getStudentQuizAttempts:', error);
    return { success: false, error: 'Failed to fetch quiz attempts' };
  }
};

/**
 * Start a new quiz attempt
 */
export const startQuizAttempt = async (quizId: string, studentId: string) => {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('student_quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        started_at: new Date().toISOString(),
        answers: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting quiz attempt:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as QuizAttempt };
  } catch (error) {
    console.error('Error in startQuizAttempt:', error);
    return { success: false, error: 'Failed to start quiz attempt' };
  }
};

/**
 * Submit quiz attempt and calculate score
 */
export const submitQuizAttempt = async (
  attemptId: string,
  answers: Record<string, string[]>,
  quizId: string,
  timeTakenSeconds: number
) => {
  try {
    const supabase = await createServerClient();
    
    // Get quiz questions to calculate score
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId);

    if (questionsError) {
      console.error('Error fetching questions for grading:', questionsError);
      return { success: false, error: questionsError.message };
    }

    // Get quiz settings
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('passing_score')
      .eq('id', quizId)
      .single();

    if (quizError) {
      console.error('Error fetching quiz:', quizError);
      return { success: false, error: quizError.message };
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = questions?.length || 0;

    questions?.forEach((question: any) => {
      const studentAnswer = answers[question.id] || [];
      
      // Convert correct_answers indices to actual option text
      const correctAnswerIndices = question.correct_answers || [];
      const correctAnswerText = correctAnswerIndices.map((idx: number) => question.options[idx]);

      // Sort both arrays for comparison
      const sortedStudentAnswer = [...studentAnswer].sort();
      const sortedCorrectAnswer = [...correctAnswerText].sort();

      console.log(`[GRADING] Question: ${question.question_text}`);
      console.log(`[GRADING] Student Answer:`, sortedStudentAnswer);
      console.log(`[GRADING] Correct Answer:`, sortedCorrectAnswer);

      // Check if arrays are equal
      if (
        sortedStudentAnswer.length === sortedCorrectAnswer.length &&
        sortedStudentAnswer.every((val, idx) => val === sortedCorrectAnswer[idx])
      ) {
        correctCount++;
        console.log(`[GRADING] ✅ Correct!`);
      } else {
        console.log(`[GRADING] ❌ Incorrect`);
      }
    });

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const passed = score >= (quiz?.passing_score || 70);

    // Update attempt
    const { data, error } = await supabase
      .from('student_quiz_attempts')
      .update({
        answers,
        score,
        passed,
        completed_at: new Date().toISOString(),
        time_taken_seconds: timeTakenSeconds
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      console.error('Error submitting quiz attempt:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/learn/[courseId]/player');
    return { success: true, data: data as QuizAttempt };
  } catch (error) {
    console.error('Error in submitQuizAttempt:', error);
    return { success: false, error: 'Failed to submit quiz attempt' };
  }
};

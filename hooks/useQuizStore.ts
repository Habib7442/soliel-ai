import { create } from 'zustand';

export interface QuizOption {
  id?: string;
  question_id?: string;
  option_text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id?: string;
  quiz_id?: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false';
  order_index: number;
  quiz_options?: QuizOption[];
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  passing_score?: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  randomize_questions?: boolean;
  show_correct_answers?: boolean;
  created_at: string;
  updated_at?: string;
}

interface QuizState {
  // Current quiz being edited
  currentQuiz: Quiz | null;
  
  // Questions for current quiz
  questions: QuizQuestion[];
  
  // Question being edited
  currentQuestion: QuizQuestion | null;
  editingQuestionIndex: number | null;
  
  // Dialog states
  isQuizDialogOpen: boolean;
  isQuestionDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  
  // Actions
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setQuestions: (questions: QuizQuestion[]) => void;
  addQuestion: (question: QuizQuestion) => void;
  updateQuestion: (index: number, question: QuizQuestion) => void;
  deleteQuestion: (index: number) => void;
  setCurrentQuestion: (question: QuizQuestion | null) => void;
  setEditingQuestionIndex: (index: number | null) => void;
  
  setIsQuizDialogOpen: (open: boolean) => void;
  setIsQuestionDialogOpen: (open: boolean) => void;
  setIsSettingsDialogOpen: (open: boolean) => void;
  
  resetQuizForm: () => void;
  resetQuestionForm: () => void;
}

const initialQuestion: QuizQuestion = {
  question: "",
  type: "single_choice",
  order_index: 0,
  quiz_options: [
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
};

export const useQuizStore = create<QuizState>((set) => ({
  currentQuiz: null,
  questions: [],
  currentQuestion: null,
  editingQuestionIndex: null,
  isQuizDialogOpen: false,
  isQuestionDialogOpen: false,
  isSettingsDialogOpen: false,
  
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  
  setQuestions: (questions) => set({ questions }),
  
  addQuestion: (question) => set((state) => ({
    questions: [...state.questions, { ...question, order_index: state.questions.length }],
  })),
  
  updateQuestion: (index, question) => set((state) => ({
    questions: state.questions.map((q, i) => i === index ? question : q),
  })),
  
  deleteQuestion: (index) => set((state) => ({
    questions: state.questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, order_index: i })),
  })),
  
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  
  setEditingQuestionIndex: (index) => set({ editingQuestionIndex: index }),
  
  setIsQuizDialogOpen: (open) => set({ isQuizDialogOpen: open }),
  
  setIsQuestionDialogOpen: (open) => set({ isQuestionDialogOpen: open }),
  
  setIsSettingsDialogOpen: (open) => set({ isSettingsDialogOpen: open }),
  
  resetQuizForm: () => set({
    currentQuiz: null,
    questions: [],
    currentQuestion: null,
    editingQuestionIndex: null,
  }),
  
  resetQuestionForm: () => set({
    currentQuestion: { ...initialQuestion },
    editingQuestionIndex: null,
  }),
}));

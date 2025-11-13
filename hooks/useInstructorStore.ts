import { create } from 'zustand';

// Types
export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  thumbnail_url?: string;
  intro_video_url?: string;
  price_cents: number;
  currency: string;
  is_published: boolean;
  status?: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content_md?: string;
  video_url?: string;
  downloadable: boolean;
  order_index: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  is_final: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
  order_index: number;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  type: 'file_upload' | 'link_submission' | 'text_entry';
  due_at?: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  content_url?: string;
  text_entry?: string;
  submitted_at: string;
  grade_percent?: number;
  graded_by?: string;
  graded_at?: string;
  student_name?: string;
  student_email?: string;
}

export interface Review {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  status: 'visible' | 'hidden' | 'flagged';
  created_at: string;
  student_name?: string;
}

export interface QnaThread {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  created_at: string;
  messages_count?: number;
  last_message_at?: string;
}

export interface CourseFaq {
  id: string;
  course_id: string;
  question: string;
  answer_md: string;
  created_at: string;
}

export interface Earnings {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayouts: number;
  currency: string;
}

export interface StudentActivity {
  id: string;
  student_name: string;
  student_email: string;
  course_title: string;
  activity_type: string;
  activity_date: string;
  progress_percent?: number;
}

// Zustand Store
interface InstructorState {
  // Courses
  courses: Course[];
  selectedCourse: Course | null;
  coursesLoading: boolean;
  
  // Lessons
  lessons: Lesson[];
  lessonsLoading: boolean;
  
  // Quizzes
  quizzes: Quiz[];
  quizzesLoading: boolean;
  selectedQuiz: Quiz | null;
  quizQuestions: QuizQuestion[];
  
  // Assignments
  assignments: Assignment[];
  assignmentsLoading: boolean;
  assignmentSubmissions: AssignmentSubmission[];
  
  // Reviews
  reviews: Review[];
  reviewsLoading: boolean;
  
  // Q&A
  qnaThreads: QnaThread[];
  qnaLoading: boolean;
  
  // FAQs
  courseFaqs: CourseFaq[];
  faqsLoading: boolean;
  
  // Earnings
  earnings: Earnings | null;
  earningsLoading: boolean;
  
  // Student Activity
  studentActivities: StudentActivity[];
  activitiesLoading: boolean;
  
  // Actions - Courses
  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  setCoursesLoading: (loading: boolean) => void;
  
  // Actions - Lessons
  setLessons: (lessons: Lesson[]) => void;
  addLesson: (lesson: Lesson) => void;
  updateLesson: (id: string, updates: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  setLessonsLoading: (loading: boolean) => void;
  
  // Actions - Quizzes
  setQuizzes: (quizzes: Quiz[]) => void;
  setSelectedQuiz: (quiz: Quiz | null) => void;
  addQuiz: (quiz: Quiz) => void;
  updateQuiz: (id: string, updates: Partial<Quiz>) => void;
  deleteQuiz: (id: string) => void;
  setQuizzesLoading: (loading: boolean) => void;
  setQuizQuestions: (questions: QuizQuestion[]) => void;
  addQuizQuestion: (question: QuizQuestion) => void;
  
  // Actions - Assignments
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  setAssignmentsLoading: (loading: boolean) => void;
  setAssignmentSubmissions: (submissions: AssignmentSubmission[]) => void;
  updateSubmission: (id: string, updates: Partial<AssignmentSubmission>) => void;
  
  // Actions - Reviews
  setReviews: (reviews: Review[]) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  setReviewsLoading: (loading: boolean) => void;
  
  // Actions - Q&A
  setQnaThreads: (threads: QnaThread[]) => void;
  setQnaLoading: (loading: boolean) => void;
  
  // Actions - FAQs
  setCourseFaqs: (faqs: CourseFaq[]) => void;
  addCourseFaq: (faq: CourseFaq) => void;
  updateCourseFaq: (id: string, updates: Partial<CourseFaq>) => void;
  deleteCourseFaq: (id: string) => void;
  setFaqsLoading: (loading: boolean) => void;
  
  // Actions - Earnings
  setEarnings: (earnings: Earnings) => void;
  setEarningsLoading: (loading: boolean) => void;
  
  // Actions - Activities
  setStudentActivities: (activities: StudentActivity[]) => void;
  setActivitiesLoading: (loading: boolean) => void;
  
  // Reset
  reset: () => void;
}

export const useInstructorStore = create<InstructorState>((set) => ({
  // Initial State
  courses: [],
  selectedCourse: null,
  coursesLoading: false,
  
  lessons: [],
  lessonsLoading: false,
  
  quizzes: [],
  quizzesLoading: false,
  selectedQuiz: null,
  quizQuestions: [],
  
  assignments: [],
  assignmentsLoading: false,
  assignmentSubmissions: [],
  
  reviews: [],
  reviewsLoading: false,
  
  qnaThreads: [],
  qnaLoading: false,
  
  courseFaqs: [],
  faqsLoading: false,
  
  earnings: null,
  earningsLoading: false,
  
  studentActivities: [],
  activitiesLoading: false,
  
  // Course Actions
  setCourses: (courses) => set({ courses }),
  setSelectedCourse: (course) => set({ selectedCourse: course }),
  addCourse: (course) => set((state) => ({ courses: [course, ...state.courses] })),
  updateCourse: (id, updates) => set((state) => ({
    courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    selectedCourse: state.selectedCourse?.id === id 
      ? { ...state.selectedCourse, ...updates }
      : state.selectedCourse,
  })),
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter((c) => c.id !== id),
    selectedCourse: state.selectedCourse?.id === id ? null : state.selectedCourse,
  })),
  setCoursesLoading: (loading) => set({ coursesLoading: loading }),
  
  // Lesson Actions
  setLessons: (lessons) => set({ lessons }),
  addLesson: (lesson) => set((state) => ({ lessons: [...state.lessons, lesson] })),
  updateLesson: (id, updates) => set((state) => ({
    lessons: state.lessons.map((l) => (l.id === id ? { ...l, ...updates } : l)),
  })),
  deleteLesson: (id) => set((state) => ({
    lessons: state.lessons.filter((l) => l.id !== id),
  })),
  setLessonsLoading: (loading) => set({ lessonsLoading: loading }),
  
  // Quiz Actions
  setQuizzes: (quizzes) => set({ quizzes }),
  setSelectedQuiz: (quiz) => set({ selectedQuiz: quiz }),
  addQuiz: (quiz) => set((state) => ({ quizzes: [...state.quizzes, quiz] })),
  updateQuiz: (id, updates) => set((state) => ({
    quizzes: state.quizzes.map((q) => (q.id === id ? { ...q, ...updates } : q)),
  })),
  deleteQuiz: (id) => set((state) => ({
    quizzes: state.quizzes.filter((q) => q.id !== id),
  })),
  setQuizzesLoading: (loading) => set({ quizzesLoading: loading }),
  setQuizQuestions: (questions) => set({ quizQuestions: questions }),
  addQuizQuestion: (question) => set((state) => ({
    quizQuestions: [...state.quizQuestions, question],
  })),
  
  // Assignment Actions
  setAssignments: (assignments) => set({ assignments }),
  addAssignment: (assignment) => set((state) => ({ 
    assignments: [...state.assignments, assignment] 
  })),
  updateAssignment: (id, updates) => set((state) => ({
    assignments: state.assignments.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  })),
  deleteAssignment: (id) => set((state) => ({
    assignments: state.assignments.filter((a) => a.id !== id),
  })),
  setAssignmentsLoading: (loading) => set({ assignmentsLoading: loading }),
  setAssignmentSubmissions: (submissions) => set({ assignmentSubmissions: submissions }),
  updateSubmission: (id, updates) => set((state) => ({
    assignmentSubmissions: state.assignmentSubmissions.map((s) => 
      s.id === id ? { ...s, ...updates } : s
    ),
  })),
  
  // Review Actions
  setReviews: (reviews) => set({ reviews }),
  updateReview: (id, updates) => set((state) => ({
    reviews: state.reviews.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  })),
  setReviewsLoading: (loading) => set({ reviewsLoading: loading }),
  
  // Q&A Actions
  setQnaThreads: (threads) => set({ qnaThreads: threads }),
  setQnaLoading: (loading) => set({ qnaLoading: loading }),
  
  // FAQ Actions
  setCourseFaqs: (faqs) => set({ courseFaqs: faqs }),
  addCourseFaq: (faq) => set((state) => ({ courseFaqs: [...state.courseFaqs, faq] })),
  updateCourseFaq: (id, updates) => set((state) => ({
    courseFaqs: state.courseFaqs.map((f) => (f.id === id ? { ...f, ...updates } : f)),
  })),
  deleteCourseFaq: (id) => set((state) => ({
    courseFaqs: state.courseFaqs.filter((f) => f.id !== id),
  })),
  setFaqsLoading: (loading) => set({ faqsLoading: loading }),
  
  // Earnings Actions
  setEarnings: (earnings) => set({ earnings }),
  setEarningsLoading: (loading) => set({ earningsLoading: loading }),
  
  // Activities Actions
  setStudentActivities: (activities) => set({ studentActivities: activities }),
  setActivitiesLoading: (loading) => set({ activitiesLoading: loading }),
  
  // Reset
  reset: () => set({
    courses: [],
    selectedCourse: null,
    coursesLoading: false,
    lessons: [],
    lessonsLoading: false,
    quizzes: [],
    quizzesLoading: false,
    selectedQuiz: null,
    quizQuestions: [],
    assignments: [],
    assignmentsLoading: false,
    assignmentSubmissions: [],
    reviews: [],
    reviewsLoading: false,
    qnaThreads: [],
    qnaLoading: false,
    courseFaqs: [],
    faqsLoading: false,
    earnings: null,
    earningsLoading: false,
    studentActivities: [],
    activitiesLoading: false,
  }),
}));

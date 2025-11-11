export interface Course {
  id: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string; // e.g., "4 weeks"
  lessons: number;
  students: number;
  rating: number;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  category: string;
  instructor: {
    name: string;
    avatar: string;
  };
}

export const courses: Course[] = [
  {
    id: "1",
    title: "Introduction to Artificial Intelligence",
    description: "Learn the fundamentals of AI, including machine learning, neural networks, and deep learning concepts.",
    level: "Beginner",
    duration: "6 weeks",
    lessons: 24,
    students: 1250,
    rating: 4.8,
    price: 89.99,
    originalPrice: 129.99,
    thumbnail: "/images/courses/ai-fundamentals.png",
    category: "Artificial Intelligence",
    instructor: {
      name: "Dr. Sarah Johnson",
      avatar: "/images/instructors/sarah.jpg",
    },
  },
  {
    id: "2",
    title: "Advanced React Development",
    description: "Master advanced React concepts including hooks, context, performance optimization, and state management.",
    level: "Advanced",
    duration: "8 weeks",
    lessons: 32,
    students: 890,
    rating: 4.9,
    price: 129.99,
    thumbnail: "/images/courses/react-advanced.png",
    category: "Web Development",
    instructor: {
      name: "Michael Chen",
      avatar: "/images/instructors/michael.jpg",
    },
  },
  {
    id: "3",
    title: "Python for Data Science",
    description: "Comprehensive course on using Python for data analysis, visualization, and machine learning.",
    level: "Intermediate",
    duration: "10 weeks",
    lessons: 40,
    students: 2100,
    rating: 4.7,
    price: 99.99,
    originalPrice: 149.99,
    thumbnail: "/images/courses/python-data.jpg",
    category: "Data Science",
    instructor: {
      name: "Dr. Emily Rodriguez",
      avatar: "/images/instructors/emily.jpg",
    },
  },
  {
    id: "4",
    title: "UI/UX Design Principles",
    description: "Learn modern UI/UX design principles, user research, prototyping, and design systems.",
    level: "Beginner",
    duration: "5 weeks",
    lessons: 20,
    students: 1560,
    rating: 4.6,
    price: 79.99,
    thumbnail: "/images/courses/ui-ux-design.jpg",
    category: "Design",
    instructor: {
      name: "Alex Thompson",
      avatar: "/images/instructors/alex.jpg",
    },
  },
  {
    id: "5",
    title: "Cloud Infrastructure with AWS",
    description: "Comprehensive guide to AWS services, cloud architecture, and deployment strategies.",
    level: "Intermediate",
    duration: "12 weeks",
    lessons: 48,
    students: 980,
    rating: 4.8,
    price: 149.99,
    originalPrice: 199.99,
    thumbnail: "/images/courses/aws-cloud.jpg",
    category: "Cloud Computing",
    instructor: {
      name: "James Wilson",
      avatar: "/images/instructors/james.jpg",
    },
  },
  {
    id: "6",
    title: "Cybersecurity Fundamentals",
    description: "Essential cybersecurity concepts, threat analysis, and security best practices.",
    level: "Beginner",
    duration: "7 weeks",
    lessons: 28,
    students: 1750,
    rating: 4.5,
    price: 89.99,
    thumbnail: "/images/courses/cybersecurity.jpg",
    category: "Security",
    instructor: {
      name: "Robert Davis",
      avatar: "/images/instructors/robert.jpg",
    },
  },
];
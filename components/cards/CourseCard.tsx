"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
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

export function CourseCard({
  id,
  title,
  description,
  level,
  duration,
  lessons,
  students,
  rating,
  price,
  originalPrice,
  thumbnail,
  category,
  instructor,
}: CourseCardProps) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-48 w-full">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover"
        />
        {originalPrice && (
          <Badge className="absolute top-2 right-2 bg-[#FF6B35] hover:bg-[#FF844B]">
            Save {Math.round(((originalPrice - price) / originalPrice) * 100)}%
          </Badge>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700">
            {level}
          </Badge>
          <div className="flex items-center">
            <span className="text-yellow-500 mr-1">★</span>
            <span className="text-sm font-medium">{rating}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Image
              src={instructor.avatar}
              alt={instructor.name}
              width={32}
              height={32}
              className="rounded-full mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{instructor.name}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{lessons} lessons</span>
          <span>{students} students</span>
          <span>{duration}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">${price}</span>
            {originalPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">${originalPrice}</span>
            )}
          </div>
          <Button asChild size="sm" className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white">
            <Link href={`/courses/${id}`}>Enroll Now</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
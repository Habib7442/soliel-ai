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
  isBundle?: boolean;
  isEnrolled?: boolean;
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
  isBundle = false,
  isEnrolled = false,
}: CourseCardProps) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-48 w-full flex-shrink-0">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {originalPrice && (
          <Badge className="absolute top-3 right-3 bg-[#FF6B35] hover:bg-[#FF844B] text-white px-2 py-1 rounded-full text-xs font-medium">
            Save {Math.round(((originalPrice - price) / originalPrice) * 100)}%
          </Badge>
        )}
        {isBundle && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Bundle Deal
          </Badge>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1">
            {level}
          </Badge>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            <span className="text-yellow-500 mr-1">★</span>
            <span className="text-xs font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white line-clamp-2 min-h-[3.5rem]">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{description}</p>
        
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <Image
              src={instructor.avatar || "/images/instructors/sarah.png"}
              alt={instructor.name}
              width={28}
              height={28}
              className="rounded-full mr-2"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{instructor.name}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{lessons} lessons</span>
          <span>{students} students</span>
          <span>{duration}</span>
        </div>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-gray-900 dark:text-white">${price}</span>
            {originalPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">${originalPrice}</span>
            )}
          </div>
          {isEnrolled ? (
            <Button asChild size="sm" variant="secondary" className="rounded-lg text-xs h-9 px-4">
              <Link href={`/learn/${id}/player`}>Go to Course</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white rounded-lg text-xs h-9 px-4">
              <Link href={`/courses/${id}`}>Enroll Now</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
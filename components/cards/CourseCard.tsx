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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col border border-gray-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative h-32 w-full flex-shrink-0 overflow-hidden">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
        />
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isBundle && (
            <div className="backdrop-blur-md bg-white/30 border border-white/40 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
              Bundle
            </div>
          )}
          <div className="backdrop-blur-md bg-black/30 border border-white/10 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
            {level}
          </div>
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-yellow-600 text-[10px] font-bold">
            <span>★</span>
            <span>{rating.toFixed(1)}</span>
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{category}</span>
        </div>
        
        <h3 className="text-sm font-bold mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-1">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="relative w-5 h-5 rounded-full overflow-hidden">
            <Image
              src={instructor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.name}`}
              alt={instructor.name}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-[10px] font-bold text-gray-500 line-clamp-1">{instructor.name}</span>
        </div>
        
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {originalPrice && (
              <span className="text-[10px] text-gray-400 line-through leading-none">${originalPrice}</span>
            )}
            <span className="text-lg font-black text-gray-900 leading-none">
              ${price}
            </span>
          </div>
          
          <Button asChild size="sm" className={`h-8 px-3 rounded-lg text-[10px] font-bold border-0 ${isEnrolled ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-primary hover:bg-primary/90 text-white"}`}>
            <Link href={isEnrolled ? `/learn/${id}/player` : `/courses/${id}`}>
              {isEnrolled ? "Resume" : "Enroll"}
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
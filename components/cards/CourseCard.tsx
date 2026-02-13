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
      className="group bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 h-full flex flex-col border border-gray-100/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative h-56 w-full flex-shrink-0 overflow-hidden">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Glassmorphic Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isBundle && (
            <div className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Bundle Deal
            </div>
          )}
          <div className="backdrop-blur-md bg-black/20 border border-white/10 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {level}
          </div>
        </div>

        {originalPrice && (
          <div className="absolute bottom-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-black shadow-lg shadow-primary/20">
            -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
          </div>
        )}
      </div>
      
      <div className="p-7 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-lg text-xs font-bold border border-yellow-100">
            <span>★</span>
            <span>{rating.toFixed(1)}</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{category}</span>
        </div>
        
        <h3 className="text-xl font-bold mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {title}
        </h3>
        
        <p className="text-muted-foreground/80 text-sm mb-6 line-clamp-2 leading-relaxed">
          {description}
        </p>
        
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm">
            <Image
              src={instructor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.name}`}
              alt={instructor.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Instructor</span>
            <span className="text-sm font-bold text-gray-900">{instructor.name}</span>
          </div>
        </div>
        
        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through opacity-50 mb-0.5">${originalPrice}</span>
              )}
              <span className="text-4xl font-black text-gray-900 leading-none tracking-tighter">
                ${price}
              </span>
            </div>
            
            {isEnrolled ? (
              <Button asChild size="lg" variant="secondary" className="w-full rounded-2xl text-xs font-bold h-14 shadow-sm">
                <Link href={`/learn/${id}/player`} className="flex items-center justify-center gap-2">Resume Learning</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl text-sm font-bold h-14 shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 border-0">
                <Link href={`/courses/${id}`} className="flex items-center justify-center gap-2">
                  Enroll Now
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
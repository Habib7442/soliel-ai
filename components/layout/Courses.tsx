"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/cards/CourseCard";
import { courses } from "@/constants/courses";

// Get unique categories for filter tabs
const categories = ["All", ...new Set(courses.map(course => course.category))];

export function Courses() {
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Filter courses based on active category
  const filteredCourses = activeCategory === "All" 
    ? courses 
    : courses.filter(course => course.category === activeCategory);
  
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] bg-clip-text text-transparent">
            Featured Courses
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Discover our handpicked selection of courses designed to help you master the latest technologies and advance your career.
        </p>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            className={`rounded-full px-6 ${
              activeCategory === category
                ? "bg-gradient-to-r from-[#FF6B35] to-[#FF914D] text-white hover:from-[#FF844B] hover:to-[#FFB088]"
                : "border-gray-300 dark:border-gray-600"
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      
      {/* Courses Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        layout
      >
        {filteredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <CourseCard {...course} />
          </motion.div>
        ))}
      </motion.div>
      
      {/* View All Button */}
      <div className="text-center mt-12">
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white shadow-lg"
          asChild
        >
          <Link href="/courses">View All Courses</Link>
        </Button>
      </div>
    </section>
  );
}
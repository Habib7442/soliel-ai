"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/cards/CourseCard";
import { getPublicCourses, getCourseCategories, PublicCourse } from "@/server/actions/public.actions";

export function Courses() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch courses with limit of 10 for landing page
      const coursesResult = await getPublicCourses(
        activeCategory !== "All" ? { category: activeCategory } : undefined,
        10
      );
      
      if (coursesResult.success && coursesResult.data) {
        setCourses(coursesResult.data);
      }

      // Fetch categories only once
      if (categories.length === 1) {
        const categoriesResult = await getCourseCategories();
        if (categoriesResult.success && categoriesResult.data) {
          setCategories(["All", ...categoriesResult.data.map(c => c.name)]);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [activeCategory]);
  
  const filteredCourses = courses;
  
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
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
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 border-0"
                : "border-gray-300 dark:border-gray-600"
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      
      {/* Courses Grid */}
      {loading ? (
        <div className="flex flex-wrap justify-center gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg animate-pulse w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]">
              <div className="h-48 bg-gray-300 dark:bg-gray-700" />
              <div className="p-6 space-y-4">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            No courses found in this category. Check back soon!
          </p>
        </div>
      ) : (
        <motion.div 
          className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto"
          layout
        >
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]"
            >
              <CourseCard
                id={course.id}
                title={course.title}
                description={course.subtitle || course.description || ""}
                level={course.level || "Beginner"}
                duration={course.estimated_duration_hours ? `${course.estimated_duration_hours} hours` : "Self-paced"}
                lessons={course.lessons_count}
                students={course.stats.total_enrollments}
                rating={course.stats.average_rating || 0}
                price={course.price_cents / 100}
                originalPrice={course.bundle_discount_percent ? (course.price_cents / 100) * (1 + course.bundle_discount_percent / 100) : undefined}
                thumbnail={course.thumbnail_url || "/images/courses/default-thumbnail.png"}
                category={course.category || "General"}
                instructor={{
                  name: course.instructor?.full_name || "Anonymous Instructor",
                  avatar: course.instructor?.avatar_url || "/images/instructors/sarah.png",
                }}
                isBundle={course.allow_in_bundles && (course.bundle_discount_percent || 0) > 0}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* View All Button */}
      <div className="text-center mt-12">
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground shadow-lg border-0"
          asChild
        >
          <Link href="/courses">View All Courses</Link>
        </Button>
      </div>
    </section>
  );
}
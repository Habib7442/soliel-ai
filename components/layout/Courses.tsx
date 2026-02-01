"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/cards/CourseCard";
import { getPublicCourses, getCourseCategories, PublicCourse } from "@/server/actions/public.actions";
import { Sparkles, ArrowRight } from "lucide-react";

export function Courses() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const coursesResult = await getPublicCourses(
        activeCategory !== "All" ? { category: activeCategory } : undefined,
        10
      );
      
      if (coursesResult.success && coursesResult.data) {
        setCourses(coursesResult.data);
      }

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
  
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Top Picks</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Featured <span className="text-primary italic">Courses.</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium mb-12">
            Build incredible skills with our most popular courses, taught by industry experts.
          </p>

          {/* Filter Tabs - Modern Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  activeCategory === category
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-[2.5rem] overflow-hidden h-[450px] animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold text-lg">
              No courses found in this category. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
            {courses.map((course, index) => (
              <CourseCard
                key={course.id}
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
                  avatar: course.instructor?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher",
                }}
                isBundle={course.allow_in_bundles && (course.bundle_discount_percent || 0) > 0}
              />
            ))}
          </div>
        )}
        
        <div className="text-center">
          <Button asChild size="xl" className="rounded-2xl bg-gray-900 hover:bg-primary text-white font-bold px-12 transition-all hover:scale-105 active:scale-95 border-0 shadow-2xl shadow-black/10">
            <Link href="/courses" className="flex items-center gap-2">
              Browse All Courses
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
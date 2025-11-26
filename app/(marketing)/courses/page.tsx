"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CourseCard } from "@/components/cards/CourseCard";
import { getPublicCourses, getCourseCategories, PublicCourse, CourseFilters } from "@/server/actions/public.actions";
import { createClient } from "@/lib/supabase-client";

export default function CoursesPage() {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [bundlesOnly, setBundlesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;
  
  // Active filters count
  const activeFiltersCount = [
    selectedCategory !== "All",
    selectedLevel !== "All",
    priceRange[0] > 0 || priceRange[1] < 500,
    bundlesOnly,
    searchQuery.length > 0,
  ].filter(Boolean).length;

  useEffect(() => {
    const fetchCategories = async () => {
      const result = await getCourseCategories();
      if (result.success && result.data) {
        setCategories(["All", ...result.data.map(c => c.name)]);
      }
    };
    fetchCategories();
    
    // Fetch user's enrolled courses
    const fetchEnrollments = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id);
        
        if (enrollments) {
          setEnrolledCourseIds(new Set(enrollments.map(e => e.course_id)));
        }
      }
    };
    fetchEnrollments();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const filters: CourseFilters = {};
      
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory !== "All") filters.category = selectedCategory;
      if (selectedLevel !== "All") filters.level = selectedLevel;
      if (priceRange[0] > 0) filters.priceMin = priceRange[0];
      if (priceRange[1] < 500) filters.priceMax = priceRange[1];
      if (bundlesOnly) filters.bundlesOnly = true;

      const result = await getPublicCourses(filters);
      if (result.success && result.data) {
        setCourses(result.data);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchCourses();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, selectedLevel, priceRange, bundlesOnly]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedLevel("All");
    setPriceRange([0, 500]);
    setBundlesOnly(false);
  };

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Our Course Catalog
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Discover courses designed by experts to help you master new skills and advance your career
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Search and Filters Bar */}
        <div className="mb-10 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 focus:border-[#FF6B35] rounded-lg text-base"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-2 rounded-lg text-base">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Level Filter */}
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-2 rounded-lg text-base">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* More Filters */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 border-2 rounded-lg relative px-4 text-base">
                  <Filter size={20} className="mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 bg-[#FF6B35] hover:bg-[#FF844B] rounded-full h-5 px-2 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-6">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-2xl">Additional Filters</SheetTitle>
                  <SheetDescription>
                    Refine your course search with more options
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6">
                  {/* Price Range */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold block">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </Label>
                    <div className="px-2">
                      <Slider
                        min={0}
                        max={500}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                      />
                    </div>
                  </div>

                  {/* Bundles Only */}
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <Label htmlFor="bundles-only" className="text-base font-semibold cursor-pointer">
                      Bundle Deals Only
                    </Label>
                    <Switch
                      id="bundles-only"
                      checked={bundlesOnly}
                      onCheckedChange={setBundlesOnly}
                    />
                  </div>

                  {/* Clear Filters */}
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="w-full border-2 rounded-lg h-11 text-base"
                  >
                    <X size={16} className="mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 px-3 py-1 rounded-full">
                    Search: {searchQuery}
                    <X
                      size={14}
                      className="cursor-pointer"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {selectedCategory !== "All" && (
                  <Badge variant="secondary" className="gap-1 px-3 py-1 rounded-full">
                    {selectedCategory}
                    <X
                      size={14}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory("All")}
                    />
                  </Badge>
                )}
                {selectedLevel !== "All" && (
                  <Badge variant="secondary" className="gap-1 px-3 py-1 rounded-full">
                    {selectedLevel}
                    <X
                      size={14}
                      className="cursor-pointer"
                      onClick={() => setSelectedLevel("All")}
                    />
                  </Badge>
                )}
                {bundlesOnly && (
                  <Badge variant="secondary" className="gap-1 px-3 py-1 rounded-full">
                    Bundle Deals
                    <X
                      size={14}
                      className="cursor-pointer"
                      onClick={() => setBundlesOnly(false)}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs px-2"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-8 flex justify-between items-center">
          <p className="text-gray-600 dark:text-gray-300">
            {loading ? (
              "Loading courses..."
            ) : (
              <>
                Showing <span className="font-semibold">{indexOfFirstCourse + 1}</span> to{" "}
                <span className="font-semibold">{Math.min(indexOfLastCourse, courses.length)}</span> of{" "}
                <span className="font-semibold">{courses.length}</span> courses
              </>
            )}
          </p>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg animate-pulse">
                <div className="h-48 bg-gray-300 dark:bg-gray-700" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : currentCourses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="inline-block p-8 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Search size={48} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              Try adjusting your filters or search query
            </p>
            <Button 
              onClick={clearFilters} 
              className="bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088]"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            layout
          >
            {currentCourses.map((course, index) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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
                  isEnrolled={enrolledCourseIds.has(course.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex gap-2 items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
              <Button
                variant="outline"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg"
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current page
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  );
                })
                .map((page, index, array) => (
                  <div key={page} className="flex gap-2 items-center">
                    {/* Add ellipsis if there's a gap */}
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => paginate(page)}
                      className={`rounded-lg ${currentPage === page ? "bg-gradient-to-r from-[#FF6B35] to-[#FF914D] text-white" : ""}`}
                    >
                      {page}
                    </Button>
                  </div>
                ))}
              
              <Button
                variant="outline"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
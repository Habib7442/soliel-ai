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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      {/* Hero Section */}
      <div className="relative pt-20 pb-32 md:pt-32 md:pb-40 selection:bg-primary selection:text-white">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors px-4 py-1.5 text-sm font-bold uppercase tracking-widest rounded-full mb-8">
              Course Catalog
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 tracking-tight text-gray-900 leading-[1.1]">
              Expand Your <br />
              <span className="text-primary italic">Knowledge</span>
            </h1>
            <p className="text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto">
              Explore our curated library of expert-led courses designed to help you master new skills and advance your career.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-20 pb-32">
        {/* Search and Filters Bar */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-white/50 p-8 mb-16">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={22} />
              <Input
                type="text"
                placeholder="Search for courses, skills, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-16 border-gray-100 bg-gray-50/50 focus:bg-white rounded-2xl focus:ring-primary/20 focus:border-primary transition-all text-lg font-medium"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-52 h-16 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-primary/20 focus:border-primary text-base font-bold">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="rounded-xl font-medium focus:bg-primary/5 focus:text-primary">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Level Filter */}
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full sm:w-52 h-16 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-primary/20 focus:border-primary text-base font-bold">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                  <SelectItem value="All" className="rounded-xl font-medium focus:bg-primary/5 focus:text-primary">All Levels</SelectItem>
                  <SelectItem value="Beginner" className="rounded-xl font-medium focus:bg-primary/5 focus:text-primary">Beginner</SelectItem>
                  <SelectItem value="Intermediate" className="rounded-xl font-medium focus:bg-primary/5 focus:text-primary">Intermediate</SelectItem>
                  <SelectItem value="Advanced" className="rounded-xl font-medium focus:bg-primary/5 focus:text-primary">Advanced</SelectItem>
                </SelectContent>
              </Select>

              {/* More Filters */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-16 border-gray-100 bg-gray-50/50 rounded-2xl px-6 text-base font-black hover:bg-white hover:text-primary hover:border-primary/20 shadow-sm transition-all group">
                    <Filter size={20} className="mr-3 group-hover:rotate-12 transition-transform" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-3 bg-primary text-white rounded-full h-6 px-2 text-xs font-black ring-4 ring-primary/10">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-8 rounded-l-[3rem] border-0 backdrop-blur-3xl bg-white/95">
                  <SheetHeader className="mb-10">
                    <SheetTitle className="text-3xl font-black tracking-tight">Additional <span className="text-primary italic">Filters</span></SheetTitle>
                    <SheetDescription className="text-base font-medium">
                      Refine your course search with targeted options
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="space-y-10">
                    {/* Price Range */}
                    <div className="space-y-5">
                      <div className="flex justify-between items-center">
                        <Label className="text-lg font-black tracking-tight">Price Range</Label>
                        <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-lg text-sm">
                          ${priceRange[0]} - ${priceRange[1]}
                        </span>
                      </div>
                      <div className="px-2">
                        <Slider
                          min={0}
                          max={500}
                          step={10}
                          value={priceRange}
                          onValueChange={setPriceRange}
                          className="py-4"
                        />
                      </div>
                    </div>

                    {/* Bundles Only */}
                    <div className="flex items-center justify-between bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                      <div className="space-y-1">
                        <Label htmlFor="bundles-only" className="text-lg font-black tracking-tight cursor-pointer">
                          Bundle Deals
                        </Label>
                        <p className="text-xs text-muted-foreground font-medium">Only show discounted sets</p>
                      </div>
                      <Switch
                        id="bundles-only"
                        checked={bundlesOnly}
                        onCheckedChange={setBundlesOnly}
                      />
                    </div>

                    {/* Clear Filters */}
                    <Button
                      onClick={() => {
                        clearFilters();
                        setFiltersOpen(false);
                      }}
                      variant="outline"
                      className="w-full rounded-2xl h-16 text-lg font-black border-2 border-gray-100 hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      <X size={20} className="mr-3" />
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-black uppercase tracking-widest text-gray-400 mr-2">Filtered by:</span>
                {searchQuery && (
                  <Badge className="bg-primary/10 text-primary border-0 gap-2 px-4 py-2 rounded-xl text-xs font-bold ring-2 ring-primary/5">
                    "{searchQuery}"
                    <X
                      size={14}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {selectedCategory !== "All" && (
                  <Badge className="bg-primary/10 text-primary border-0 gap-2 px-4 py-2 rounded-xl text-xs font-bold ring-2 ring-primary/5">
                    {selectedCategory}
                    <X
                      size={14}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={() => setSelectedCategory("All")}
                    />
                  </Badge>
                )}
                {selectedLevel !== "All" && (
                  <Badge className="bg-primary/10 text-primary border-0 gap-2 px-4 py-2 rounded-xl text-xs font-bold ring-2 ring-primary/5">
                    {selectedLevel}
                    <X
                      size={14}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={() => setSelectedLevel("All")}
                    />
                  </Badge>
                )}
                {bundlesOnly && (
                  <Badge className="bg-primary/10 text-primary border-0 gap-2 px-4 py-2 rounded-xl text-xs font-bold ring-2 ring-primary/5">
                    Bundle Deals
                    <X
                      size={14}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={() => setBundlesOnly(false)}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 text-xs px-3 font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
                >
                  Reset All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary & Courses Grid */}
        <div className="mb-12">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            {loading ? (
              "Fetching excellence..."
            ) : (
              <>
                Showing <span className="text-gray-900">{indexOfFirstCourse + 1}</span> - <span className="text-gray-900">{Math.min(indexOfLastCourse, courses.length)}</span> of <span className="text-gray-900">{courses.length}</span> curated courses
              </>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-64 bg-gray-100" />
                <div className="p-8 space-y-5">
                  <div className="h-6 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-4 bg-gray-100 rounded-full" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-100 rounded-lg w-20" />
                    <div className="h-8 bg-gray-100 rounded-lg w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : currentCourses.length === 0 ? (
          <div className="text-center py-32 bg-white/50 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-gray-100 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Search size={40} className="text-gray-400" />
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tight">No courses found</h3>
              <p className="text-xl text-muted-foreground/70 mb-12 max-w-sm mx-auto leading-relaxed">
                We couldn't find any courses matching your filters. Try adjusting your search!
              </p>
              <Button 
                onClick={clearFilters} 
                className="bg-gray-900 border-0 hover:bg-primary text-white font-black text-lg h-16 px-12 rounded-2xl shadow-xl shadow-black/10 transition-all hover:scale-105"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12"
            layout
          >
            {currentCourses.map((course, index) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
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
                  thumbnail={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"}
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
          <div className="mt-20 flex justify-center">
            <div className="flex gap-3 items-center bg-white/70 backdrop-blur-xl rounded-[2rem] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100">
              <Button
                variant="ghost"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl h-12 px-6 font-bold hover:bg-primary/5 hover:text-primary disabled:opacity-30"
              >
                Prev
              </Button>
              
              <div className="flex items-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-3 text-gray-300 font-bold">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "ghost"}
                        onClick={() => paginate(page)}
                        className={`w-12 h-12 rounded-xl text-base font-black transition-all ${
                          currentPage === page 
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                            : "hover:bg-primary/5 hover:text-primary"
                        }`}
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
              </div>
              
              <Button
                variant="ghost"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl h-12 px-6 font-bold hover:bg-primary/5 hover:text-primary disabled:opacity-30"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Bottom Spacer */}
      <div className="h-20" />
    </div>
  );
}

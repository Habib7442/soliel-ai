import { getBundleById, checkBundleAccess } from "@/server/actions/bundle.actions";
import { createServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Clock, 
  BookOpen, 
  TrendingDown, 
  CheckCircle2, 
  User,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap
} from "lucide-react";
import Image from "next/image";

interface BundleDetailsPageProps {
  params: Promise<{
    bundleId: string;
  }>;
}

export async function generateMetadata({ params }: BundleDetailsPageProps) {
  const { bundleId } = await params;
  const result = await getBundleById(bundleId);
  
  if (!result.success || !result.data) {
    return {
      title: "Bundle Not Found",
    };
  }

  return {
    title: `${result.data.name} - Course Bundle`,
    description: result.data.description || `Get ${result.data.bundle_courses.length} courses together and save ${result.data.discount_percent}%`,
  };
}

export default async function BundleDetailsPage({ params }: BundleDetailsPageProps) {
  const { bundleId } = await params;
  const result = await getBundleById(bundleId);

  if (!result.success || !result.data) {
    redirect("/bundles");
  }

  const bundle = result.data;
  const courses = bundle.bundle_courses || [];
  
  // Calculate stats
  const courseCount = courses.length;
  const totalDuration = courses.reduce((sum, bc) => {
    const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
    return sum + (course?.estimated_duration_hours || 0);
  }, 0);
  
  const originalPrice = courses.reduce((sum, bc) => {
    const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
    return sum + (course?.price_cents || 0);
  }, 0);

  const savings = originalPrice - bundle.price_cents;

  // Check if user has access
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let hasAccess = false;
  if (user) {
    const accessResult = await checkBundleAccess(user.id, bundleId);
    hasAccess = accessResult.hasAccess || false;
  }

  // All learning outcomes from all courses
  const allLearningOutcomes = courses.flatMap((bc) => {
    const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
    return course?.learning_outcomes || [];
  }).slice(0, 8); // Show first 8

  return (
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white pb-20">
      {/* Background Pattern & Blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      {/* Header Container */}
      <div className="relative pt-6 pb-6 border-b border-gray-100/50 backdrop-blur-sm bg-white/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-4">
           <Button variant="ghost" size="sm" asChild className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-bold">
              <Link href="/bundles">
                 <ArrowLeft className="h-4 w-4 mr-2" />
                 All Bundles
              </Link>
           </Button>
           
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Bundle Offer</span>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl pt-10 relative z-10">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Bundle Header */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                 <Badge className="rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest bg-red-100 text-red-600 border-0 hover:bg-red-200">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {bundle.discount_percent}% Discount
                 </Badge>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Premium Collection</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-[1.1] mb-6">{bundle.name}</h1>
              <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
                {bundle.description || `A comprehensive collection of ${courseCount} courses designed to help you master related skills.`}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 mt-8">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <BookOpen className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Content</p>
                      <p className="font-bold text-gray-900">{courseCount} Courses</p>
                   </div>
                </div>
                {totalDuration > 0 && (
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                         <Clock className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Duration</p>
                         <p className="font-bold text-gray-900">{totalDuration} Hours</p>
                      </div>
                   </div>
                )}
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <Sparkles className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Value</p>
                      <p className="font-bold text-gray-900">Premium</p>
                   </div>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            {allLearningOutcomes.length > 0 && (
              <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black">Outcomes & Skills</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    {allLearningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/50 transition-colors">
                        <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                           <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 leading-relaxed">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Courses Included */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                 <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                    <BookOpen className="h-4 w-4" />
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">Included Courses</h2>
              </div>
              
              <div className="space-y-4">
                {courses.map((bc, index) => {
                  const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
                  if (!course) return null;

                  const instructor = Array.isArray(course.profiles) ? course.profiles[0] : course.profiles;

                  return (
                    <Card key={course.id} className="group border-0 bg-white shadow-sm hover:shadow-xl hover:shadow-gray-200/50 rounded-[2rem] overflow-hidden transition-all duration-300">
                      <CardContent className="p-4 flex flex-col sm:flex-row gap-6 items-center sm:items-stretch">
                        {/* Course Thumbnail */}
                        <div className="relative w-full sm:w-48 h-48 sm:h-auto rounded-[1.5rem] overflow-hidden flex-shrink-0 bg-gray-100">
                          {course.thumbnail_url ? (
                            <Image
                              src={course.thumbnail_url}
                              alt={course.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <BookOpen className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Course Info */}
                        <div className="flex-1 py-2 flex flex-col justify-center">
                           <div className="flex flex-wrap items-center gap-3 mb-3">
                              <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-0 rounded-lg px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                                 {course.level}
                              </Badge>
                              {course.category && (
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{course.category}</span>
                              )}
                           </div>
                           
                           <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                           
                           {course.subtitle && (
                              <p className="text-sm text-muted-foreground font-medium line-clamp-2 mb-4">
                                {course.subtitle}
                              </p>
                           )}

                           <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium mt-auto">
                              {instructor?.full_name && (
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                     <User className="w-3 h-3 text-gray-500" />
                                  </div>
                                  <span>{instructor.full_name}</span>
                                </div>
                              )}
                              {course.estimated_duration_hours && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span>{course.estimated_duration_hours}h</span>
                                </div>
                              )}
                           </div>
                        </div>

                        {/* Vertical Saver Line */}
                        <div className="hidden sm:flex flex-col items-end justify-center pl-6 border-l border-gray-100 min-w-[120px]">
                           <span className="text-xs font-bold text-muted-foreground line-through mb-1">
                              ${(course.price_cents / 100).toFixed(2)}
                           </span>
                           <span className="text-sm font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                              Included
                           </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
               <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
                 {/* Decorative Header */}
                 <div className="h-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
                 
                 {/* Cover Image */}
                 {bundle.cover_url && (
                   <div className="relative h-48 w-full p-2 pb-0">
                      <div className="relative h-full w-full rounded-[2rem] overflow-hidden shadow-sm">
                         <Image
                           src={bundle.cover_url}
                           alt={bundle.name}
                           fill
                           className="object-cover"
                         />
                      </div>
                   </div>
                 )}
   
                 <CardContent className="p-8">
                   {/* Pricing */}
                   <div className="mb-8 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Bundle Price</p>
                     <div className="flex items-center justify-center gap-3 mb-2">
                       <span className="text-5xl font-black text-gray-900 tracking-tighter">
                         ${(bundle.price_cents / 100).toFixed(2)}
                       </span>
                     </div>
                     
                     {savings > 0 && (
                        <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                           <TrendingDown className="w-3 h-3 text-green-600" />
                           <span className="text-xs font-bold text-green-700">
                              Save ${(savings / 100).toFixed(2)}
                           </span>
                        </div>
                     )}
                     
                     <div className="mt-4 text-xs font-medium text-muted-foreground">
                        Normally ${(originalPrice / 100).toFixed(2)} individually
                     </div>
                   </div>
   
                   {/* Purchase Button */}
                   {hasAccess ? (
                     <div className="space-y-4">
                       <Badge className="w-full justify-center h-12 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 border-0 text-sm font-bold">
                         <CheckCircle2 className="w-4 h-4 mr-2" />
                         Owned (All Items)
                       </Badge>
                       <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-bold border-2 border-gray-100 hover:border-primary hover:text-primary transition-all">
                         <Link href="/student-dashboard">Go to Dashboard</Link>
                       </Button>
                     </div>
                   ) : (
                     <Button 
                       asChild 
                       size="lg" 
                       className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black tracking-tight shadow-xl shadow-black/10 transition-all active:scale-95 text-base"
                     >
                       <Link href={`/checkout?bundle=${bundleId}`}>
                         Buy Bundle Now
                       </Link>
                     </Button>
                   )}
   
                   {/* Bundle Features */}
                   <div className="mt-8 space-y-4">
                     <div className="flex items-start gap-4">
                       <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">Instant Access</p>
                          <p className="text-xs text-muted-foreground font-medium">Start learning immediately after purchase</p>
                       </div>
                     </div>
                     <div className="flex items-start gap-4">
                       <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">Lifetime Warranty</p>
                          <p className="text-xs text-muted-foreground font-medium">Access your courses forever, updates included</p>
                       </div>
                     </div>
                     <div className="flex items-start gap-4">
                       <div className="h-8 w-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-gray-900">Certificate Included</p>
                          <p className="text-xs text-muted-foreground font-medium">Earn certificates for every course completed</p>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

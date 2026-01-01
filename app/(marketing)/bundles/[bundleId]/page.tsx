import { getBundleById, checkBundleAccess } from "@/server/actions/bundle.actions";
import { createServerClient } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Package, 
  Clock, 
  BookOpen, 
  TrendingDown, 
  CheckCircle2, 
  Star,
  User,
  ArrowLeft 
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/bundles">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bundles
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bundle Header */}
            <div>
              <Badge className="mb-4 bg-[#FF0000] text-white text-lg px-4 py-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                {bundle.discount_percent}% OFF
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{bundle.name}</h1>
              <p className="text-xl text-muted-foreground mb-6">
                {bundle.description || `A comprehensive collection of ${courseCount} courses designed to help you master related skills`}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#FF0000]" />
                  <span>{courseCount} {courseCount === 1 ? 'Course' : 'Courses'}</span>
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FF0000]" />
                    <span>{totalDuration} hours total content</span>
                  </div>
                )}
              </div>
            </div>

            {/* What You'll Learn */}
            {allLearningOutcomes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">What You&apos;ll Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {allLearningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Courses in Bundle */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Courses Included</h2>
              <div className="space-y-4">
                {courses.map((bc, index) => {
                  const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
                  if (!course) return null;

                  const instructor = Array.isArray(course.profiles) ? course.profiles[0] : course.profiles;

                  return (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Course Thumbnail */}
                          <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#FF0000]/20 to-[#CC0000]/20">
                            {course.thumbnail_url ? (
                              <Image
                                src={course.thumbnail_url}
                                alt={course.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <BookOpen className="w-8 h-8 text-[#FF0000] opacity-50" />
                              </div>
                            )}
                          </div>

                          {/* Course Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                                {course.subtitle && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {course.subtitle}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="flex-shrink-0">
                                {course.level}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {instructor?.full_name && (
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span>{instructor.full_name}</span>
                                </div>
                              )}
                              {course.estimated_duration_hours && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{course.estimated_duration_hours}h</span>
                                </div>
                              )}
                            </div>

                            {/* Original Price (crossed out) */}
                            <div className="mt-2">
                              <span className="text-sm text-muted-foreground line-through">
                                ${(course.price_cents / 100).toFixed(2)}
                              </span>
                            </div>
                          </div>
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
            <Card className="sticky top-8 border-2 border-[#FF0000]/20">
              {/* Cover Image */}
              {bundle.cover_url && (
                <div className="relative h-48 w-full">
                  <Image
                    src={bundle.cover_url}
                    alt={bundle.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <CardContent className="p-6">
                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-[#FF0000]">
                      ${(bundle.price_cents / 100).toFixed(2)}
                    </span>
                    {originalPrice > bundle.price_cents && (
                      <span className="text-xl text-muted-foreground line-through">
                        ${(originalPrice / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {savings > 0 && (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        You save ${(savings / 100).toFixed(2)} ({bundle.discount_percent}% off)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Individual course total: ${(originalPrice / 100).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                {hasAccess ? (
                  <div className="space-y-4">
                    <Badge className="w-full justify-center py-2 bg-green-600">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      You own all courses in this bundle
                    </Badge>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/student-dashboard">Go to Dashboard</Link>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    asChild 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:opacity-90 text-lg"
                  >
                    <Link href={`/checkout?bundle=${bundleId}`}>
                      Buy Bundle Now
                    </Link>
                  </Button>
                )}

                {/* Bundle Features */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Lifetime access to all courses</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Certificate of completion for each course</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Learn at your own pace</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Instant activation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

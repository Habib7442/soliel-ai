import { getAllBundles } from "@/server/actions/bundle.actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Package, Clock, BookOpen, TrendingDown } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Course Bundles - Save More with Bundle Deals",
  description: "Explore our curated course bundles and save up to 20% on multiple courses",
};

export default async function BundlesPage() {
  const result = await getAllBundles();
  const bundles = result.success ? result.data : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/10 via-[#CC0000]/10 to-[#FF0000]/10" />
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-[#FF0000] text-white">
            <TrendingDown className="w-3 h-3 mr-1" />
            Save up to 20%
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-[#FF0000] to-[#CC0000] bg-clip-text text-transparent">
            Course Bundles
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Master multiple skills with our curated course bundles. Buy 2 courses and get 10% off, 
            or buy 3+ courses and save 20% on your entire purchase.
          </p>
          
          {/* Discount Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
            <Card className="border-2 border-[#FF0000]/20">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-[#FF0000] mb-2">10% OFF</div>
                <p className="text-muted-foreground">When you buy 2 courses together</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-[#CC0000]/20">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-[#CC0000] mb-2">20% OFF</div>
                <p className="text-muted-foreground">When you buy 3 or more courses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bundles Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {bundles && bundles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bundles.map((bundle) => {
                const courses = bundle.bundle_courses || [];
                const courseCount = courses.length;
                const totalDuration = courses.reduce((sum, bc) => {
                  const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
                  return sum + (course?.estimated_duration_hours || 0);
                }, 0);
                
                // Calculate original price
                const originalPrice = courses.reduce((sum, bc) => {
                  const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
                  return sum + (course?.price_cents || 0);
                }, 0);

                return (
                  <Card 
                    key={bundle.id} 
                    className="group hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border-2 hover:border-[#FF0000]/30"
                  >
                    {/* Bundle Cover Image */}
                    <div className="relative h-48 bg-gradient-to-br from-[#FF0000]/20 to-[#CC0000]/20 overflow-hidden">
                      {bundle.cover_url ? (
                        <Image
                          src={bundle.cover_url}
                          alt={bundle.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-20 h-20 text-[#FF0000] opacity-50" />
                        </div>
                      )}
                      
                      {/* Discount Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-[#FF0000] text-white font-bold text-lg px-3 py-1">
                          {bundle.discount_percent}% OFF
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="text-2xl group-hover:text-[#FF0000] transition-colors">
                        {bundle.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {bundle.description || `A collection of ${courseCount} courses to master related skills`}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1">
                      {/* Bundle Stats */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{courseCount} {courseCount === 1 ? 'Course' : 'Courses'}</span>
                        </div>
                        {totalDuration > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{totalDuration}h total</span>
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-[#FF0000]">
                            ${(bundle.price_cents / 100).toFixed(2)}
                          </span>
                          {originalPrice > bundle.price_cents && (
                            <span className="text-lg text-muted-foreground line-through">
                              ${(originalPrice / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {originalPrice > bundle.price_cents && (
                          <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                            You save ${((originalPrice - bundle.price_cents) / 100).toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Course List Preview */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold mb-2">Includes:</p>
                        <ul className="space-y-1">
                          {courses.slice(0, 3).map((bc, index) => {
                            const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
                            return (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-[#FF0000] mt-1">•</span>
                                <span className="line-clamp-1">{course?.title || 'Course'}</span>
                              </li>
                            );
                          })}
                          {courseCount > 3 && (
                            <li className="text-sm text-muted-foreground italic">
                              +{courseCount - 3} more {courseCount - 3 === 1 ? 'course' : 'courses'}
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-4">
                      <Button asChild className="w-full bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:opacity-90">
                        <Link href={`/bundles/${bundle.id}`}>
                          View Bundle Details
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <Package className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">No bundles available yet</h2>
              <p className="text-muted-foreground mb-8">
                We&apos;re working on creating amazing course bundles for you. Check back soon!
              </p>
              <Button asChild>
                <Link href="/courses">Browse Individual Courses</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Why Bundle Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Course Bundles?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <TrendingDown className="w-12 h-12 text-[#FF0000] mb-4" />
                <CardTitle>Save Money</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get multiple courses at a discounted price. The more you buy, the more you save!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="w-12 h-12 text-[#FF0000] mb-4" />
                <CardTitle>Comprehensive Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Master related skills with carefully curated course collections designed to complement each other.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Package className="w-12 h-12 text-[#FF0000] mb-4" />
                <CardTitle>Convenient Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Purchase once and get instant access to all courses in the bundle. Learn at your own pace.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

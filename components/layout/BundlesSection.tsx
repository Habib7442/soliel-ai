import { getAllBundles } from "@/server/actions/bundle.actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Package, Clock, BookOpen, TrendingDown, ArrowRight } from "lucide-react";
import Image from "next/image";

export async function BundlesSection() {
  const result = await getAllBundles();
  const bundles = result.success ? result.data?.slice(0, 3) || [] : []; // Show first 3 bundles

  if (bundles.length === 0) {
    return null; // Don't show section if no bundles
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#FF0000] text-white text-sm px-4 py-1">
            <TrendingDown className="w-4 h-4 mr-1" />
            Save up to 20%
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#FF0000] to-[#CC0000] bg-clip-text text-transparent">
            Course Bundles
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Master multiple skills and save big with our curated course bundles
          </p>
        </div>

        {/* Bundles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 max-w-7xl mx-auto">
          {bundles.map((bundle) => {
            const courses = bundle.bundle_courses || [];
            const courseCount = courses.length;
            const totalDuration = courses.reduce((sum, bc) => {
              const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
              return sum + (course?.estimated_duration_hours || 0);
            }, 0);
            
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
                  <CardTitle className="text-xl group-hover:text-[#FF0000] transition-colors line-clamp-2">
                    {bundle.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {bundle.description || `${courseCount} courses to master related skills`}
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
                        <span>{totalDuration}h</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#FF0000]">
                      ${(bundle.price_cents / 100).toFixed(2)}
                    </span>
                    {originalPrice > bundle.price_cents && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${(originalPrice / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {originalPrice > bundle.price_cents && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">
                      Save ${((originalPrice - bundle.price_cents) / 100).toFixed(2)}
                    </p>
                  )}
                </CardContent>

                <CardFooter>
                  <Button asChild className="w-full bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:opacity-90">
                    <Link href={`/bundles/${bundle.id}`}>
                      View Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* View All Bundles Button */}
        <div className="text-center">
          <Button asChild size="lg" variant="outline" className="border-[#FF0000] text-[#FF0000] hover:bg-[#FF0000] hover:text-white">
            <Link href="/bundles">
              View All Bundles
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

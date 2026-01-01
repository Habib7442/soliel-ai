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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-gray-950 border-b dark:border-gray-800 pb-32 pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5 rounded-full px-4 py-1.5 text-sm uppercase tracking-wider font-semibold">
              <TrendingDown className="w-3 h-3 mr-2 inline-block" />
              Bundle Deals
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
              More Learning. <span className="text-primary">Less Cost.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
              Master complete skill sets with our curated bundles. Save up to 20% compared to individual course prices.
            </p>

             {/* Discount Info Cards */}
             <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4 flex items-center justify-center gap-4 shadow-sm">
                <div className="text-2xl font-bold text-primary">10% OFF</div>
                <div className="text-sm text-left text-muted-foreground leading-tight">
                  <span className="font-semibold text-gray-900 dark:text-white block">Starter Deal</span>
                  Buy 2 courses together
                </div>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4 flex items-center justify-center gap-4 shadow-sm">
                <div className="text-2xl font-bold text-primary">20% OFF</div>
                <div className="text-sm text-left text-muted-foreground leading-tight">
                  <span className="font-semibold text-gray-900 dark:text-white block">Pro Bundle</span>
                  Buy 3+ courses together
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-20">
        {/* Bundles Grid */}
        <div className="mb-20">
          {bundles && bundles.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8">
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
                  <div key={bundle.id} className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]">
                    <Card 
                      className="group hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-primary/20 bg-white dark:bg-gray-900 rounded-2xl h-full"
                    >
                      {/* Bundle Cover Image */}
                      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                        {bundle.cover_url ? (
                          <Image
                            src={bundle.cover_url}
                            alt={bundle.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-16 h-16 text-primary/20" />
                          </div>
                        )}
                        
                        {/* Discount Badge */}
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-3 py-1 shadow-lg">
                            {bundle.discount_percent}% OFF
                          </Badge>
                        </div>
                        
                        {/* Bundle Label */}
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="bg-white/90 dark:bg-black/90 backdrop-blur-sm text-xs font-medium">
                            Bundle Deal
                          </Badge>
                        </div>
                      </div>

                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-3">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{courseCount} Courses</span>
                          </div>
                          {totalDuration > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{totalDuration}h content</span>
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                          {bundle.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-2 text-sm leading-relaxed">
                          {bundle.description || `A complete collection of ${courseCount} premium courses to elevate your skills.`}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 py-2">
                         {/* Course List Preview */}
                         <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Includes</p>
                          <ul className="space-y-2">
                            {courses.slice(0, 3).map((bc, index) => {
                              const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
                              return (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                  <span className="line-clamp-1">{course?.title || 'Course'}</span>
                                </li>
                              );
                            })}
                            {courseCount > 3 && (
                              <li className="text-xs text-muted-foreground pl-3.5 font-medium">
                                +{courseCount - 3} more courses...
                              </li>
                            )}
                          </ul>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-4 pb-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 mt-4">
                         <div className="flex flex-col">
                            {originalPrice > bundle.price_cents && (
                              <span className="text-xs text-muted-foreground line-through mb-0.5">
                                ${(originalPrice / 100).toFixed(2)}
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                               <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              ${(bundle.price_cents / 100).toFixed(2)}
                            </span>
                             {originalPrice > bundle.price_cents && (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 text-[10px] px-1.5 h-5">
                                Save ${((originalPrice - bundle.price_cents) / 100).toFixed(0)}
                              </Badge>
                            )}
                            </div>
                         </div>
                        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 rounded-xl px-6">
                          <Link href={`/bundles/${bundle.id}`}>
                            View Bundle
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Package className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No bundles available yet</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                We&apos;re currently curating amazing course collections for you. In the meantime, explore our individual courses.
              </p>
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/courses">Browse All Courses</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
       
       {/* Why Choose Section */}
       <div className="bg-white dark:bg-gray-950 py-24 border-t border-gray-100 dark:border-gray-800">
         <div className="container mx-auto px-4 max-w-7xl">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Choose Course Bundles?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Get more value for your investment with our carefully structured learning paths.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
             <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 hover:-translate-y-1 transition-transform duration-300">
               <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
                 <TrendingDown className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-3">Cost Effective</h3>
               <p className="text-muted-foreground leading-relaxed">
                 Save significantly compared to buying individual courses. Bundles are priced to give you the best value for your learning journey.
               </p>
             </div>
             
             <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 hover:-translate-y-1 transition-transform duration-300">
               <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                 <BookOpen className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-3">Structured Learning</h3>
               <p className="text-muted-foreground leading-relaxed">
                 Don&apos;t guess what to learn next. Our bundles follow a logical progression, taking you from basics to advanced topics smoothly.
               </p>
             </div>
             
             <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 hover:-translate-y-1 transition-transform duration-300">
               <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                 <Package className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-3">All-in-One Access</h3>
               <p className="text-muted-foreground leading-relaxed">
                 One purchase unlocks a complete library of related content. Get lifetime access to all future updates for every course in the bundle.
               </p>
             </div>
           </div>
         </div>
       </div>

    </div>
  );
}

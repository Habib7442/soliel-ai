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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/2 left-0 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      {/* Hero Section */}
      <div className="relative pt-20 pb-32 md:pt-32 md:pb-48 selection:bg-primary selection:text-white">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors px-4 py-1.5 text-sm font-bold uppercase tracking-widest rounded-full mb-8">
              <TrendingDown className="w-4 h-4 mr-2 inline-block" />
              Bundle Deals
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 tracking-tight text-gray-900 leading-[1.1]">
              More Learning. <br />
              <span className="text-primary italic">Less Cost.</span>
            </h1>
            <p className="text-xl text-muted-foreground/80 leading-relaxed mb-12 max-w-2xl mx-auto">
              Master complete skill sets with our curated bundles. Save up to 20% compared to individual course prices.
            </p>

             {/* Discount Info Cards */}
             <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 flex items-center justify-center gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="text-3xl font-black text-primary">10% <span className="text-sm block font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">OFF</span></div>
                <div className="h-10 w-px bg-gray-100" />
                <div className="text-left">
                  <span className="font-black text-gray-900 block text-lg leading-tight uppercase tracking-tight">Starter Deal</span>
                  <span className="text-sm text-muted-foreground font-medium">Buy 2 courses together</span>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 flex items-center justify-center gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="text-3xl font-black text-primary">20% <span className="text-sm block font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">OFF</span></div>
                <div className="h-10 w-px bg-gray-100" />
                <div className="text-left">
                  <span className="font-black text-gray-900 block text-lg leading-tight uppercase tracking-tight">Pro Bundle</span>
                  <span className="text-sm text-muted-foreground font-medium">Buy 3+ courses together</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl -mt-20 relative z-20 pb-32">
        {/* Bundles Grid */}
        <div className="mb-20">
          {bundles && bundles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
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
                  <div key={bundle.id} className="group h-full">
                    <Card 
                      className="h-full border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col"
                    >
                      {/* Bundle Cover Image */}
                      <div className="relative h-52 bg-gray-100 overflow-hidden">
                        {bundle.cover_url ? (
                          <Image
                            src={bundle.cover_url}
                            alt={bundle.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Package className="w-16 h-16 text-primary/10" />
                          </div>
                        )}
                        
                        {/* Discount Badge */}
                        <div className="absolute top-5 right-5">
                          <Badge className="bg-primary hover:bg-primary/90 text-white font-black text-xs px-4 py-1.5 rounded-xl shadow-xl shadow-primary/30">
                            {bundle.discount_percent}% OFF
                          </Badge>
                        </div>
                        
                        {/* Bundle Label */}
                        <div className="absolute top-5 left-5">
                          <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg">
                            Curated Bundle
                          </Badge>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>

                      <CardHeader className="pb-3 pt-6 px-7">
                        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary/60" />
                            <span>{courseCount} Courses</span>
                          </div>
                          {totalDuration > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary/60" />
                              <span>{totalDuration}h content</span>
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-xl font-black mb-2 group-hover:text-primary transition-colors leading-tight">
                          {bundle.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm font-medium leading-relaxed">
                          {bundle.description || `A complete collection of ${courseCount} premium courses to elevate your skills.`}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="px-7 py-2 flex-grow">
                         {/* Course List Preview */}
                         <div className="bg-gray-50/50 rounded-[2rem] p-5 border border-gray-100/50">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Inside this bundle</p>
                          <ul className="space-y-2.5">
                            {courses.slice(0, 3).map((bc, index) => {
                              const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
                              return (
                                <li key={index} className="text-[13px] text-gray-700 font-bold flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <TrendingDown className="w-2.5 h-2.5" />
                                  </div>
                                  <span className="line-clamp-1">{course?.title || 'Course'}</span>
                                </li>
                              );
                            })}
                            {courseCount > 3 && (
                              <li className="text-[10px] text-gray-400 pl-7 font-bold uppercase tracking-widest">
                                +{courseCount - 3} more modules
                              </li>
                            )}
                          </ul>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-6 pb-8 px-7 flex flex-col items-stretch gap-6 border-t border-gray-50 mt-4">
                         <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                               {originalPrice > bundle.price_cents && (
                                 <span className="text-[10px] text-gray-400 line-through mb-0.5 font-bold">
                                   ${(originalPrice / 100).toFixed(2)}
                                 </span>
                               )}
                               <span className="text-2xl font-black text-gray-900 leading-none">
                                 ${(bundle.price_cents / 100).toFixed(2)}
                               </span>
                            </div>
                            
                            {originalPrice > bundle.price_cents && (
                              <Badge className="bg-green-100 text-green-600 border-0 text-[10px] font-black tracking-widest px-3 h-7 rounded-lg">
                                SAVE ${( (originalPrice - bundle.price_cents) / 100).toFixed(0)}
                              </Badge>
                            )}
                         </div>

                        <Button asChild className="w-full bg-gray-900 border-0 hover:bg-primary text-white font-black text-xs h-12 rounded-xl shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-95 transition-all">
                          <Link href={`/bundles/${bundle.id}`}>
                            View Bundle Details
                          </Link>
                        </Button>
                      </CardFooter>

                    </Card>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-32 bg-white/50 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-gray-100 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
               
               <div className="relative z-10">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                   <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-3xl font-black mb-4 tracking-tight">No bundles available yet</h2>
                <p className="text-xl text-muted-foreground/70 mb-12 max-w-lg mx-auto leading-relaxed">
                  We're currently curating amazing course collections for you. In the meantime, explore our individual courses.
                </p>
                <Button asChild size="xl" className="rounded-2xl h-16 px-12 bg-gray-900 text-white font-black text-lg shadow-xl shadow-black/10 hover:bg-primary transition-all">
                  <Link href="/courses">Browse All Courses</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
       
       {/* Why Choose Section */}
       <div className="relative py-24 md:py-32 border-t border-gray-50 overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
         <div className="container mx-auto px-4 max-w-7xl relative z-10">
           <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Why Choose Course <span className="text-primary italic">Bundles?</span></h2>
              <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto font-medium">Get more value for your investment with our carefully structured learning paths.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
             {[
               {
                 title: "Cost Effective",
                 description: "Save significantly compared to buying individual courses. Bundles are priced to give you the best value.",
                 icon: TrendingDown,
                 color: "bg-orange-100 text-orange-600"
               },
               {
                 title: "Structured Learning",
                 description: "Our bundles follow a logical progression, taking you from basics to advanced topics smoothly.",
                 icon: BookOpen,
                 color: "bg-blue-100 text-blue-600"
               },
               {
                 title: "All-in-One Access",
                 description: "One purchase unlocks a complete library of related content. Get lifetime access to every course.",
                 icon: Package,
                 color: "bg-indigo-100 text-indigo-600"
               }
             ].map((feature, i) => (
               <div key={i} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 group">
                 <div className={`w-16 h-16 rounded-[1.25rem] ${feature.color} flex items-center justify-center mb-10 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-lg shadow-black/5`}>
                   <feature.icon className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.title}</h3>
                 <p className="text-muted-foreground/80 leading-relaxed font-semibold">
                   {feature.description}
                 </p>
               </div>
             ))}
           </div>
         </div>
       </div>

       {/* Bottom Spacer */}
       <div className="h-20" />
    </div>
  );
}


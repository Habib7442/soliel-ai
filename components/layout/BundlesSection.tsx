import { getAllBundles } from "@/server/actions/bundle.actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Package, Clock, BookOpen, TrendingDown, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

export async function BundlesSection() {
  const result = await getAllBundles();
  const bundles = result.success ? result.data?.slice(0, 3) || [] : []; // Show first 3 bundles

  if (bundles.length === 0) {
    return null; // Don't show section if no bundles
  }

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Value Bundles</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Curated <span className="text-primary italic">Skill</span> Paths.
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Save up to 20% when you enroll in our expert-curated bundles. Master a complete career path in one go.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
          {bundles.map((bundle) => {
            const courses = bundle.bundle_courses || [];
            const courseCount = courses.length;
            const totalDuration = courses.reduce((sum: number, bc: any) => {
              const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
              return sum + (course?.estimated_duration_hours || 0);
            }, 0);
            
            const originalPrice = courses.reduce((sum: number, bc: any) => {
              const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
              return sum + (course?.price_cents || 0);
            }, 0);

            return (
              <div 
                key={bundle.id} 
                className="group relative flex flex-col bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] transition-all duration-500"
              >
                {/* Bundle Cover Image */}
                <div className="relative h-64 overflow-hidden">
                  {bundle.cover_url ? (
                    <Image
                      src={bundle.cover_url}
                      alt={bundle.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <Package className="w-24 h-24 text-primary opacity-30" />
                    </div>
                  )}
                  
                  {/* Floating Discount Badge */}
                  <div className="absolute top-6 right-6 backdrop-blur-md bg-primary/90 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-xl shadow-primary/20">
                    -{bundle.discount_percent}% OFF
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                    <div className="flex gap-4">
                       <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest">
                        <BookOpen className="w-4 h-4" />
                        <span>{courseCount} Courses</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest">
                        <Clock className="w-4 h-4" />
                        <span>{totalDuration}h Total</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-bold mb-3 tracking-tight group-hover:text-primary transition-colors">
                    {bundle.name}
                  </h3>
                  
                  <p className="text-muted-foreground/80 text-sm leading-relaxed mb-8 flex-1">
                    {bundle.description || `${courseCount} courses handpicked to help you master ${bundle.name} from scratch.`}
                  </p>

                  <div className="flex flex-col gap-5 pt-6 border-t border-gray-100">
                    <div className="flex flex-col">
                      {originalPrice > bundle.price_cents && (
                        <span className="text-sm text-muted-foreground line-through opacity-50 mb-1">
                          ${(originalPrice / 100).toFixed(2)}
                        </span>
                      )}
                      <span className="text-4xl font-black text-gray-900 leading-none tracking-tighter">
                        ${(bundle.price_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <Button asChild size="xl" className="w-full rounded-2xl bg-gray-900 hover:bg-primary text-white font-bold h-16 shadow-xl shadow-black/5 transition-all hover:scale-[1.02] active:scale-95 border-0">
                      <Link href={`/bundles/${bundle.id}`} className="flex items-center justify-center gap-2">
                        Enroll Path
                        <ArrowRight className="w-5 h-5 mt-0.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button asChild size="xl" variant="outline" className="rounded-2xl group border-gray-200 hover:border-primary text-gray-900 hover:text-primary font-bold px-12 transition-all">
            <Link href="/bundles" className="flex items-center gap-2">
              Explore All Paths
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

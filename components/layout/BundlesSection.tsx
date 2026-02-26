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
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {bundles.map((bundle) => {
            const courses = bundle.bundle_courses || [];
            const courseCount = courses.length;
            
            const originalPrice = courses.reduce((sum: number, bc: any) => {
              const course = Array.isArray(bc.courses) ? bc.courses[0] : bc.courses;
              return sum + (course?.price_cents || 0);
            }, 0);

            return (
              <div 
                key={bundle.id} 
                className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300 h-full"
              >
                {/* Bundle Cover Image */}
                <div className="relative h-32 overflow-hidden flex-shrink-0">
                  {bundle.cover_url ? (
                    <Image
                      src={bundle.cover_url}
                      alt={bundle.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                      <Package className="w-12 h-12 text-primary opacity-20" />
                    </div>
                  )}
                  
                  {/* Floating Discount Badge */}
                  {bundle.discount_percent > 0 && (
                    <div className="absolute top-2 right-2 backdrop-blur-md bg-primary/90 text-white font-black text-[10px] px-2 py-1 rounded-full shadow-lg">
                      -{bundle.discount_percent}%
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <div className="backdrop-blur-md bg-black/30 border border-white/10 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {courseCount} Courses
                    </div>
                  </div>
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Package className="w-2.5 h-2.5" />
                      Bundle
                    </span>
                  </div>

                  <h3 className="text-sm font-bold mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {bundle.name}
                  </h3>
                  
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      {originalPrice > bundle.price_cents && (
                        <span className="text-xs text-gray-400 line-through leading-none">
                          ${(originalPrice / 100).toFixed(0)}
                        </span>
                      )}
                      <span className="text-lg font-black text-gray-900 leading-none">
                        ${(bundle.price_cents / 100).toFixed(0)}
                      </span>
                    </div>
                    
                    <Button asChild size="sm" className="h-8 px-3 rounded-lg text-xs font-bold border-0 bg-gray-900 hover:bg-primary text-white transition-all">
                      <Link href={`/bundles/${bundle.id}`} className="flex items-center justify-center gap-1">
                        Enroll
                        <ArrowRight className="w-3 h-3" />
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

import { Skeleton } from "@/components/ui/skeleton";

export default function CourseManageLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white pb-20">
      {/* Background Pattern & Blobs (mirrored from page.tsx for consistency) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      
      {/* Header Container */}
      <div className="relative pt-6 pb-6 border-b border-gray-100/50 backdrop-blur-sm bg-white/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-4">
           <Skeleton className="h-9 w-24 rounded-xl" />
           <Skeleton className="h-4 w-32 rounded-full" />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl pt-10 relative z-10">
        
        {/* Course Header Info */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between mb-12">
           <div className="space-y-4 max-w-3xl w-full">
              <div className="flex items-center gap-3">
                 <Skeleton className="h-6 w-20 rounded-lg" />
                 <Skeleton className="h-4 w-24 rounded-full" />
              </div>
              <Skeleton className="h-12 w-3/4 rounded-xl" />
              <Skeleton className="h-6 w-1/2 rounded-lg" />
           </div>
           
           <Skeleton className="h-14 w-40 rounded-2xl" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-32 rounded-[2.5rem]" />
           ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-8">
          <div className="flex gap-8 border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-20 flex-shrink-0" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <Skeleton className="h-96 rounded-[2rem]" />
            </div>
            <div className="space-y-6">
               <Skeleton className="h-64 rounded-[2rem]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

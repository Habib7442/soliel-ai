import { Skeleton } from "@/components/ui/skeleton";

export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen relative bg-white pb-20">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 border-b border-gray-100/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="flex gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-14 w-40 rounded-2xl" />
                <Skeleton className="h-14 w-40 rounded-2xl" />
              </div>
            </div>
            <Skeleton className="aspect-video w-full rounded-[3rem]" />
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 pt-12 max-w-7xl">
        <div className="flex gap-10 border-b border-gray-100 pb-2 mb-10 overflow-x-auto no-scrollbar">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-24 flex-shrink-0" />)}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-64 w-full rounded-[2.5rem]" />
            <Skeleton className="h-96 w-full rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    </div>
  );
}

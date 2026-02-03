import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboardLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white pb-20">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />
      
      {/* Hero Welcome Section */}
      <div className="relative pt-8 pb-4 lg:pt-12 lg:pb-6 border-b border-gray-100/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 w-full lg:w-auto">
               <Skeleton className="h-6 w-32 rounded-full" />
               <Skeleton className="h-16 w-80 rounded-xl" />
               <Skeleton className="h-5 w-96 rounded-lg" />
            </div>
            <Skeleton className="h-14 w-48 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-12 max-w-7xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-32 rounded-[2.5rem]" />
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 space-y-10">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[1, 2, 3, 4].map((i) => (
                   <Skeleton key={i} className="h-96 rounded-[3rem]" />
                 ))}
              </div>
           </div>
           <div className="lg:col-span-4 space-y-10">
              <Skeleton className="h-96 rounded-[2.5rem]" />
              <Skeleton className="h-64 rounded-[2.5rem]" />
              <Skeleton className="h-96 rounded-[2.5rem]" />
           </div>
        </div>
      </div>
    </div>
  );
}

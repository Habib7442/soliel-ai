import { Skeleton } from "@/components/ui/skeleton";

export default function CoursePlayerLoading() {
  return (
    <div className="min-h-screen relative bg-white">
      {/* Background Blobs (Subtler for focus) */}
      <div className="fixed top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 flex items-center h-16 px-4 md:px-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_30px_rgb(0,0,0,0.02)] w-full">
         <div className="flex items-center gap-4 flex-1">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="hidden md:block w-px h-6 bg-gray-200" />
            <div className="space-y-2">
               <Skeleton className="h-4 w-48" />
               <Skeleton className="h-3 w-32" />
            </div>
         </div>
         <Skeleton className="h-9 w-32 rounded-xl" />
      </header>

      {/* Main Player Area */}
      <div className="container max-w-[1400px] mx-auto px-4 py-6 md:py-8 lg:px-8">
         <div className="flex flex-col lg:flex-row items-start gap-8 relative">
         
            {/* Main Content Column */}
            <main className="flex-1 min-w-0 w-full">
                <div className="space-y-6 md:space-y-8">
                    {/* Video/Content Placeholder */}
                    <Skeleton className="aspect-video w-full rounded-[2rem]" />

                    {/* Lesson Control Bar */}
                    <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                       <div className="flex gap-2">
                          <Skeleton className="h-10 w-20 rounded-xl" />
                          <Skeleton className="h-10 w-20 rounded-xl" />
                       </div>
                       <Skeleton className="h-10 w-40 rounded-xl" />
                    </div>

                    {/* Lesson Details */}
                    <div className="space-y-4 px-2">
                       <Skeleton className="h-10 w-3/4" />
                       <div className="flex gap-4">
                          <Skeleton className="h-6 w-24 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                       </div>
                    </div>

                    {/* Footer Area */}
                    <div className="flex flex-col lg:flex-row items-start gap-8 pt-8">
                        <div className="flex-1 space-y-6 w-full">
                           <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                           <Skeleton className="h-96 w-full rounded-[2.5rem]" />
                        </div>
                        <div className="w-full lg:w-96 space-y-8">
                           <Skeleton className="h-64 w-full rounded-[2.5rem]" />
                           <Skeleton className="h-80 w-full rounded-[2.5rem]" />
                        </div>
                    </div>
                </div>
            </main>

            {/* Desktop Sticky Sidebar Playlist */}
            <aside className="hidden lg:block w-96 sticky top-24">
               <Skeleton className="h-[calc(100vh-140px)] w-full rounded-[2rem]" />
            </aside>
         </div>
      </div>
    </div>
  );
}

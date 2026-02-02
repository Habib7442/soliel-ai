import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Calendar, CreditCard, ShoppingBag, Award, Download, Eye, LayoutDashboard, ChevronLeft, Settings, BookOpen, ArrowRight, Star, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole } from "@/types/enums";

interface ProfilePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tab } = await searchParams;
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isInstructor = profile?.role === UserRole.INSTRUCTOR || profile?.role === UserRole.SUPER_ADMIN;
  const defaultTab = typeof tab === 'string' ? tab : 'courses';

  // Role-specific data fetching
  let coursesData: any[] = [];
  let billingData: any[] = [];
  
  if (isInstructor) {
    // Fetch courses created by this instructor
    const { data: instructorCourses } = await supabase
      .from('courses')
      .select('id, title, thumbnail_url, created_at, status, price_cents')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });
    coursesData = instructorCourses || [];
  } else {
    // Fetch enrollments for student
    const { data: studentEnrollments } = await supabase
      .from('enrollments')
      .select(`
        id, created_at, status,
        courses (id, title, thumbnail_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    coursesData = studentEnrollments || [];

    // Fetch billing/payment history for student
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id, created_at, total_cents, currency, status,
        payments (payment_method, amount_cents, status),
        order_items (courses (title))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    billingData = orders || [];
    
    // Filter out enrollments with deleted/null courses to avoid "ghost" stats
    coursesData = (studentEnrollments || []).filter(enrollment => {
       const c = enrollment.courses;
       if (Array.isArray(c)) return c.length > 0;
       return !!c;
    });
  }

  // Get certificates (both roles might have them)
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      id, certificate_number, verification_code, issued_at, completion_date, certificate_data,
      courses (id, title, thumbnail_url)
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });
  
  // Create a set of course IDs that have certificates (proven completion)
  const certifiedCourseIds = new Set<string>();
  if (certificates) {
    certificates.forEach(c => {
      const courseId = Array.isArray(c.courses) && c.courses.length > 0
        ? c.courses[0].id 
        : (c.courses as any)?.id;
      if (courseId) certifiedCourseIds.add(courseId);
    });
  }

  // Quick stats
  const totalCourses = coursesData.length;
  
  // Calculate completed courses
  let completedCount = 0;
  if (isInstructor) {
    completedCount = coursesData.filter(c => c.status === 'approved').length;
  } else {
    const completedCourseIds = new Set<string>();
    
    // Add from enrollments
    (coursesData as any[]).forEach(e => {
        // Handle potentially array-wrapped courses
        const courseId = Array.isArray(e.courses) && e.courses.length > 0
            ? e.courses[0].id 
            : (e.courses as any)?.id;
            
        if (e.status === 'completed' || (courseId && certifiedCourseIds.has(courseId))) {
             if (courseId) completedCourseIds.add(courseId);
        }
    });
    
    // Ensure all certified courses are counted even if enrollment is missing (edge case)
    certifiedCourseIds.forEach(id => completedCourseIds.add(id));
    
    completedCount = completedCourseIds.size;
  }
  
  const secondaryStat = completedCount;
  const totalCertificates = certificates?.length || 0;

  const dashboardLink = isInstructor ? "/instructor-dashboard" : "/student-dashboard";

  return (
    <div className="min-h-screen relative overflow-hidden bg-white selection:bg-primary selection:text-white pb-20">
      {/* Background Pattern & Blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[140px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      {/* Header Container */}
      <div className="relative pt-6 pb-6 border-b border-gray-100/50 backdrop-blur-sm bg-white/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-4">
           <Button variant="ghost" size="sm" asChild className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-bold">
              <Link href={dashboardLink}>
                 <ChevronLeft className="h-4 w-4 mr-2" />
                 Back to Control
              </Link>
           </Button>
           
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Personal Intel</span>
           </div>
           
           <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-gray-50 hover:bg-primary hover:text-white transition-all shadow-sm" asChild>
              <Link href="/profile/edit">
                 <Settings className="h-5 w-5" />
              </Link>
           </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Left Sidebar: Profile Summary */}
           <div className="lg:col-span-4 space-y-8">
              <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/70 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] transition-all duration-500 border border-white/50">
                 <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.1),transparent)]" />
                 </div>
                 <CardContent className="relative pt-0 px-8 pb-10 text-center -mt-16">
                    <div className="inline-block relative">
                       <div className="p-1.5 rounded-[2.5rem] bg-white shadow-2xl shadow-primary/20 backdrop-blur-sm">
                          <Avatar className="h-28 w-28 rounded-[2rem] border-0">
                             <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                             <AvatarFallback className="text-3xl bg-primary/10 text-primary font-black italic">
                                {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                             </AvatarFallback>
                          </Avatar>
                       </div>
                       {isInstructor && (
                          <div className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest border-2 border-white shadow-lg">
                             Instructor
                          </div>
                       )}
                    </div>
                    
                    <div className="mt-6 space-y-2">
                       <h2 className="text-3xl font-black tracking-tighter text-gray-900 leading-tight">
                          {profile?.full_name?.split(' ')[0] || "User"} <span className="text-primary italic">{profile?.full_name?.split(' ').slice(1).join(' ') || ""}</span>
                       </h2>
                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                          <Mail className="h-3 w-3" />
                          {user.email}
                       </div>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-6 border-y border-gray-100/50 py-8">
                       <div className="text-center group/stat">
                          <p className="text-2xl font-black text-gray-900 group-hover/stat:text-primary transition-colors">{totalCourses}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Courses</p>
                       </div>
                       <div className="text-center group/stat border-x border-gray-100/50">
                          <p className="text-2xl font-black text-green-600">{secondaryStat}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{isInstructor ? 'Live' : 'Done'}</p>
                       </div>
                       <div className="text-center group/stat">
                          <p className="text-2xl font-black text-amber-500">{totalCertificates}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Awards</p>
                       </div>
                    </div>

                    <div className="mt-8 space-y-4 text-left">
                       <div className="flex items-center gap-4 text-xs font-bold text-gray-500 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                          <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                             <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[9px] uppercase tracking-widest text-gray-400">Onboarded</span>
                             <span>{new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                          </div>
                       </div>
                    </div>
                    
                    <Button asChild className="w-full mt-8 rounded-2xl bg-gray-900 hover:bg-primary text-white font-black tracking-tight transition-all active:scale-95 h-14 shadow-xl shadow-black/5 border-0">
                       <Link href="/profile/edit" className="flex items-center justify-center gap-2">
                          Edit Identity
                       </Link>
                    </Button>
                 </CardContent>
              </Card>

              {/* Support Card */}
              <Card className="border-0 shadow-sm bg-primary/5 rounded-[2rem] p-6 border-dashed border-2 border-primary/10">
                 <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 fill-primary" /> Expert Status
                 </h4>
                 <p className="text-xs font-medium text-primary/70 leading-relaxed italic">
                    {isInstructor 
                      ? "Your expertise is being transmitted to hundreds of eager minds worldwide." 
                      : "You are actively evolving through our specialized learning curriculums."}
                 </p>
              </Card>
           </div>
           
           {/* Right Column: Main Content */}
           <div className="lg:col-span-8">
              <Tabs defaultValue={defaultTab === 'enrollments' && isInstructor ? 'courses' : defaultTab} className="w-full space-y-10">
                 <div className="flex items-center justify-between overflow-x-auto pb-4 scrollbar-hide">
                    <TabsList className="bg-white/50 backdrop-blur-xl p-1.5 border border-gray-100/50 h-14 rounded-2xl gap-1">
                       <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-xl px-8 h-11 text-xs font-black uppercase tracking-widest transition-all">
                          {isInstructor ? 'My Courses' : 'Learning'}
                       </TabsTrigger>
                       {!isInstructor && (
                          <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-xl px-8 h-11 text-xs font-black uppercase tracking-widest transition-all">
                             Billing
                          </TabsTrigger>
                       )}
                       <TabsTrigger value="certificates" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 rounded-xl px-8 h-11 text-xs font-black uppercase tracking-widest transition-all">
                          Certificates
                       </TabsTrigger>
                    </TabsList>
                 </div>
                 
                 {/* Courses Tab */}
                 <TabsContent value="courses" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-3xl font-black text-gray-900 tracking-tight">Active <span className="text-primary italic">{isInstructor ? 'Portfolio.' : 'Learning.'}</span></h3>
                    </div>
                    
                    {coursesData && coursesData.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {coursesData.map((item) => {
                            const course = isInstructor ? item : (
                              Array.isArray(item.courses) && item.courses.length > 0 
                                ? item.courses[0] 
                                : item.courses
                            );
                            if (!course) return null;
                            
                            // Determine display status
                            const isCertified = !isInstructor && certifiedCourseIds.has(course.id);
                            const displayStatus = isCertified ? 'Completed' : (isInstructor ? (course.status || 'Active') : item.status);
                            const isCompletedStatus = displayStatus === 'Completed' || displayStatus === 'completed';

                            return (
                               <Card key={item.id} className="overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/60 backdrop-blur-xl rounded-[2.5rem] hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 group border border-white/50">
                                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                                     {course.thumbnail_url ? (
                                        <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                     ) : (
                                        <div className="h-full w-full flex items-center justify-center text-primary/10 bg-gray-50">
                                           <BookOpen className="h-16 w-16" />
                                        </div>
                                     )}
                                     <div className="absolute top-4 right-4">
                                        <Badge variant={isInstructor ? 'default' : (isCompletedStatus ? 'default' : 'secondary')} className={`rounded-xl px-4 py-1.5 font-black text-[9px] uppercase tracking-widest border-0 shadow-lg ${isInstructor ? (course.status === 'approved' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white') : (isCompletedStatus ? "bg-green-500 text-white shadow-green-500/20" : "bg-white/90 backdrop-blur-sm text-gray-900")}`}>
                                           {displayStatus}
                                        </Badge>
                                     </div>
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                  </div>
                                  <CardContent className="p-8">
                                     <h4 className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors leading-tight line-clamp-2 mb-2">{course.title}</h4>
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
                                        {isInstructor ? `Created • ${new Date(item.created_at).toLocaleDateString()}` : `Enrolled • ${new Date(item.created_at).toLocaleDateString()}`}
                                     </p>
                                     <Button asChild variant="outline" className="w-full rounded-2xl h-12 font-black tracking-tight border-gray-200 hover:border-primary hover:text-primary transition-all active:scale-95 text-xs bg-white/50 backdrop-blur-sm shadow-sm">
                                        <Link href={isInstructor ? `/instructor/courses/${course.id}` : (isCompletedStatus ? `/learn/${course.id}/detail` : `/learn/${course.id}/player`)} className="flex items-center gap-2">
                                           {isInstructor ? 'Edit Masterpiece' : 'Launch Session'} <ArrowRight className="h-3 w-3" />
                                        </Link>
                                     </Button>
                                  </CardContent>
                               </Card>
                            );
                          })}
                          
                          {isInstructor && (
                             <Link href="/instructor/courses/create" className="group flex flex-col items-center justify-center min-h-[300px] border-4 border-dashed border-gray-100 rounded-[2.5rem] hover:border-primary/30 hover:bg-primary/5 transition-all p-8 text-center">
                                <div className="h-16 w-16 rounded-2xl bg-gray-50 group-hover:bg-white flex items-center justify-center mb-6 transition-all duration-500 shadow-inner group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-2">
                                   <Plus className="h-8 w-8 text-gray-300 group-hover:text-primary transition-colors" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors tracking-tight">Create New Course</h3>
                                <p className="text-xs text-muted-foreground/70 mt-2 font-medium max-w-[200px] leading-relaxed">Turn your knowledge into a premium experience.</p>
                             </Link>
                          )}
                       </div>
                    ) : (
                       <div className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-gray-100 relative overflow-hidden">
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-50" />
                          <div className="relative z-10">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                               <BookOpen className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight">No courses found</h3>
                            <p className="text-sm text-muted-foreground/70 mb-10 max-w-sm mx-auto font-medium leading-relaxed">Ready to share your expertise? Create your first course today.</p>
                            <Button asChild size="lg" className="rounded-2xl h-14 px-10 bg-gray-900 text-white font-black shadow-xl shadow-black/10 hover:bg-primary transition-all active:scale-95 border-0">
                               <Link href={isInstructor ? "/instructor/courses/create" : "/courses"}>{isInstructor ? 'Start Teaching' : 'Explore Marketplace'}</Link>
                            </Button>
                          </div>
                       </div>
                    )}
                 </TabsContent>
                 
                 {/* Billing Tab */}
                 {!isInstructor && (
                    <TabsContent value="billing" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/50">
                          <CardHeader className="p-8 pb-4">
                             <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <CreditCard className="h-6 w-6 text-primary" /> Billing History
                             </CardTitle>
                             <CardDescription className="text-xs font-bold uppercase tracking-widest text-gray-400">Archive of your investments</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                             {billingData && billingData.length > 0 ? (
                                <div className="space-y-1">
                                   {billingData.map((order) => {
                                     const orderItem = Array.isArray(order.order_items) && order.order_items.length > 0 ? order.order_items[0] : null;
                                     const course = orderItem?.courses ? (Array.isArray(orderItem.courses) ? orderItem.courses[0] : orderItem.courses) : null;
                                     
                                     return (
                                       <div key={order.id} className="p-6 rounded-[1.5rem] flex items-center justify-between hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group cursor-default">
                                          <div className="min-w-0 flex-1 mr-4">
                                             <p className="font-black text-sm text-gray-900 truncate group-hover:text-primary transition-colors">{course?.title || 'Course Purchase'}</p>
                                             <div className="flex items-center gap-3 mt-1">
                                                <p className="text-[10px] font-bold text-gray-400">
                                                   {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                                <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest h-5 px-2 ${
                                                   order.status === 'completed' ? "text-green-600 border-green-200 bg-green-50" : 
                                                   order.status === 'pending' ? "text-yellow-600 border-yellow-200 bg-yellow-50" : ""
                                                }`}>
                                                   {order.status}
                                                </Badge>
                                             </div>
                                          </div>
                                          <div className="text-right">
                                             <span className="font-black text-gray-900 text-lg tabular-nums">
                                                ${(order.total_cents / 100).toFixed(0)}
                                             </span>
                                          </div>
                                       </div>
                                     );
                                   })}
                                </div>
                             ) : (
                                <div className="text-center py-20 px-8">
                                   <div className="h-16 w-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                                      <CreditCard className="h-8 w-8 text-gray-200" />
                                   </div>
                                   <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No activities recorded.</p>
                                </div>
                             )}
                          </CardContent>
                       </Card>
                    </TabsContent>
                 )}
                 
                 {/* Certificates Tab */}
                 <TabsContent value="certificates" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-amber-50/30 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/50">
                       <CardHeader className="p-8 pb-4">
                          <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-amber-900">
                             <Award className="h-6 w-6 text-amber-500" /> Certificates
                          </CardTitle>
                          <CardDescription className="text-xs font-bold uppercase tracking-widest text-amber-600/70">Verified proof of completion</CardDescription>
                       </CardHeader>
                       <CardContent className="p-8 pt-0">
                          {certificates && certificates.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {certificates.map((cert) => {
                                  const course = Array.isArray(cert.courses) ? cert.courses[0] : cert.courses;
                                  return (
                                    <div
                                      key={cert.id}
                                      className="group relative bg-white border border-amber-100/50 rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500"
                                    >
                                       <div className="flex items-start gap-4 mb-6">
                                          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                             <Award className="h-7 w-7 text-amber-600" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                             <h4 className="font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-amber-600 transition-colors">
                                               {course?.title || 'Unknown Course'}
                                             </h4>
                                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                                Issued • {new Date(cert.issued_at).toLocaleDateString()}
                                             </p>
                                          </div>
                                       </div>
                                       
                                       <div className="flex gap-2">
                                          <Button variant="outline" size="sm" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all" asChild>
                                             <Link href={`/certificates/${cert.id}`}>
                                               View Details
                                             </Link>
                                          </Button>
                                          <Button size="sm" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/10 border-0 transition-all active:scale-95" asChild>
                                             <Link href={`/certificates/${cert.id}?download=true`} className="flex items-center gap-2">
                                                <Download className="h-3 w-3" /> Download
                                             </Link>
                                          </Button>
                                       </div>
                                    </div>
                                  );
                                })}
                             </div>
                          ) : (
                             <div className="text-center py-20 px-8 border-4 border-dashed border-amber-100/30 rounded-[3rem]">
                                <Award className="h-16 w-16 text-amber-100 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-amber-900 tracking-tight">No awards yet.</h3>
                                <p className="text-sm text-amber-600/60 mt-2 max-w-xs mx-auto font-medium leading-relaxed">Complete your first course to unlock elite proof of mastery.</p>
                             </div>
                          )}
                       </CardContent>
                    </Card>
                 </TabsContent>
              </Tabs>
           </div>
        </div>
      </div>
    </div>
   );
}

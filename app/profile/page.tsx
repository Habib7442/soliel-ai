import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Calendar, CreditCard, ShoppingBag, Award, Download, Eye, LayoutDashboard, ChevronLeft, Settings, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfilePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { tab } = await searchParams;
  const defaultTab = typeof tab === 'string' ? tab : 'enrollments';
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get payment history
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, created_at, total_cents, currency, status,
      payments (payment_method, amount_cents, status),
      order_items (courses (title))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, created_at, status,
      courses (title, thumbnail_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      id, certificate_number, verification_code, issued_at, completion_date, certificate_data,
      courses (id, title, thumbnail_url)
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });
  
  // Quick stats
  const totalCourses = enrollments?.length || 0;
  const completedCourses = enrollments?.filter(e => e.status === 'completed').length || 0;
  const totalCertificates = certificates?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-20">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center">
         <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
               <Link href="/student-dashboard">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
               </Link>
            </Button>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">
               My Account
            </h1>
            <div className="w-[100px] sm:hidden" /> {/* Spacer for centering if needed */}
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left Sidebar: Profile Summary */}
           <div className="lg:col-span-4 space-y-6">
              <Card className="overflow-hidden border-2 border-primary/5 shadow-xl shadow-primary/5">
                 <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent h-32 relative">
                    <div className="absolute top-4 right-4">
                       <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/50 hover:bg-white backdrop-blur-sm" asChild>
                          <Link href="/profile/edit">
                             <Settings className="h-4 w-4 text-gray-700" />
                          </Link>
                       </Button>
                    </div>
                 </div>
                 <CardContent className="relative pt-0 px-6 pb-8 text-center -mt-12">
                    <div className="inline-block relative">
                       <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-900 shadow-lg">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                             {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                          </AvatarFallback>
                       </Avatar>
                       {profile?.role === 'admin' && (
                          <Badge className="absolute -bottom-2 -right-2 px-2 py-0.5 border-2 border-white dark:border-gray-900">
                             Admin
                          </Badge>
                       )}
                    </div>
                    
                    <div className="mt-4 space-y-1">
                       <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                          {profile?.full_name || "Student"}
                       </h2>
                       <p className="text-sm text-muted-foreground truncate max-w-[250px] mx-auto">
                          {user.email}
                       </p>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                       <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{totalCourses}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Courses</p>
                       </div>
                       <div className="text-center border-l border-gray-100 dark:border-gray-800">
                          <p className="text-2xl font-bold text-green-600">{completedCourses}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
                       </div>
                       <div className="text-center border-l border-gray-100 dark:border-gray-800">
                          <p className="text-2xl font-bold text-amber-500">{totalCertificates}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Awards</p>
                       </div>
                    </div>

                    <div className="mt-8 space-y-3 text-left">
                       <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{user.email}</span>
                       </div>
                    </div>
                    
                    <div className="mt-8">
                       <Button asChild className="w-full bg-primary/10 hover:bg-primary/20 text-primary shadow-none border-0">
                          <Link href="/profile/edit">Update Profile</Link>
                       </Button>
                    </div>
                 </CardContent>
              </Card>
           </div>
           
           {/* Right Column: Main Content */}
           <div className="lg:col-span-8">
              <Tabs defaultValue={defaultTab} className="w-full space-y-6">
                 <div className="flex items-center justify-between">
                    <TabsList className="bg-white dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-800 h-10 shadow-sm rounded-lg">
                       <TabsTrigger value="enrollments" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4">
                          My Courses
                       </TabsTrigger>
                       <TabsTrigger value="payments" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4">
                          Billing
                       </TabsTrigger>
                       <TabsTrigger value="certificates" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4">
                          Certificates
                       </TabsTrigger>
                    </TabsList>
                 </div>
                 
                 {/* Enrollments Tab */}
                 <TabsContent value="enrollments" className="space-y-6 mt-0">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                       <CardHeader>
                          <CardTitle className="text-xl">Active Courses</CardTitle>
                          <CardDescription>Continue where you left off</CardDescription>
                       </CardHeader>
                       <CardContent className="p-0">
                          {enrollments && enrollments.length > 0 ? (
                             <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {enrollments.map((enrollment) => {
                                  // Fix: Handle courses being an array or object
                                  const course = Array.isArray(enrollment.courses) 
                                    ? enrollment.courses[0] 
                                    : enrollment.courses;
                                    
                                  if (!course) return null;

                                  return (
                                     <div key={enrollment.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors flex items-center gap-4">
                                        <div className="h-16 w-24 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                                           {course.thumbnail_url ? (
                                              <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                                           ) : (
                                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                                 <BookOpen className="h-6 w-6" />
                                              </div>
                                           )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                           <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{course.title}</h4>
                                           <p className="text-sm text-muted-foreground">Enrolled on {new Date(enrollment.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                           <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'} className={enrollment.status === 'completed' ? "bg-green-500 hover:bg-green-600" : ""}>
                                              {enrollment.status}
                                           </Badge>
                                           <Button size="sm" variant="ghost" asChild className="text-primary hover:text-primary hover:bg-primary/5 h-8">
                                              <Link href={`/student-dashboard`}>
                                                 Continue
                                              </Link>
                                           </Button>
                                        </div>
                                     </div>
                                  );
                                })}
                             </div>
                          ) : (
                             <div className="text-center py-12 px-4">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                   <BookOpen className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No courses yet</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Get started by exploring our catalog and enrolling in a course.</p>
                                <Button asChild>
                                   <Link href="/courses">Browse Courses</Link>
                                </Button>
                             </div>
                          )}
                       </CardContent>
                    </Card>
                 </TabsContent>
                 
                 {/* Payments Tab */}
                 <TabsContent value="payments" className="mt-0">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                       <CardHeader>
                          <CardTitle className="text-xl">Transaction History</CardTitle>
                          <CardDescription>Receipts and payment details</CardDescription>
                       </CardHeader>
                       <CardContent>
                          {orders && orders.length > 0 ? (
                             <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {orders.map((order) => {
                                    const orderItem = Array.isArray(order.order_items) && order.order_items.length > 0 ? order.order_items[0] : null;
                                    const course = orderItem?.courses ? (Array.isArray(orderItem.courses) ? orderItem.courses[0] : orderItem.courses) : null;
                                    
                                    return (
                                      <TableRow key={order.id}>
                                        <TableCell className="font-medium text-muted-foreground">
                                          {new Date(order.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                          <span className="font-semibold text-gray-900 dark:text-gray-100 block truncate max-w-[200px]">
                                             {course?.title || 'Course Purchase'}
                                          </span>
                                        </TableCell>
                                        <TableCell>
                                          ${(order.total_cents / 100).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={
                                             order.status === 'completed' ? "text-green-600 border-green-200 bg-green-50" : 
                                             order.status === 'pending' ? "text-yellow-600 border-yellow-200 bg-yellow-50" : ""
                                          }>
                                            {order.status}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                             </Table>
                          ) : (
                             <div className="text-center py-12 px-4">
                                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground">No payment history yet</p>
                             </div>
                          )}
                       </CardContent>
                    </Card>
                 </TabsContent>
                 
                 {/* Certificates Tab */}
                 <TabsContent value="certificates" className="mt-0">
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                       <CardHeader>
                          <CardTitle className="text-xl">Your Achievements</CardTitle>
                          <CardDescription>Download and share your certificates</CardDescription>
                       </CardHeader>
                       <CardContent className="p-6 pt-0">
                          {certificates && certificates.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {certificates.map((cert) => {
                                  const course = Array.isArray(cert.courses) ? cert.courses[0] : cert.courses;
                                  return (
                                    <div
                                      key={cert.id}
                                      className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:border-amber-200 dark:hover:border-amber-900"
                                    >
                                      <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                           <Award className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                           <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                                             {course?.title || 'Unknown Course'}
                                           </h4>
                                           <p className="text-xs text-muted-foreground mt-1">
                                             Issued on {new Date(cert.issued_at).toLocaleDateString()}
                                           </p>
                                        </div>
                                      </div>
                                      
                                      <div className="mt-4 flex gap-2">
                                         <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                                           <Link href={`/certificates/${cert.id}`}>
                                             View
                                           </Link>
                                         </Button>
                                         <Button size="sm" className="flex-1 text-xs" asChild>
                                           <Link href={`/certificates/${cert.id}?download=true`}>
                                             Download
                                           </Link>
                                         </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                             </div>
                          ) : (
                             <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">No certificates yet</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Complete a course to earn your first certificate and showcase your skills.</p>
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
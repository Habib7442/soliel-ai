import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getAllUsers } from "@/server/actions/user.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Building2, ShieldCheck, BookOpen, Package, MessageSquare, Plus, ArrowRight, BarChart3, CreditCard } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  const usersResult = await getAllUsers();
  const users = usersResult.success ? usersResult.data : [];
  
  const totalUsers = users?.length || 0;
  const instructors = users?.filter(user => user.role === UserRole.INSTRUCTOR).length || 0;
  const students = users?.filter(user => user.role === UserRole.STUDENT).length || 0;
  const companyAdmins = users?.filter(user => user.role === UserRole.COMPANY_ADMIN).length || 0;
  
  return (
    <div className="min-h-screen bg-[#fffcfc] dark:bg-gray-950">
       {/* Hero Section */}
       <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="h-16 w-16 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <Image 
                      src={profile?.avatar_url} 
                      alt={profile?.full_name || 'Admin'} 
                      width={64} 
                      height={64} 
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                      {profile?.full_name?.charAt(0) || 'A'}
                    </div>
                  )}
               </div>
               <div>
                 <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                   Admin Dashboard
                 </h1>
                 <p className="text-muted-foreground mt-1">
                   Overview of platform statistics and management
                 </p>
               </div>
            </div>
            
            <div className="w-full md:w-auto flex gap-3">
               <Button asChild className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                 <Link href="/admin-users">
                    <Users className="h-4 w-4" /> Manage Users
                 </Link>
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
           <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
             <CardContent className="p-6">
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Total Users</p>
               <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalUsers}</h3>
             </CardContent>
           </Card>
           
           <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
             <CardContent className="p-6">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Instructors</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{instructors}</h3>
             </CardContent>
           </Card>
           
           <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
             <CardContent className="p-6">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Students</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{students}</h3>
             </CardContent>
           </Card>
           
           <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
             <CardContent className="p-6">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Companies</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">{companyAdmins}</h3>
             </CardContent>
           </Card>
        </div>

        {/* Quick Management Section */}
        <div className="mb-10">
           <h2 className="font-bold text-lg mb-4">Quick Management</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Link href="/admin-users" className="block group">
                 <Card className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full bg-white dark:bg-gray-800">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                       <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">Users</h3>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Manage</p>
                    </CardContent>
                 </Card>
              </Link>

               <Link href="/admin-courses" className="block group">
                  <Card className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full bg-white dark:bg-gray-800">
                     <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">Courses</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Content</p>
                     </CardContent>
                  </Card>
               </Link>
              
              <Link href="/admin-bundles" className="block group">
                 <Card className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full bg-white dark:bg-gray-800">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                       <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">Bundles</h3>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Offers</p>
                    </CardContent>
                 </Card>
              </Link>
              
              <Link href="/admin-companies" className="block group">
                 <Card className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full bg-white dark:bg-gray-800">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                       <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">Companies</h3>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">B2B</p>
                    </CardContent>
                 </Card>
              </Link>
              
              <Link href="/admin-faq" className="block group">
                 <Card className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full bg-white dark:bg-gray-800">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                       <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">FAQs</h3>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Support</p>
                    </CardContent>
                 </Card>
              </Link>

              <Link href="/admin-reports" className="block group">
                  <Card className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full bg-white dark:bg-gray-800">
                     <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">Reports</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Analytics</p>
                     </CardContent>
                  </Card>
               </Link>

               <Link href="/admin-payments" className="block group">
                  <Card className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full bg-white dark:bg-gray-800">
                     <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">Payments</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Transactions</p>
                     </CardContent>
                  </Card>
               </Link>
           </div>
        </div>

        {/* Recent Users List */}
        <div className="space-y-8">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                 <h2 className="font-bold text-lg">Recent Users</h2>
                 <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/90">
                    <Link href="/admin-users" className="flex items-center gap-1">View All <ArrowRight className="h-4 w-4" /></Link>
                 </Button>
              </div>
              <div className="overflow-x-auto">
                 <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users && users.slice(0, 8).map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{user.full_name || 'No name'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize ${
                            user.role === 'super_admin' ? 'border-red-200 bg-red-50 text-red-700' :
                            user.role === 'instructor' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                            user.role === 'company_admin' ? 'border-green-200 bg-green-50 text-green-700' :
                            'border-gray-200 bg-gray-50 text-gray-700'
                          }`}>
                            {user.role?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!users || users.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                 </Table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
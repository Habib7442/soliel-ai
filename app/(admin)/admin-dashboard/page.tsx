import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getAllUsers } from "@/server/actions/user.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, redirect to sign in
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user profile to verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  // If not an admin, redirect to appropriate dashboard
  // Role-based redirects are handled in page components
  if (profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  // Fetch users data using server actions
  const usersResult = await getAllUsers();
  const users = usersResult.success ? usersResult.data : [];
  
  // Calculate user statistics
  const totalUsers = users?.length || 0;
  const instructors = users?.filter(user => user.role === UserRole.INSTRUCTOR).length || 0;
  const students = users?.filter(user => user.role === UserRole.STUDENT).length || 0;
  const companyAdmins = users?.filter(user => user.role === UserRole.COMPANY_ADMIN).length || 0;
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Admin Dashboard</CardTitle>
            <CardDescription>
              Welcome to the admin dashboard. Here you can manage the entire platform, users, courses, and system settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Total Users</CardTitle>
                <p className="text-3xl font-bold text-primary">{totalUsers}</p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Instructors</CardTitle>
                <p className="text-3xl font-bold text-primary">{instructors}</p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Students</CardTitle>
                <p className="text-3xl font-bold text-primary">{students}</p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Company Admins</CardTitle>
                <p className="text-3xl font-bold text-primary">{companyAdmins}</p>
              </Card>
            </div>
            
            {/* Recent Users */}
            <div className="mb-8">
              <CardTitle className="text-2xl mb-4">Recent Users</CardTitle>
              {users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 10).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.full_name || 'No name'}
                          </TableCell>
                          <TableCell>
                            {user.email}
                          </TableCell>
                          <TableCell>
                            {user.role}
                          </TableCell>
                          <TableCell>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : new Date(user.updated_at || new Date()).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <CardDescription>No users found.</CardDescription>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Manage Users</CardTitle>
                <CardDescription className="mb-4">View and manage all platform users, including role assignments</CardDescription>
                <Button asChild>
                  <Link href="/admin-users">Manage Users</Link>
                </Button>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Manage Courses</CardTitle>
                <CardDescription className="mb-4">Review and manage all courses</CardDescription>
                <Button variant="secondary" asChild>
                  <Link href="/admin-courses">Manage Courses</Link>
                </Button>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Manage Bundles</CardTitle>
                <CardDescription className="mb-4">Create and manage course bundles with discounts</CardDescription>
                <Button variant="secondary" asChild>
                  <Link href="/admin-bundles">Manage Bundles</Link>
                </Button>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">View Payments</CardTitle>
                <CardDescription className="mb-4">View all payment transactions</CardDescription>
                <Button variant="secondary" disabled>View Payments (Coming Soon)</Button>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
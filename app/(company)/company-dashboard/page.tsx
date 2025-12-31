import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getCompanyInfo, getCompanyAssignedCourses, getCompanyEmployees, getCompanyBillingInfo } from "@/server/actions/company.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type EnrollmentWithCourse = {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
  courses: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    price_cents: number;
  } | null;
};

type Employee = {
  id: string;
  full_name: string;
  email: string;
  company_role: string;
  created_at: string;
};

export default async function CompanyDashboardPage() {
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
  
  // If not a company admin, redirect to appropriate dashboard
  // Role-based redirects are handled in page components
  if (profile?.role !== UserRole.COMPANY_ADMIN) {
    redirect("/sign-in");
  }
  
  // Fetch dashboard data using server actions
  const [companyResult, coursesResult, employeesResult, billingResult] = await Promise.all([
    getCompanyInfo(user.id),
    getCompanyAssignedCourses(user.id),
    getCompanyEmployees(user.id),
    getCompanyBillingInfo(user.id)
  ]);
  
  const company = companyResult.success ? companyResult.data : null;
  const courses = coursesResult.success ? coursesResult.data : [];
  const employees = employeesResult.success ? employeesResult.data : [];
  const billing = billingResult.success ? billingResult.data : [];
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Company Admin Dashboard</CardTitle>
            <CardDescription>
              Welcome to your company admin dashboard. Here you can manage your team&apos;s learning, assign courses, and track progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Company Info */}
            {company && (
              <Card className="mb-8 p-4">
                <CardTitle className="text-2xl mb-2">{company.name}</CardTitle>
                <CardDescription className="mb-2">
                  Plan: <strong>{company.plan}</strong> | Seats: {company.active_seats}/{company.seat_limit}
                </CardDescription>
                <p className="text-muted-foreground">Email: {company.email}</p>
                <p className="text-muted-foreground">Billing Email: {company.billing_email || 'N/A'}</p>
              </Card>
            )}
            
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Assigned Courses</CardTitle>
                <p className="text-3xl font-bold text-primary">{courses?.length || 0}</p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Team Members</CardTitle>
                <p className="text-3xl font-bold text-primary">{employees?.length || 0}</p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Billing Period</CardTitle>
                <p className="text-3xl font-bold text-primary">
                  {billing && billing.length > 0 ? billing[0].billing_period : 'N/A'}
                </p>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-lg font-semibold mb-2">Next Due Date</CardTitle>
                <p className="text-3xl font-bold text-primary">
                  {billing && billing.length > 0 && billing[0].due_date 
                    ? new Date(billing[0].due_date).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </Card>
            </div>
            
            {/* Assigned Courses */}
            <div className="mb-8">
              <CardTitle className="text-2xl mb-4">Assigned Courses</CardTitle>
              {courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(courses as unknown as EnrollmentWithCourse[]).map((enrollment) => (
                    <Card key={enrollment.id} className="p-4 hover:shadow-md transition-shadow">
                      <CardTitle className="font-semibold text-lg mb-2">
                        {enrollment.courses?.title || 'Untitled Course'}
                      </CardTitle>
                      <CardDescription className="text-sm mb-4 line-clamp-2">
                        {enrollment.courses?.description || 'No description available'}
                      </CardDescription>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">
                          ${enrollment.courses?.price_cents ? (enrollment.courses.price_cents / 100).toFixed(2) : '0.00'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Enrolled: {new Date(enrollment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No courses assigned to your team yet.</p>
              )}
            </div>
            
            {/* Team Members */}
            <div className="mb-8">
              <CardTitle className="text-2xl mb-4">Team Members</CardTitle>
              {employees && employees.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(employees as unknown as Employee[]).map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.full_name || 'Unknown User'}
                          </TableCell>
                          <TableCell>
                            {employee.email || 'No email'}
                          </TableCell>
                          <TableCell>
                            {employee.company_role || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No team members added yet.</p>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Manage Team</CardTitle>
                <CardDescription className="mb-4">Add or remove team members</CardDescription>
                <Button>Manage Team</Button>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Assign Courses</CardTitle>
                <CardDescription className="mb-4">Assign courses to team members</CardDescription>
                <Button variant="secondary">Assign Courses</Button>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Track Progress</CardTitle>
                <CardDescription className="mb-4">View team learning progress and analytics</CardDescription>
                <Button variant="secondary">View Analytics</Button>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
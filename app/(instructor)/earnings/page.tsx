import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { UserRole } from "@/types/enums";
import { getCourseEarnings } from "@/server/actions/instructor.actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default async function InstructorEarningsPage() {
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
  
  // If not an instructor, redirect to appropriate dashboard
  // Role-based redirects are handled in page components
  if (profile?.role !== UserRole.INSTRUCTOR && profile?.role !== UserRole.SUPER_ADMIN) {
    redirect("/sign-in");
  }
  
  // Fetch earnings data using server actions
  const earningsResult = await getCourseEarnings(user.id);
  const earnings = earningsResult.success ? earningsResult.data : [];
  
  // Calculate totals
  const totalEarnings = earnings?.reduce((acc, earning) => acc + (earning.amount || 0), 0) || 0;
  
  // Calculate this month's earnings
  const now = new Date();
  const thisMonthEarnings = earnings?.filter(earning => {
    const earningDate = new Date(earning.created_at);
    return earningDate.getMonth() === now.getMonth() && 
           earningDate.getFullYear() === now.getFullYear();
  }).reduce((acc, earning) => acc + (earning.amount || 0), 0) || 0;
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-3xl mb-2">Earnings Dashboard</CardTitle>
            <CardDescription>
              Track your course sales, earnings, and payment history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Total Earnings</CardTitle>
                <p className="text-3xl font-bold text-primary">${totalEarnings.toFixed(2)}</p>
                <CardDescription>Lifetime earnings</CardDescription>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">This Month</CardTitle>
                <p className="text-3xl font-bold text-primary">${thisMonthEarnings.toFixed(2)}</p>
                <CardDescription>Current month earnings</CardDescription>
              </Card>
              
              <Card className="p-6">
                <CardTitle className="text-xl font-semibold mb-2">Pending Payment</CardTitle>
                <p className="text-3xl font-bold text-primary">$0.00</p>
                <CardDescription>Awaiting payout</CardDescription>
              </Card>
            </div>
            
            <Card className="p-6">
              <CardTitle className="text-xl mb-4">Recent Transactions</CardTitle>
              {earnings && earnings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.map((earning) => (
                        <TableRow key={earning.id}>
                          <TableCell className="font-medium">
                            {earning.courses && earning.courses.length > 0 
                              ? earning.courses[0].title 
                              : 'Unknown Course'}
                          </TableCell>
                          <TableCell className="font-medium text-primary">
                            ${earning.amount?.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {earning.created_at ? new Date(earning.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <CardDescription>No transactions yet. Your earnings will appear here once students enroll in your courses.</CardDescription>
              )}
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
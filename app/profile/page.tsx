import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Calendar, CreditCard, ShoppingBag, Award, Download, Eye } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createServerClient();
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, redirect to sign in
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get payment history (orders with payments)
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      total_cents,
      currency,
      status,
      payments (
        payment_method,
        amount_cents,
        status
      ),
      order_items (
        courses (
          title
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      created_at,
      status,
      courses (
        title,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get certificates with complete data
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      id,
      certificate_number,
      verification_code,
      issued_at,
      completion_date,
      certificate_data,
      courses (
        id,
        title,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });
  
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">Your Profile</CardTitle>
                <CardDescription>Manage your account information and view your activity</CardDescription>
              </div>
              <Button asChild>
                <Link href="/profile/edit">
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                  <p className="text-lg font-semibold">{profile?.full_name || "Not set"}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                  <p className="text-lg font-semibold">{profile?.email || user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Member Since</label>
                  <p className="text-lg font-semibold">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Unknown"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
                  <Badge variant="secondary" className="text-sm capitalize">
                    {profile?.role || "student"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="enrollments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enrollments">My Courses</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>
          
          {/* Enrollments Tab */}
          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <CardTitle>Course Enrollments</CardTitle>
                <CardDescription>All courses you&apos;ve enrolled in</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollments && enrollments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Enrolled On</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((enrollment) => {
                        const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              {course?.title || 'Unknown Course'}
                            </TableCell>
                            <TableCell>
                              {new Date(enrollment.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'}>
                                {enrollment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No enrollments yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>Your transaction history and receipts</CardDescription>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const payment = Array.isArray(order.payments) && order.payments.length > 0 ? order.payments[0] : null;
                        const orderItem = Array.isArray(order.order_items) && order.order_items.length > 0 ? order.order_items[0] : null;
                        const course = orderItem?.courses ? (Array.isArray(orderItem.courses) ? orderItem.courses[0] : orderItem.courses) : null;
                        
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {course?.title || 'Course Purchase'}
                            </TableCell>
                            <TableCell>
                              ${(order.total_cents / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="capitalize">
                              {payment?.payment_method || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payment history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Certificates Tab */}
          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certificates
                </CardTitle>
                <CardDescription>Certificates earned from completed courses</CardDescription>
              </CardHeader>
              <CardContent>
                {certificates && certificates.length > 0 ? (
                  <div className="space-y-4">
                    {certificates.map((cert) => {
                      const course = Array.isArray(cert.courses) ? cert.courses[0] : cert.courses;
                      return (
                        <div
                          key={cert.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {course?.thumbnail_url && (
                              <img
                                src={course.thumbnail_url}
                                alt={course?.title || 'Course'}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            )}
                            <div>
                              <h4 className="font-semibold text-lg mb-1">
                                {course?.title || 'Unknown Course'}
                              </h4>
                              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                <p>
                                  Certificate No:{" "}
                                  <span className="font-mono font-semibold">
                                    {cert.certificate_number}
                                  </span>
                                </p>
                                <p>
                                  Issued:{" "}
                                  {new Date(cert.issued_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/certificates/${cert.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/certificates/${cert.id}?download=true`}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No certificates earned yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Complete a course to earn your first certificate!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  getRevenueAnalytics,
  getStudentAnalytics,
  getCourseAnalytics,
  getCertificateAnalytics,
  type RevenueAnalytics,
  type StudentAnalytics,
  type CourseAnalytics,
  type CertificateAnalytics,
} from "@/server/actions/admin-analytics.actions";
import { toast } from "sonner";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [studentData, setStudentData] = useState<StudentAnalytics | null>(null);
  const [courseData, setCourseData] = useState<CourseAnalytics | null>(null);
  const [certificateData, setCertificateData] = useState<CertificateAnalytics | null>(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [revenue, students, courses, certificates] = await Promise.all([
        getRevenueAnalytics(),
        getStudentAnalytics(),
        getCourseAnalytics(),
        getCertificateAnalytics(),
      ]);

      if (revenue.success && revenue.data) setRevenueData(revenue.data);
      if (students.success && students.data) setStudentData(students.data);
      if (courses.success && courses.data) setCourseData(courses.data);
      if (certificates.success && certificates.data) setCertificateData(certificates.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const exportToCSV = () => {
    toast.success("Export functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Analytics & Reports
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive platform insights and performance metrics
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={fetchAllAnalytics}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(revenueData?.totalRevenue || 0)}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">+12.5%</span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Students</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {studentData?.totalStudents.toLocaleString() || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">
                      +{studentData?.newStudentsThisMonth || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">this month</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Enrollments</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {courseData?.totalEnrollments.toLocaleString() || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Across {courseData?.publishedCourses || 0} courses
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Certificates Issued</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {certificateData?.totalCertificates.toLocaleString() || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-amber-600 font-medium">
                      +{certificateData?.certificatesThisMonth || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">this month</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Award className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Individual Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(revenueData?.individualRevenue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {revenueData?.individualCount || 0} single course purchases
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Bundle Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(revenueData?.bundleRevenue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {revenueData?.bundleCount || 0} course bundle purchases
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Corporate Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(revenueData?.corporateRevenue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {revenueData?.corporateCount || 0} B2B enterprise deals
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData?.revenueByMonth.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">{item.month}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg transition-all"
                            style={{
                              width: `${
                                revenueData.revenueByMonth.length > 0
                                  ? (item.amount /
                                      Math.max(...revenueData.revenueByMonth.map((m) => m.amount))) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-32 text-right font-semibold">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Active Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{studentData?.activeStudents.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Currently enrolled</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Avg. Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{studentData?.averageCompletionRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">New This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{studentData?.newStudentsThisMonth || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Recent signups</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Student Growth (Last 6 Months)</CardTitle>
                <CardDescription>New student registrations per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData?.studentGrowth.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">{item.month}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg transition-all"
                            style={{
                              width: `${
                                studentData.studentGrowth.length > 0
                                  ? (item.count / Math.max(...studentData.studentGrowth.map((m) => m.count))) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-32 text-right font-semibold">
                        {item.count} {item.count === 1 ? "student" : "students"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Total Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{courseData?.totalCourses || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {courseData?.publishedCourses || 0} published
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Total Enrollments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{courseData?.totalEnrollments.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
                <CardDescription>Ranked by enrollment count</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead className="text-right">Enrollments</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseData?.topCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell className="text-right">{course.enrollments}</TableCell>
                        <TableCell className="text-right">{formatCurrency(course.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-semibold">
                            ⭐ {course.averageRating.toFixed(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!courseData?.topCourses || courseData.topCourses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No course data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Total Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{certificateData?.totalCertificates || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">All-time issued</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{certificateData?.certificatesThisMonth || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Recently issued</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Certificate Issuance Trend (Last 6 Months)</CardTitle>
                <CardDescription>Monthly certificate generation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certificateData?.certificatesByMonth.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">{item.month}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg transition-all"
                            style={{
                              width: `${
                                certificateData.certificatesByMonth.length > 0
                                  ? (item.count /
                                      Math.max(...certificateData.certificatesByMonth.map((m) => m.count))) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-32 text-right font-semibold">
                        {item.count} {item.count === 1 ? "cert" : "certs"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Top Certified Courses</CardTitle>
                <CardDescription>Courses with most completions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead className="text-right">Certificates Issued</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificateData?.topCertifiedCourses.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{course.courseTitle}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{course.certificateCount}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!certificateData?.topCertifiedCourses ||
                      certificateData.topCertifiedCourses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No certificate data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
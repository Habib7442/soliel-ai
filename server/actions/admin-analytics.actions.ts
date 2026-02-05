"use server";

import { createServerClient } from "@/lib/supabase-server";
import * as Sentry from "@sentry/nextjs";

export interface RevenueAnalytics {
  totalRevenue: number;
  individualRevenue: number;
  individualCount: number;
  bundleRevenue: number;
  bundleCount: number;
  corporateRevenue: number;
  corporateCount: number;
  revenueByMonth: Array<{ month: string; amount: number }>;
}

export interface StudentAnalytics {
  totalStudents: number;
  activeStudents: number;
  averageCompletionRate: number;
  newStudentsThisMonth: number;
  studentGrowth: Array<{ month: string; count: number }>;
}

export interface CourseAnalytics {
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  topCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
    revenue: number;
    averageRating: number;
  }>;
}

export interface CertificateAnalytics {
  totalCertificates: number;
  certificatesThisMonth: number;
  certificatesByMonth: Array<{ month: string; count: number }>;
  topCertifiedCourses: Array<{
    courseTitle: string;
    certificateCount: number;
  }>;
}

export const getRevenueAnalytics = async () => {
  return Sentry.startSpan(
    {
      op: "function.server",
      name: "getRevenueAnalytics",
    },
    async (span) => {
      try {
        const supabase = await createServerClient();

        // Get all successful payments
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select("amount_cents, created_at, orders(purchase_type)")
          .eq("status", "succeeded");

        if (paymentsError) {
          Sentry.captureException(paymentsError);
          console.error("Error fetching payments:", paymentsError);
          return { success: false, error: paymentsError.message };
        }

        const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

        // Calculate revenue by purchase type
        let individualRevenue = 0;
        let individualCount = 0;
        let bundleRevenue = 0;
        let bundleCount = 0;
        let corporateRevenue = 0;
        let corporateCount = 0;

        payments?.forEach((payment: any) => {
          const purchaseType = payment.orders?.purchase_type;
          const amount = payment.amount_cents || 0;

          if (purchaseType === "single_course") {
            individualRevenue += amount;
            individualCount++;
          } else if (purchaseType === "bundle") {
            bundleRevenue += amount;
            bundleCount++;
          } else if (purchaseType === "corporate") {
            corporateRevenue += amount;
            corporateCount++;
          }
        });

        // Revenue by month (last 6 months)
        const revenueByMonth = getRevenueByMonth(payments || []);

        const analytics: RevenueAnalytics = {
          totalRevenue,
          individualRevenue,
          individualCount,
          bundleRevenue,
          bundleCount,
          corporateRevenue,
          corporateCount,
          revenueByMonth,
        };

        span?.setAttribute("totalRevenue", totalRevenue);
        const { logger } = Sentry;
        logger.info(logger.fmt`Revenue analytics fetched: $${totalRevenue}`);

        return { success: true, data: analytics };
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error in getRevenueAnalytics:", error);
        return { success: false, error: "Failed to fetch revenue analytics" };
      }
    }
  );
};

export const getStudentAnalytics = async () => {
  return Sentry.startSpan(
    {
      op: "function.server",
      name: "getStudentAnalytics",
    },
    async (span) => {
      try {
        const supabase = await createServerClient();

        // Total students
        const { count: totalStudents, error: studentsError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "student");

        if (studentsError) {
          Sentry.captureException(studentsError);
          console.error("Error fetching students:", studentsError);
          return { success: false, error: studentsError.message };
        }

        // Active students (enrolled in at least one course)
        const { data: activeStudentsData, error: activeError } = await supabase
          .from("enrollments")
          .select("user_id", { count: "exact" });

        if (activeError) {
          Sentry.captureException(activeError);
          console.error("Error fetching active students:", activeError);
        }

        const activeStudents = new Set(activeStudentsData?.map((e) => e.user_id)).size || 0;

        // Average completion rate
        const { data: progressData, error: progressError } = await supabase
          .from("v_course_progress")
          .select("progress_percent");

        if (progressError) {
          Sentry.captureException(progressError);
          console.error("Error fetching progress:", progressError);
        }

        const averageCompletionRate =
          progressData && progressData.length > 0
            ? progressData.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / progressData.length
            : 0;

        // New students this month (using v_student_signups view)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: newStudentsThisMonth, error: newStudentsError } = await supabase
          .from("v_student_signups")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        if (newStudentsError) {
          Sentry.captureException(newStudentsError);
          console.error("Error fetching new students:", newStudentsError);
        }

        // Student growth (last 6 months) using v_student_signups view
        const { data: allStudents, error: allStudentsError } = await supabase
          .from("v_student_signups")
          .select("created_at");

        if (allStudentsError) {
          Sentry.captureException(allStudentsError);
          console.error("Error fetching student growth:", allStudentsError);
        }

        const studentGrowth = getStudentGrowthByMonth(allStudents || []);

        const analytics: StudentAnalytics = {
          totalStudents: totalStudents || 0,
          activeStudents,
          averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
          newStudentsThisMonth: newStudentsThisMonth || 0,
          studentGrowth,
        };

        span?.setAttribute("totalStudents", totalStudents || 0);
        const { logger } = Sentry;
        logger.info(logger.fmt`Student analytics fetched: ${totalStudents || 0} total students`);

        return { success: true, data: analytics };
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error in getStudentAnalytics:", error);
        return { success: false, error: "Failed to fetch student analytics" };
      }
    }
  );
};

export const getCourseAnalytics = async () => {
  return Sentry.startSpan(
    {
      op: "function.server",
      name: "getCourseAnalytics",
    },
    async (span) => {
      try {
        const supabase = await createServerClient();

        // Total courses
        const { count: totalCourses, error: coursesError } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true });

        if (coursesError) {
          Sentry.captureException(coursesError);
          console.error("Error fetching courses:", coursesError);
          return { success: false, error: coursesError.message };
        }

        // Published courses
        const { count: publishedCourses, error: publishedError } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("status", "published");

        if (publishedError) {
          Sentry.captureException(publishedError);
        }

        // Total enrollments
        const { count: totalEnrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true });

        if (enrollmentsError) {
          Sentry.captureException(enrollmentsError);
        }

        // Top courses by enrollments (fetch more to ensure we find the top ones)
        const { data: topCoursesData, error: topCoursesError } = await supabase
          .from("courses")
          .select(
            `
            id,
            title,
            enrollments(count),
            reviews(rating)
          `
          )
          .limit(50);

        if (topCoursesError) {
          Sentry.captureException(topCoursesError);
        }

        // Get bundle mappings to attribute bundle revenue to courses
        const { data: bundleMappings } = await supabase
          .from("bundle_courses")
          .select("bundle_id, course_id");

        const bundleToCourses: Record<string, string[]> = {};
        bundleMappings?.forEach((mapping) => {
          if (!bundleToCourses[mapping.bundle_id]) bundleToCourses[mapping.bundle_id] = [];
          bundleToCourses[mapping.bundle_id].push(mapping.course_id);
        });

        // Get revenue per course by joining order_items → orders → payments
        const { data: orderItems, error: orderItemsError } = await supabase
          .from("order_items")
          .select(`
            course_id,
            bundle_id,
            order_id,
            orders!inner(
              id,
              payments!inner(amount_cents, status)
            )
          `);

        if (orderItemsError) {
          Sentry.captureException(orderItemsError);
          console.error("Error fetching order items for revenue:", orderItemsError);
        }

        const revenuePerCourse: Record<string, number> = {};
        orderItems?.forEach((item: any) => {
          if (item.orders?.payments) {
            const payments = Array.isArray(item.orders.payments) ? item.orders.payments : [item.orders.payments];
            const orderRevenue = payments
              .filter((p: any) => p.status === "succeeded")
              .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0);

            if (item.course_id) {
              // Individual course sale
              revenuePerCourse[item.course_id] = (revenuePerCourse[item.course_id] || 0) + orderRevenue;
            } else if (item.bundle_id && bundleToCourses[item.bundle_id]) {
              // Bundle sale - attribute revenue equally to all courses in bundle
              const coursesInBundle = bundleToCourses[item.bundle_id];
              const share = orderRevenue / coursesInBundle.length;
              coursesInBundle.forEach((cid) => {
                revenuePerCourse[cid] = (revenuePerCourse[cid] || 0) + share;
              });
            }
          }
        });

        const topCourses =
          topCoursesData?.map((course: any) => {
            const enrollmentCount = (course.enrollments as any)?.[0]?.count || 0;
            const ratings = Array.isArray(course.reviews) ? course.reviews.map((r: any) => r.rating) : [];
            const averageRating =
              ratings.length > 0 ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;

            return {
              id: course.id,
              title: course.title,
              enrollments: enrollmentCount,
              revenue: Math.round(revenuePerCourse[course.id] || 0),
              averageRating: Math.round(averageRating * 10) / 10,
            };
          }) || [];

        // Sort by enrollments
        topCourses.sort((a, b) => b.enrollments - a.enrollments);

        const analytics: CourseAnalytics = {
          totalCourses: totalCourses || 0,
          publishedCourses: publishedCourses || 0,
          totalEnrollments: totalEnrollments || 0,
          topCourses: topCourses.slice(0, 5),
        };

        span?.setAttribute("totalCourses", totalCourses || 0);
        const { logger } = Sentry;
        logger.info(logger.fmt`Course analytics fetched: ${totalCourses || 0} total courses`);

        return { success: true, data: analytics };
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error in getCourseAnalytics:", error);
        return { success: false, error: "Failed to fetch course analytics" };
      }
    }
  );
};

export const getCertificateAnalytics = async () => {
  return Sentry.startSpan(
    {
      op: "function.server",
      name: "getCertificateAnalytics",
    },
    async (span) => {
      try {
        const supabase = await createServerClient();

        // Total certificates
        const { count: totalCertificates, error: certificatesError } = await supabase
          .from("certificates")
          .select("*", { count: "exact", head: true });

        if (certificatesError) {
          Sentry.captureException(certificatesError);
          console.error("Error fetching certificates:", certificatesError);
          return { success: false, error: certificatesError.message };
        }

        // Certificates this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: certificatesThisMonth, error: thisMonthError } = await supabase
          .from("certificates")
          .select("*", { count: "exact", head: true })
          .gte("issued_at", startOfMonth.toISOString());

        if (thisMonthError) {
          Sentry.captureException(thisMonthError);
        }

        // Certificates by month
        const { data: allCertificates, error: allCertificatesError } = await supabase
          .from("certificates")
          .select("issued_at");

        if (allCertificatesError) {
          Sentry.captureException(allCertificatesError);
        }

        const certificatesByMonth = getCertificatesByMonth(allCertificates || []);

        // Top certified courses
        const { data: topCertified, error: topCertifiedError } = await supabase
          .from("certificates")
          .select("course_id, courses(title)");

        if (topCertifiedError) {
          Sentry.captureException(topCertifiedError);
        }

        const courseCertificateCounts: Record<string, { title: string; count: number }> = {};
        topCertified?.forEach((cert: any) => {
          const courseTitle = cert.courses?.title || "Unknown Course";
          if (!courseCertificateCounts[courseTitle]) {
            courseCertificateCounts[courseTitle] = { title: courseTitle, count: 0 };
          }
          courseCertificateCounts[courseTitle].count++;
        });

        const topCertifiedCourses = Object.values(courseCertificateCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((c) => ({
            courseTitle: c.title,
            certificateCount: c.count,
          }));

        const analytics: CertificateAnalytics = {
          totalCertificates: totalCertificates || 0,
          certificatesThisMonth: certificatesThisMonth || 0,
          certificatesByMonth,
          topCertifiedCourses,
        };

        span?.setAttribute("totalCertificates", totalCertificates || 0);
        const { logger } = Sentry;
        logger.info(logger.fmt`Certificate analytics fetched: ${totalCertificates || 0} total certificates`);

        return { success: true, data: analytics };
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error in getCertificateAnalytics:", error);
        return { success: false, error: "Failed to fetch certificate analytics" };
      }
    }
  );
};

// Helper functions
function getRevenueByMonth(payments: any[]): Array<{ month: string; amount: number }> {
  const monthlyRevenue: Record<string, number> = {};
  const months = getLast6Months();

  months.forEach((month) => {
    monthlyRevenue[month] = 0;
  });

  payments.forEach((payment) => {
    const date = new Date(payment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyRevenue[monthKey] !== undefined) {
      monthlyRevenue[monthKey] += payment.amount_cents || 0;
    }
  });

  return months.map((month) => ({
    month: formatMonthLabel(month),
    amount: monthlyRevenue[month],
  }));
}

function getStudentGrowthByMonth(students: any[]): Array<{ month: string; count: number }> {
  const monthlyGrowth: Record<string, number> = {};
  const months = getLast6Months();

  months.forEach((month) => {
    monthlyGrowth[month] = 0;
  });

  students.forEach((student) => {
    const date = new Date(student.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyGrowth[monthKey] !== undefined) {
      monthlyGrowth[monthKey]++;
    }
  });

  return months.map((month) => ({
    month: formatMonthLabel(month),
    count: monthlyGrowth[month],
  }));
}

function getCertificatesByMonth(certificates: any[]): Array<{ month: string; count: number }> {
  const monthlyCertificates: Record<string, number> = {};
  const months = getLast6Months();

  months.forEach((month) => {
    monthlyCertificates[month] = 0;
  });

  certificates.forEach((cert) => {
    const date = new Date(cert.issued_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyCertificates[monthKey] !== undefined) {
      monthlyCertificates[monthKey]++;
    }
  });

  return months.map((month) => ({
    month: formatMonthLabel(month),
    count: monthlyCertificates[month],
  }));
}

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push(monthKey);
  }

  return months;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

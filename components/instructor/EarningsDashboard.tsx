"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCourseEarnings, getInstructorAnalytics } from "@/server/actions/instructor.actions";
import { DollarSign, TrendingUp, Users, Star } from "lucide-react";

interface Earning {
  id: string;
  amount: number;
  purchase_date: string;
  courses?: { title: string }[];
}

interface Analytics {
  totalRevenue: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
}

interface EarningsDashboardProps {
  instructorId: string;
}

export const EarningsDashboard = ({ instructorId }: EarningsDashboardProps) => {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [earningsResult, analyticsResult] = await Promise.all([
        getCourseEarnings(instructorId),
        getInstructorAnalytics(instructorId)
      ]);

      if (earningsResult.success && earningsResult.data) {
        setEarnings(earningsResult.data);
      }

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [instructorId]);

  const totalRevenue = analytics?.totalRevenue || 0;
  const totalStudents = analytics?.totalStudents || 0;
  const averageRating = analytics?.averageRating || 0;
  const totalReviews = analytics?.totalReviews || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Earnings & Analytics</h2>
        <p className="text-muted-foreground">Track your revenue and performance metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {totalReviews} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground mt-1">
              From last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
          <CardDescription>Latest transactions from your courses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading earnings...</p>
          ) : earnings.length === 0 ? (
            <Alert>
              <AlertDescription>
                No earnings yet. Start creating and publishing courses to earn revenue!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {earnings.slice(0, 10).map((earning) => (
                <div key={earning.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                  <div>
                    <p className="font-medium">
                      {earning.courses?.[0]?.title || 'Course Sale'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(earning.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${earning.amount?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
          <CardDescription>Manage your payment details and payout schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Next Payout Date</span>
              <span className="font-semibold">
                {new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pending Amount</span>
              <span className="font-semibold">${(totalRevenue * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold">Bank Transfer</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

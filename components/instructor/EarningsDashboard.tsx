"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInstructorAnalytics, requestPayout } from "@/server/actions/instructor.actions";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Star, 
  ShoppingCart, 
  Layers, 
  Building2,
  ArrowUpRight,
  Calendar,
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Analytics {
  totalRevenue: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
  individualRevenue: number;
  individualCount: number;
  bundleRevenue: number;
  bundleCount: number;
  corporateRevenue: number;
  corporateCount: number;
  revenueByMonth: Array<{ month: string; amount: number }>;
  recentSales: Array<{
    id: string;
    courseTitle: string;
    amount: number;
    purchaseType: string;
    createdAt: string;
  }>;
}

interface EarningsDashboardProps {
  instructorId: string;
}

export const EarningsDashboard = ({ instructorId }: EarningsDashboardProps) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getInstructorAnalytics(instructorId);
      if (result.success && result.data) {
        setAnalytics(result.data as any);
      }
      setLoading(false);
    };

    fetchData();
  }, [instructorId]);

  const handleWithdraw = async () => {
    if (!analytics || analytics.totalRevenue <= 0) {
      toast.error("No balance available to withdraw.");
      return;
    }

    setWithdrawing(true);
    try {
      const result = await requestPayout(instructorId, analytics.totalRevenue);
      if (result.success) {
        toast.success(result.message || "Payout request submitted successfully!");
      } else {
        toast.error(result.error || "Failed to submit payout request.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Calculating your earnings...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `$${analytics?.totalRevenue?.toLocaleString()}`,
      description: "Lifetime earnings",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Active Students",
      value: analytics?.totalStudents,
      description: "Across all courses",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Avg. Rating",
      value: analytics?.averageRating?.toFixed(1),
      description: `From ${analytics?.totalReviews} reviews`,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Payout Status",
      value: "Next Week",
      description: "Scheduled for Feb 12",
      icon: Calendar,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    }
  ];

  const breakdown = [
    {
      label: "Individual Sales",
      amount: analytics?.individualRevenue || 0,
      count: analytics?.individualCount || 0,
      icon: ShoppingCart,
      color: "bg-blue-500"
    },
    {
      label: "Bundle Revenue",
      amount: analytics?.bundleRevenue || 0,
      count: analytics?.bundleCount || 0,
      icon: Layers,
      color: "bg-purple-500"
    },
    {
      label: "Corporate (B2B)",
      amount: analytics?.corporateRevenue || 0,
      count: analytics?.corporateCount || 0,
      icon: Building2,
      color: "bg-emerald-500"
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            Earnings <span className="text-primary italic">Report</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Track your performance and manage your payouts.
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-4 py-2 rounded-full border-gray-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            Payouts Active
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  12.5%
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</h3>
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Breakdown */}
        <Card className="lg:col-span-1 border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Revenue Breakdown</CardTitle>
            <CardDescription>Earnings by purchase type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {breakdown.map((item, i) => {
              const percentage = analytics?.totalRevenue ? (item.amount / analytics.totalRevenue) * 100 : 0;
              return (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-gray-50 text-gray-600`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm">${item.amount.toLocaleString()}</span>
                  </div>
                  <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${item.color} rounded-full transition-all duration-1000`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <span>{item.count} Sales</span>
                    <span>{Math.round(percentage)}% of total</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Sales Table */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Recent Sales</CardTitle>
                <CardDescription>Your latest course enrollments</CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full px-4">View All</Badge>
            </CardHeader>
            <CardContent>
              {analytics?.recentSales && analytics.recentSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground uppercase tracking-widest font-bold border-b border-gray-100">
                        <th className="pb-4">Course</th>
                        <th className="pb-4 text-center">Type</th>
                        <th className="pb-4 text-center">Date</th>
                        <th className="pb-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {analytics.recentSales.map((sale) => (
                        <tr key={sale.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-4">
                            <span className="font-bold text-gray-900 block truncate max-w-[200px]">{sale.courseTitle}</span>
                          </td>
                          <td className="py-4 text-center">
                            <Badge variant="outline" className="capitalize text-[10px] rounded-full px-2">
                              {sale.purchaseType.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-4 text-center text-sm text-gray-500">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            <span className="font-black text-gray-900">${sale.amount.toFixed(2)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Alert className="bg-gray-50 border-none rounded-3xl">
                    <AlertDescription className="text-muted-foreground">
                      No recent sales found. Start publishing courses to see earnings!
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payout Details */}
      <Card className="border-none shadow-xl shadow-black/5 rounded-[3rem] bg-gray-900 text-white overflow-hidden">
        <CardContent className="p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <Badge className="bg-primary/20 text-primary border-0 rounded-full px-4 mb-4 font-bold">Payout Security</Badge>
                <h2 className="text-3xl font-black">Ready to withdraw?</h2>
                <p className="text-gray-400 mt-2">All course earnings are held for a 7-day safety period to account for refunds.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400 font-medium">Available Balance</span>
                  <span className="text-xl font-bold">${(analytics?.totalRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400 font-medium">Minimum Payout</span>
                  <span className="text-xl font-bold text-primary">$50.00</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400 font-medium">Payment Method</span>
                  <span className="font-bold">Bank Account (**** 4242)</span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-[2.5rem] p-8 space-y-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-3xl bg-primary text-white">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Next Payout</p>
                  <p className="text-2xl font-black italic">Feb 12, 2026</p>
                </div>
              </div>
              <Progress value={75} className="h-3 bg-white/10" />
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                You have reached **75%** of your monthly milestone! Keep it up to unlock premium instructor rewards.
              </p>
              <button 
                onClick={handleWithdraw}
                disabled={withdrawing || (analytics?.totalRevenue || 0) <= 0}
                className="w-full h-14 bg-primary hover:bg-white hover:text-gray-900 text-gray-900 font-black rounded-2xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Withdraw Now"
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

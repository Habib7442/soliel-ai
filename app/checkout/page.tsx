import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { getPublicCourse } from "@/server/actions/public.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Shield, Lock } from "lucide-react";

interface CheckoutPageProps {
  searchParams: Promise<{
    courseId?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const courseId = params.courseId;
  
  if (!courseId) {
    redirect("/courses");
  }
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect to sign-in with courseId if not authenticated
  if (!user) {
    redirect(`/sign-in?redirect=/checkout?courseId=${courseId}`);
  }
  
  // Check if already enrolled
  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();
  
  if (existingEnrollment) {
    redirect(`/learn/${courseId}/player`);
  }
  
  // Fetch course data
  const courseResult = await getPublicCourse(courseId);
  
  if (!courseResult.success || !courseResult.data) {
    redirect("/courses");
  }
  
  const course = courseResult.data;
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your enrollment</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm 
              courseId={courseId}
              userId={user.id}
              userEmail={profile?.email || user.email || ''}
              userName={profile?.full_name || ''}
              courseTitle={course.title}
              coursePrice={course.price_cents}
            />
          </div>
          
          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Course Info */}
                <div className="space-y-3">
                  {course.thumbnail_url && (
                    <div className="rounded-lg overflow-hidden">
                      <Image 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        width={400}
                        height={225}
                        className="w-full object-cover aspect-video"
                      />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {course.instructor?.full_name || 'Unknown Instructor'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{course.level?.toUpperCase()}</Badge>
                    <Badge variant="outline">{course.lessons_count} lessons</Badge>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {course.price_cents === 0 ? 'Free' : `$${(course.price_cents / 100).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-[#FF6B35]">
                      {course.price_cents === 0 ? 'Free' : `$${(course.price_cents / 100).toFixed(2)}`}
                    </span>
                  </div>
                </div>
                
                {/* Trust Badges */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Secure payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4 text-green-600" />
                    <span>SSL encrypted</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { getPublicCourse } from "@/server/actions/public.actions";
import { getBundleById } from "@/server/actions/bundle.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Shield, Lock, Package, BookOpen } from "lucide-react";

interface CheckoutPageProps {
  searchParams: Promise<{
    courseId?: string;
    bundle?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const courseId = params.courseId;
  const bundleId = params.bundle;
  
  // Must have either course or bundle
  if (!courseId && !bundleId) {
    redirect("/courses");
  }
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect to sign-in with return URL if not authenticated
  if (!user) {
    const redirectUrl = bundleId 
      ? `/sign-in?redirect=/checkout?bundle=${bundleId}`
      : `/sign-in?redirect=/checkout?courseId=${courseId}`;
    redirect(redirectUrl);
  }
  
  // Type-safe item data structure
  type ItemData = {
    type: 'course' | 'bundle';
    id: string;
    title: string;
    description: string;
    image: string;
    price_cents: number;
    instructorId: string;
    courseCount?: number;
    level?: string;
  };
  
  let itemData: ItemData | null = null;
  
  // Handle bundle checkout
  if (bundleId) {
    const bundleResult = await getBundleById(bundleId);
    
    if (!bundleResult.success || !bundleResult.data) {
      redirect("/bundles");
    }
    
    const bundle = bundleResult.data;
    
    // Check if user already has all courses in bundle
    const courseIds = bundle.bundle_courses?.map(bc => bc.course_id) || [];
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .in('course_id', courseIds);
    
    if (enrollments && enrollments.length === courseIds.length) {
      redirect('/student-dashboard');
    }
    
    itemData = {
      type: 'bundle',
      id: bundle.id,
      title: bundle.name,
      description: `${bundle.bundle_courses?.length || 0} courses included`,
      image: bundle.cover_url || '',
      price_cents: bundle.price_cents,
      instructorId: bundle.created_by || '',
      courseCount: bundle.bundle_courses?.length || 0,
    };
  } 
  // Handle single course checkout
  else if (courseId) {
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
    
    itemData = {
      type: 'course',
      id: course.id,
      title: course.title,
      description: `by ${course.instructor?.full_name || 'Unknown Instructor'}`,
      image: course.thumbnail_url || '',
      price_cents: course.price_cents,
      instructorId: course.id, // Using course.id as fallback since instructor_id doesn't exist in PublicCourse
      level: course.level || '',
    };
  } else {
    redirect("/courses");
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();
  
  // Guard clause - should never happen but TypeScript safety
  if (!itemData) {
    redirect("/courses");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">
            {itemData.type === 'bundle' ? 'Complete your bundle purchase' : 'Complete your enrollment'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm 
              courseId={itemData.type === 'course' ? itemData.id : ''}
              bundleId={itemData.type === 'bundle' ? itemData.id : ''}
              userId={user.id}
              userEmail={profile?.email || user.email || ''}
              userName={profile?.full_name || ''}
              courseTitle={itemData.title}
              coursePrice={itemData.price_cents}
              instructorId={itemData.instructorId}
            />
          </div>
          
          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Item Info */}
                <div className="space-y-3">
                  {itemData.image && (
                    <div className="rounded-lg overflow-hidden">
                      <Image 
                        src={itemData.image} 
                        alt={itemData.title}
                        width={400}
                        height={225}
                        className="w-full object-cover aspect-video"
                      />
                    </div>
                  )}
                  
                  <div>
                    {itemData.type === 'bundle' && (
                      <Badge className="mb-2 bg-[#FF0000] text-white">
                        <Package className="w-3 h-3 mr-1" />
                        Bundle
                      </Badge>
                    )}
                    <h3 className="font-semibold text-lg line-clamp-2">{itemData.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {itemData.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {itemData.type === 'course' && itemData.level && (
                      <Badge variant="outline">{itemData.level.toUpperCase()}</Badge>
                    )}
                    {itemData.type === 'bundle' && itemData.courseCount && (
                      <Badge variant="outline">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {itemData.courseCount} {itemData.courseCount === 1 ? 'Course' : 'Courses'}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {itemData.price_cents === 0 ? 'Free' : `$${(itemData.price_cents / 100).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-[#FF0000]">
                      {itemData.price_cents === 0 ? 'Free' : `$${(itemData.price_cents / 100).toFixed(2)}`}
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

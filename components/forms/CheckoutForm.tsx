"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Check, CreditCard, CheckCircle } from "lucide-react";
import { createEnrollment } from "@/server/actions/enrollment.actions";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  courseId?: string;
  bundleId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  courseTitle: string;
  coursePrice: number;
  instructorId?: string;
}

export function CheckoutForm({ 
  courseId, 
  bundleId,
  userId, 
  userEmail, 
  userName,
  courseTitle,
  coursePrice 
}: CheckoutFormProps) {
  const isFree = coursePrice === 0;
  
  if (isFree) {
    return <FreeEnrollmentForm courseId={courseId} bundleId={bundleId} userId={userId} />;
  }
  
  return (
    <StripeCheckoutWrapper
      courseId={courseId}
      bundleId={bundleId}
      userId={userId}
      userEmail={userEmail}
      userName={userName}
      courseTitle={courseTitle}
      coursePrice={coursePrice}
    />
  );
}

// Free Enrollment Component
function FreeEnrollmentForm({ courseId,  userId }: { courseId?: string; bundleId?: string; userId: string }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  
  const handleFreeEnrollment = async () => {
    setProcessing(true);
    
    try {
      // For now, only support free course enrollment (bundles typically aren't free)
      if (!courseId) {
        toast.error("Invalid enrollment request");
        setProcessing(false);
        return;
      }
      
      const result = await createEnrollment({
        userId,
        courseId,
        purchaseType: 'single_course',
        paymentProvider: 'free',
        amountCents: 0,
      });
      
      if (result.success) {
        toast.success("Enrollment successful! Redirecting to course...");
        setTimeout(() => {
          router.push(`/learn/${courseId}/player`);
        }, 1500);
      } else {
        toast.error(result.error || "Failed to enroll");
        setProcessing(false);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error("An unexpected error occurred");
      setProcessing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Free Course Enrollment</CardTitle>
        <CardDescription>
          This course is free! Click below to start learning.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            No payment required. Enroll instantly and start learning!
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={handleFreeEnrollment}
          disabled={processing}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-12 text-lg"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enrolling...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Enroll for Free
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Stripe Checkout Wrapper
function StripeCheckoutWrapper(props: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: props.courseId,
        bundleId: props.bundleId,
        amount: props.coursePrice,
        currency: "usd",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
        } else {
          setClientSecret(data.clientSecret);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error creating payment intent:", err);
        setError("Failed to initialize payment");
        setLoading(false);
      });
  }, [props.courseId, props.bundleId, props.coursePrice]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !clientSecret) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertDescription>{error || "Failed to load payment form"}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
}

// Payment Form Component
function PaymentForm({
  courseId,
  bundleId,
  coursePrice,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe has not loaded yet");
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setSucceeded(true);
        const successMessage = bundleId 
          ? "Payment successful! You've been enrolled in all bundle courses..."
          : "Payment successful! Enrolling you in the course...";
        toast.success(successMessage);
        
        // The webhook will handle creating the enrollment, but we redirect the user
        setTimeout(() => {
          // For bundles, redirect to dashboard. For single courses, go to course player
          if (bundleId) {
            router.push(`/student-dashboard`);
          } else if (courseId) {
            router.push(`/learn/${courseId}/player`);
          } else {
            router.push(`/student-dashboard`);
          }
        }, 2000);
      } else {
        toast.error("Payment processing. Please check your enrollment status.");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("An unexpected error occurred");
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              {bundleId 
                ? "You've been enrolled in all bundle courses. Redirecting to your dashboard..."
                : "You've been enrolled in the course. Redirecting..."}
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
          <CardDescription>
            Enter your payment details to complete enrollment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PaymentElement />
          
          <Button 
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF914D] hover:from-[#FF844B] hover:to-[#FFB088] text-white h-14 text-lg font-semibold"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay ${(coursePrice / 100).toFixed(2)}
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Secured by Stripe. By completing this purchase, you agree to our Terms of Service.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CreditCard, Loader2, Check, DollarSign } from "lucide-react";
import { createEnrollment } from "@/server/actions/enrollment.actions";

interface CheckoutFormProps {
  courseId: string;
  userId: string;
  userEmail: string;
  userName: string;
  courseTitle: string;
  coursePrice: number;
}

export function CheckoutForm({ 
  courseId, 
  userId, 
  userEmail, 
  userName,
  courseTitle,
  coursePrice 
}: CheckoutFormProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'free'>('stripe');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: userName,
  });
  
  const isFree = coursePrice === 0;
  
  // Handle free enrollment
  const handleFreeEnrollment = async () => {
    setProcessing(true);
    
    try {
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
  
  // Simulate Stripe payment (DUMMY)
  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    // Validate card details (dummy validation)
    if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName) {
      toast.error("Please fill in all card details");
      setProcessing(false);
      return;
    }
    
    // Simulate Stripe API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Simulate Stripe payment intent creation
      const mockStripeResponse = {
        id: `pi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        status: 'succeeded',
        amount: coursePrice,
        currency: 'usd',
        payment_method: 'card',
        receipt_url: `https://stripe.com/receipts/${Date.now()}`,
        created: Date.now(),
      };
      
      // Create enrollment after "successful" payment
      const result = await createEnrollment({
        userId,
        courseId,
        purchaseType: 'single_course',
        paymentProvider: 'stripe',
        amountCents: coursePrice,
        stripePaymentIntentId: mockStripeResponse.id,
        receiptUrl: mockStripeResponse.receipt_url,
      });
      
      if (result.success) {
        toast.success("Payment successful! Enrollment complete!");
        setTimeout(() => {
          router.push(`/learn/${courseId}/player`);
        }, 1500);
      } else {
        toast.error(result.error || "Enrollment failed after payment");
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Payment processing failed");
      setProcessing(false);
    }
  };
  
  if (isFree) {
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
  
  return (
    <form onSubmit={handleStripePayment}>
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Enter your payment details to complete enrollment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'stripe')}>
              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" />
                  <span>Credit / Debit Card</span>
                </Label>
                <div className="flex gap-2">
                  <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Visa</div>
                  <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Mastercard</div>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> This is a simulated Stripe integration. Use any card details to test the enrollment flow.
            </AlertDescription>
          </Alert>
          
          {/* Card Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={cardDetails.cardholderName}
                onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                required
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="4242 4242 4242 4242"
                value={cardDetails.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                  setCardDetails({ ...cardDetails, cardNumber: value });
                }}
                maxLength={19}
                required
                className="h-12"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={cardDetails.expiryDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setCardDetails({ ...cardDetails, expiryDate: value });
                  }}
                  maxLength={5}
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  type="password"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                  maxLength={4}
                  required
                  className="h-12"
                />
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit"
            disabled={processing}
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
            By completing this purchase, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </form>
  );
}

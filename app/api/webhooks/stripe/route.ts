import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key for webhook
// The new sb_secret_ keys work the same as legacy service_role keys
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Log to verify the client is initialized
console.log('Supabase Admin Client initialized for webhooks');
console.log('Using URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment succeeded:", paymentIntent.id);
  
  const { courseId, bundleId, userId, instructorId, userEmail, userName, courseTitle } = paymentIntent.metadata;

  if ((!courseId && !bundleId) || !userId) {
    console.error("Missing metadata in payment intent");
    return;
  }
  
  const isBundle = !!bundleId;

  try {
    // IDEMPOTENCY CHECK: Check if this payment has already been processed
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("provider_payment_id", paymentIntent.id)
      .single();

    if (existingPayment) {
      console.log("Payment already processed, skipping:", paymentIntent.id);
      return;
    }

    // 1. Create order record
    console.log('Creating order for user:', userId, 'type:', isBundle ? 'bundle' : 'course', 'amount:', paymentIntent.amount);
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        purchase_type: isBundle ? 'bundle' : 'single_course',
        total_cents: paymentIntent.amount,
        subtotal_cents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: "completed",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      console.error("Full error details:", JSON.stringify(orderError, null, 2));
      return;
    }
    
    console.log('Order created successfully:', order.id);

    // 2. Handle bundle or single course
    if (isBundle) {
      // Get all courses in bundle
      const { data: bundleData, error: bundleError } = await supabaseAdmin
        .from("bundles")
        .select(`
          id,
          name,
          price_cents,
          bundle_courses(
            course_id,
            courses(
              id,
              title,
              instructor_id
            )
          )
        `)
        .eq("id", bundleId)
        .single();

      if (bundleError || !bundleData) {
        console.error("Error fetching bundle:", bundleError);
        return;
      }

      console.log('Processing bundle with', bundleData.bundle_courses.length, 'courses');

      // Create order item for bundle
      const { error: orderItemError } = await supabaseAdmin
        .from("order_items")
        .insert({
          order_id: order.id,
          bundle_id: bundleId,
          unit_price_cents: paymentIntent.amount,
          quantity: 1,
        });

      if (orderItemError) {
        console.error("Error creating bundle order item:", orderItemError);
        return;
      }

      // Create enrollments for all courses in bundle
      const enrollments = bundleData.bundle_courses.map((bc: { course_id: string }) => ({
        user_id: userId,
        course_id: bc.course_id,
        status: "active",
        purchased_as: "bundle" as const,
        order_id: order.id,
      }));

      // Use upsert to prevent duplicates (unique constraint on user_id, course_id)
      const { error: enrollmentError } = await supabaseAdmin
        .from("enrollments")
        .upsert(enrollments, {
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false
        });

      if (enrollmentError) {
        console.error("Error creating bundle enrollments:", enrollmentError);
        return;
      }

      console.log('Created', enrollments.length, 'enrollments for bundle');
    } else {
      // Single course purchase
      // Create order item
      const { error: orderItemError } = await supabaseAdmin
        .from("order_items")
        .insert({
          order_id: order.id,
          course_id: courseId,
          unit_price_cents: paymentIntent.amount,
          quantity: 1,
        });

      if (orderItemError) {
        console.error("Error creating order item:", orderItemError);
        return;
      }

      // Create enrollment with upsert to prevent duplicates
      const { error: enrollmentError } = await supabaseAdmin
        .from("enrollments")
        .upsert({
          user_id: userId,
          course_id: courseId,
          status: "active",
          purchased_as: "single_course",
          order_id: order.id,
        }, {
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false
        });

      if (enrollmentError) {
        console.error("Error creating enrollment:", enrollmentError);
        return;
      }

      console.log('Created enrollment for single course');
    }

    // 3. Create payment record
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id: order.id,
        provider: "stripe",
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: "succeeded",
        provider_payment_id: paymentIntent.id,
      });

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return;
    }

    // 4. Create instructor earning records (if table exists)
    // TODO: Uncomment when instructor_earnings table is created
    // if (instructorId && !isBundle) {
    //   const instructorShare = Math.round(paymentIntent.amount * 0.7);
    //   
    //   await supabaseAdmin
    //     .from("instructor_earnings")
    //     .insert({
    //       instructor_id: instructorId,
    //       course_id: courseId,
    //       amount: instructorShare / 100,
    //       currency: paymentIntent.currency,
    //       order_id: order.id,
    //     });
    // }

    console.log("Successfully processed payment and created enrollment(s)");
  } catch (error) {
    console.error("Error in handlePaymentIntentSucceeded:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment failed:", paymentIntent.id);
  
  const { courseId, userId } = paymentIntent.metadata;

  if (!courseId || !userId) {
    return;
  }

  try {
    // Create a failed order record
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        total_cents: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: "failed",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating failed order:", orderError);
      return;
    }

    // Create payment record
    await supabaseAdmin
      .from("payments")
      .insert({
        order_id: order.id,
        provider: "stripe",
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: "failed",
        provider_payment_id: paymentIntent.id,
      });

    console.log("Recorded failed payment");
  } catch (error) {
    console.error("Error in handlePaymentIntentFailed:", error);
  }
}

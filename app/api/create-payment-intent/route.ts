import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const { courseId, bundleId, amount, currency = "usd" } = await req.json();

    if ((!courseId && !bundleId) || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: courseId or bundleId, and amount" },
        { status: 400 }
      );
    }
    
    const isBundle = !!bundleId;
    let itemTitle = '';
    let instructorId = '';

    if (isBundle) {
      // Get bundle details
      const { data: bundle, error: bundleError } = await supabase
        .from("bundles")
        .select("id, name, price_cents, created_by")
        .eq("id", bundleId)
        .single();

      if (bundleError || !bundle) {
        return NextResponse.json(
          { error: "Bundle not found" },
          { status: 404 }
        );
      }

      // Verify the amount matches the bundle price
      if (bundle.price_cents !== amount) {
        return NextResponse.json(
          { error: "Amount mismatch" },
          { status: 400 }
        );
      }
      
      itemTitle = bundle.name;
      instructorId = bundle.created_by || '';
    } else {
      // Get course details
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, title, price_cents, instructor_id")
        .eq("id", courseId)
        .single();

      if (courseError || !course) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }

      // Verify the amount matches the course price
      if (course.price_cents !== amount) {
        return NextResponse.json(
          { error: "Amount mismatch" },
          { status: 400 }
        );
      }
      
      itemTitle = course.title;
      instructorId = course.instructor_id;
    }

    // Get user profile for metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...(courseId && { courseId }),
        ...(bundleId && { bundleId }),
        userId: user.id,
        userEmail: profile?.email || user.email || "",
        userName: profile?.full_name || "",
        courseTitle: itemTitle,
        instructorId: instructorId,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

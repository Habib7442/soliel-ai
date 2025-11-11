import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Stripe webhook handler
  return NextResponse.json({ received: true });
}
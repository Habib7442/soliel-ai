import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Exchange Clerk JWT → Supabase RLS token
  return NextResponse.json({ success: true });
}
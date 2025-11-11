import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Signed uploads (Supabase Storage)
  return NextResponse.json({ success: true });
}
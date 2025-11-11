import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Create order intent
  return NextResponse.json({ success: true });
}
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // Simple redirect for testing - replace with your actual logic
  // return NextResponse.redirect(new URL('/home', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
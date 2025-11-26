import { createServerClient } from '@/lib/supabase-server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/reset-password';

  if (token_hash && type) {
    const supabase = await createServerClient();
    
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      // Token verified successfully, redirect to password reset page
      redirect(next);
    } else {
      // Token verification failed
      redirect(`/reset-password?error=access_denied&error_code=otp_expired&error_description=${encodeURIComponent(error.message)}`);
    }
  }
  
  // Missing parameters
  redirect('/reset-password?error=access_denied&error_code=otp_expired&error_description=Invalid+link');
}

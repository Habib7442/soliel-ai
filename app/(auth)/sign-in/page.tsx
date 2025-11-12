"use client";

import AuthForm from "@/components/auth/AuthForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm mode="login" />
    </div>
  );
}
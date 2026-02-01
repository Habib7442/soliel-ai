"use client";

import AuthForm from "@/components/auth/AuthForm";
import GlobalLoading from "@/components/layout/global-loading";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <Suspense fallback={<GlobalLoading text="Loading sign up..." /> }>
      <AuthForm mode="signup" />
    </Suspense>
  );

}
"use client";

import AuthForm from "@/components/auth/AuthForm";
import GlobalLoading from "@/components/layout/global-loading";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div>
      <Suspense fallback={<GlobalLoading text="Loading sign in..." /> }>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
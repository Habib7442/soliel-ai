"use client";

// React Query or SWR config (optional)
export function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
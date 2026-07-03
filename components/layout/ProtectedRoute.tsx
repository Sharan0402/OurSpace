"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Spinner } from "@/components/ui/spinner";

/**
 * Client-side route guard. In production this pairs with server-side protection
 * (middleware validating the Cognito session cookie) and the backend rejecting
 * unauthenticated/unauthorized API calls. Chat + sync data is never exposed to
 * unauthenticated clients because every API/WS call requires a valid token.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return <>{children}</>;
}

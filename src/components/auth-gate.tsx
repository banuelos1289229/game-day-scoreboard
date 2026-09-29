import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { LoadingList } from "@/components/states";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side gate. Auth is a mock service today, so we never gate in a loader.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LoadingList rows={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-3xl text-foreground">Sign in to continue</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your dashboard, favourites and recommendations are tied to your account.
        </p>
        <Link to="/auth" className="mt-6 inline-block">
          <Button>Sign in or create account</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

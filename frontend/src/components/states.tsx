import { ApiError } from "@/services";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function LoadingList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="panel px-6 py-10 text-center">
      <p className="font-display text-xl uppercase tracking-wide text-foreground">{title}</p>
      {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function describe(error: unknown): { title: string; message: string } {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case "unauthorized":
        return { title: "Sign in required", message: error.message };
      case "not-found":
        return { title: "Not found", message: error.message };
      case "provider-unavailable":
        return {
          title: "Data provider unavailable",
          message: "Live data can't be reached right now. Try again shortly.",
        };
      case "validation":
        return { title: "Check your input", message: error.message };
      default:
        return { title: "Backend error", message: error.message };
    }
  }
  return {
    title: "Something went wrong",
    message: error instanceof Error ? error.message : "Unexpected error.",
  };
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { title, message } = describe(error);
  return (
    <div className="panel border-destructive/50 px-6 py-8 text-center">
      <p className="font-display text-xl uppercase tracking-wide text-destructive">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md border border-border px-4 py-2 text-xs uppercase tracking-wider text-foreground hover:bg-surface-raised"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

/** Marker for a statistic the provider does not expose. Never fabricate data. */
export function NotAvailable() {
  return <span className="text-xs uppercase tracking-wider text-muted-foreground">N/A</span>;
}

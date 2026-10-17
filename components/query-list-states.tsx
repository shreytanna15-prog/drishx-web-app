"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Compact error + retry for list screens (RW-11 Phase D). */
export function QueryErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] px-4 py-8 text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-[var(--brand-danger)]">{message}</p>
      {onRetry ? (
        <Button className="mt-4 rounded-xl" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function QueryEmptyState({
  message,
  children,
  className,
}: {
  message: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 py-16 text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-[var(--brand-text-muted)]">{message}</p>
      {children}
    </div>
  );
}

export function QueryLoadMoreButton({
  hasMore,
  loading,
  onLoadMore,
  className,
}: {
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
  className?: string;
}) {
  if (!hasMore) return null;
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full rounded-xl", className)}
      disabled={loading}
      onClick={onLoadMore}
    >
      {loading ? "Loading…" : "Load more"}
    </Button>
  );
}

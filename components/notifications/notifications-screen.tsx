"use client";

import {
  AlertCircle,
  ArrowLeft,
  Bell,
  ClipboardList,
  ListTodo,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationUnread } from "@/contexts/notification-unread-context";
import {
  fetchNotifications,
  markAllNotificationsRead,
  type NotificationRecord,
} from "@/lib/notifications-api";
import { cn } from "@/lib/utils";

function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffHr < 48) return "Yesterday";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function NotificationIcon({ type }: { type: NotificationRecord["type"] }) {
  const className = "size-3.5 text-[var(--brand-primary)]";

  if (type === "ORDER_PLACED") {
    return <ClipboardList className={className} aria-hidden />;
  }
  if (type === "TASK_ASSIGNED") {
    return <ListTodo className={className} aria-hidden />;
  }
  return <Bell className={className} aria-hidden />;
}

function NotificationRow({ item }: { item: NotificationRecord }) {
  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        item.isRead
          ? "border-[var(--brand-card-border)] bg-[var(--brand-card)]"
          : "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))]"
      )}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]">
        <NotificationIcon type={item.type} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-[var(--brand-text)]">
          {item.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--brand-text-muted)]">
          {item.message}
        </p>
      </div>
      <time
        dateTime={item.createdAt}
        className="shrink-0 text-[11px] font-semibold text-[var(--brand-text-muted)]"
      >
        {formatRelativeTime(item.createdAt)}
      </time>
    </article>
  );
}

type NotificationsScreenProps = {
  backHref?: string;
  subtitle?: string;
};

export function NotificationsScreen({
  backHref = "/home",
  subtitle = "Order updates and account alerts",
}: NotificationsScreenProps) {
  const { refreshUnreadCount } = useNotificationUnread();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchNotifications();
      const hasUnread = data.some((item) => !item.isRead);

      if (hasUnread) {
        await markAllNotificationsRead();
        setNotifications(data.map((item) => ({ ...item, isRead: true })));
      } else {
        setNotifications(data);
      }

      await refreshUnreadCount();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const hasNotifications = useMemo(
    () => notifications.length > 0,
    [notifications.length]
  );

  return (
    <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="size-10 shrink-0 rounded-xl px-0 text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            <Link href={backHref} aria-label="Back">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)]">
              Notifications
            </h1>
            <p className="text-sm text-[var(--brand-text-muted)]">{subtitle}</p>
          </div>
        </div>

        {!loading && !error ? (
          <Button
            variant="outline"
            size="icon"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              void loadNotifications();
            }}
            className="size-9 shrink-0 rounded-xl border-[var(--brand-input-border)]"
            aria-label="Refresh notifications"
          >
            {refreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="relative space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-12 text-center">
          <AlertCircle className="size-10 text-[var(--brand-danger)]" />
          <p className="text-sm font-medium text-[var(--brand-danger)]">
            {error}
          </p>
          <Button
            onClick={() => void loadNotifications()}
            className="rounded-xl bg-[var(--brand-primary)] font-bold text-[var(--brand-primary-text)]"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="relative space-y-4">
          {hasNotifications ? (
            <>
              <div className="space-y-3">
                {notifications.map((item) => (
                  <NotificationRow key={item.id} item={item} />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRefreshing(true);
                  void loadNotifications();
                }}
                disabled={refreshing}
                className="h-11 w-full rounded-xl border-[var(--brand-primary)]/50 font-bold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10"
              >
                {refreshing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "View All"
                )}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-16 text-center">
              <Bell className="size-10 text-[var(--brand-text-muted)]" />
              <p className="text-sm font-medium text-[var(--brand-text-muted)]">
                No notifications yet.
              </p>
              <p className="max-w-sm text-xs text-[var(--brand-text-muted)]">
                When customers place orders, alerts will show up here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

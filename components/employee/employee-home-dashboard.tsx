"use client";

import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Package,
  RefreshCw,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { getStaffRoleLabel } from "@/lib/auth-routing";
import {
  computeEmployeeHomeOverview,
  formatOrderShortId,
  formatOrderStatusLabel,
  getOrderCustomerLabel,
  getPendingStaffOrders,
  getPendingStaffTasks,
  type EmployeeHomeOverview,
} from "@/lib/employee-home-stats";
import { fetchOrders } from "@/lib/orders-api";
import { fetchMyTasks, type TaskRecord } from "@/lib/tasks-api";
import type { OrderRecord } from "@/lib/types/orders";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/user-display";

const QUICK_ACCESS = [
  {
    href: "/employee/tasks",
    label: "Tasks",
    icon: Package,
  },
  {
    href: "/employee/orders",
    label: "Orders",
    icon: ClipboardList,
  },
  {
    href: "/employee/inventory",
    label: "Inventory",
    icon: Warehouse,
  },
  {
    href: "/employee/procurement",
    label: "Procurement",
    icon: ShoppingCart,
  },
] as const;

function OverviewStat({
  label,
  value,
  highlight,
  loading,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-4 sm:p-5",
        "border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-card)_92%,var(--brand-primary)_8%)]",
        highlight &&
          "border-[var(--brand-primary)]/40 bg-[color-mix(in_srgb,var(--brand-primary)_12%,var(--brand-card))]"
      )}
    >
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p
          className={cn(
            "text-3xl font-extrabold tracking-tight",
            highlight
              ? "text-[var(--brand-primary)]"
              : "text-[var(--brand-text)]"
          )}
        >
          {value}
        </p>
      )}
      <p className="text-sm font-medium text-[var(--brand-text-muted)]">
        {label}
      </p>
    </div>
  );
}

function CollapsiblePanel({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-2xl border py-0 shadow-[var(--brand-card-shadow)]",
        "border-[var(--brand-card-border)] bg-[var(--brand-card)]"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b border-[var(--brand-card-border)] px-5 py-4 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--brand-primary)_5%,var(--brand-card))] sm:px-6"
      >
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-extrabold text-[var(--brand-text)]">
            {title}
          </CardTitle>
          <Badge
            variant="outline"
            className="rounded-full border-[var(--brand-card-border)] bg-[var(--brand-primary)]/10 text-[var(--brand-link)]"
          >
            {count}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            "size-5 text-[var(--brand-primary)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <CardContent className="p-4 sm:p-5">{children}</CardContent>
      ) : null}
    </Card>
  );
}

export function EmployeeHomeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<EmployeeHomeOverview>({
    tasksAssigned: "—",
    tasksCompleted: "—",
    ordersReceived: 0,
    ordersPending: 0,
  });
  const [pendingTasks, setPendingTasks] = useState<TaskRecord[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRecord[]>([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    let orders: OrderRecord[] = [];
    let tasks: TaskRecord[] = [];
    const failures: string[] = [];

    // Load one at a time — parallel calls exhaust the hosted backend DB pool and return 500.
    try {
      orders = await fetchOrders();
    } catch {
      failures.push("orders");
    }

    try {
      tasks = await fetchMyTasks();
    } catch {
      failures.push("tasks");
    }

    setOverview(computeEmployeeHomeOverview(orders, tasks));
    setPendingTasks(getPendingStaffTasks(tasks).slice(0, 10));
    setPendingOrders(getPendingStaffOrders(orders).slice(0, 8));

    if (failures.length === 2) {
      setError("Unable to load dashboard data from the backend.");
    } else if (failures.length === 1) {
      setError(
        `Could not load ${failures[0]}. Showing the data that loaded successfully.`
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (!user) return null;

  const displayName = getDisplayName(user.name, user.email);
  const roleLabel = getStaffRoleLabel(user.role);

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-8">
        <section className="space-y-1">
          <p className="text-sm font-medium text-[var(--brand-text-muted)]">
            Welcome back,
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-4xl">
            {displayName}
          </h1>
          <p className="text-sm font-semibold text-[var(--brand-link)]">
            {roleLabel}
          </p>
        </section>

        {error ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--brand-danger-border)] bg-[var(--brand-danger-bg)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-[var(--brand-danger)]">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadDashboard()}
              className="rounded-xl border-[var(--brand-input-border)] font-semibold"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        ) : null}

        <section>
          <Card
            className={cn(
              "gap-0 overflow-hidden rounded-2xl border py-0 shadow-[var(--brand-card-shadow)]",
              "border-[var(--brand-card-border)] bg-[var(--brand-card)]"
            )}
          >
            <CardHeader className="border-b border-[var(--brand-card-border)] px-5 py-5 sm:px-6">
              <CardTitle className="text-lg font-extrabold text-[var(--brand-text)]">
                Today&apos;s overview
              </CardTitle>
              <CardDescription className="text-[var(--brand-text-muted)]">
                Your operational activity at a glance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <OverviewStat
                  label="Tasks assigned"
                  value={overview.tasksAssigned}
                  loading={loading}
                />
                <OverviewStat
                  label="Tasks completed"
                  value={overview.tasksCompleted}
                  loading={loading}
                />
                <OverviewStat
                  label="Orders received"
                  value={String(overview.ordersReceived)}
                  loading={loading}
                />
                <OverviewStat
                  label="Orders pending"
                  value={String(overview.ordersPending)}
                  highlight
                  loading={loading}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
            Quick access
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {QUICK_ACCESS.map((action) => {
              const Icon = action.icon as ComponentType<{ className?: string }>;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all sm:p-5",
                    "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
                    "hover:border-[var(--brand-primary)]/45 hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--brand-card))]",
                    "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-10px_rgba(240,161,50,0.35)]"
                  )}
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-center text-sm font-bold text-[var(--brand-text)]">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <CollapsiblePanel title="Pending tasks" count={pendingTasks.length}>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : pendingTasks.length > 0 ? (
              <ul className="space-y-2">
                {pendingTasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      href="/employee/tasks"
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--brand-card-border)] px-4 py-3 transition-colors hover:border-[var(--brand-primary)]/40 hover:bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--brand-text)]">
                          {task.title}
                        </p>
                        <p className="text-xs font-medium text-[var(--brand-text-muted)]">
                          Due{" "}
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-[var(--brand-text-muted)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-medium text-[var(--brand-text-muted)]">
                No pending tasks.
              </p>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel title="Pending orders" count={pendingOrders.length}>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : pendingOrders.length > 0 ? (
              <ul className="space-y-2">
                {pendingOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/employee/orders/${encodeURIComponent(order.checkoutBatchId?.trim() || order.id)}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--brand-card-border)] px-4 py-3 transition-colors hover:border-[var(--brand-primary)]/40 hover:bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--brand-text)]">
                          {formatOrderShortId(order.id)}
                        </p>
                        <p className="truncate text-xs font-medium text-[var(--brand-text-muted)]">
                          {getOrderCustomerLabel(order)} ·{" "}
                          {formatOrderStatusLabel(order.status)}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-[var(--brand-text-muted)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-medium text-[var(--brand-text-muted)]">
                No pending orders.
              </p>
            )}
          </CollapsiblePanel>
        </section>
      </div>
    </div>
  );
}

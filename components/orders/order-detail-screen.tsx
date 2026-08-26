"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OrderGroupDetail } from "@/components/orders/order-group-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { groupOrdersForList } from "@/lib/order-list-display";
import { fetchOrders } from "@/lib/orders-api";
import type { OrderRecord } from "@/lib/types/orders";

export function OrderDetailScreen() {
  const params = useParams<{ id: string }>();
  const groupKey = decodeURIComponent(params.id);
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const group = useMemo(() => {
    const groups = groupOrdersForList(orders, user?.businessName, "Your company");
    return (
      groups.find((entry) => entry.key === groupKey) ??
      groups.find((entry) => entry.orders.some((order) => order.id === groupKey)) ??
      null
    );
  }, [orders, user?.businessName, groupKey]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3 border-b border-(--brand-card-border) pb-4">
        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 rounded-xl border-(--brand-input-border)"
          asChild
        >
          <Link href="/my-orders" aria-label="Back to orders">
            <ChevronLeft className="size-5 text-(--brand-primary)" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-extrabold text-(--brand-text) sm:text-xl">
          {group?.displayOrderId ?? "Order Details"}
        </h1>
        <div className="size-9 shrink-0" aria-hidden />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-(--brand-danger-border) bg-(--brand-danger-bg) px-4 py-8 text-center">
          <p className="text-sm font-medium text-(--brand-danger)">{error}</p>
          <Button className="mt-4 rounded-xl" onClick={() => void loadOrders()}>
            Retry
          </Button>
        </div>
      ) : !group ? (
        <div className="rounded-2xl border border-(--brand-card-border) bg-(--brand-card) px-4 py-16 text-center">
          <p className="text-sm font-medium text-(--brand-text-muted)">
            Order not found.
          </p>
          <Button className="mt-4 rounded-xl" asChild>
            <Link href="/my-orders">Back to My Orders</Link>
          </Button>
        </div>
      ) : (
        <OrderGroupDetail group={group} onAlternateChanged={() => void loadOrders()} />
      )}
    </div>
  );
}

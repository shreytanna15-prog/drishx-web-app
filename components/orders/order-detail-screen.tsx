"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { OrderGroupDetail } from "@/components/orders/order-group-detail";
import { DeliverySummary } from "@/components/delivery/delivery-service-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { groupOrdersForList } from "@/lib/order-list-display";
import { useGetOrders } from "@/lib/modules/orders/query/use-get-orders";

/**
 * Order detail needs the full orders list so checkout-batch siblings can be
 * grouped (status / tracking). Website has no compact customer batch endpoint;
 * keep fetchOrders via useGetOrders (same contract as My Orders).
 */
export function OrderDetailScreen() {
  const params = useParams<{ id: string }>();
  const groupKey = decodeURIComponent(params.id);
  const { user } = useAuth();
  const { data: orders = [], loading, error, refetch } = useGetOrders();

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
          <p className="text-sm font-medium text-(--brand-danger)">
            {error.message}
          </p>
          <Button className="mt-4 rounded-xl" onClick={() => void refetch()}>
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
        <div className="space-y-4">
          <OrderGroupDetail
            group={group}
            onAlternateChanged={() => void refetch()}
          />
          {group.orders.map((order) => (
            <DeliverySummary key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import {
  getStatusPillClassName,
  type OrderCardStatusVariant,
} from "@/lib/order-list-display";
import { cn } from "@/lib/utils";

export function OrderStatusPill({
  label,
  variant,
  className,
}: {
  label: string;
  variant: OrderCardStatusVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold",
        getStatusPillClassName(variant),
        className
      )}
    >
      {label}
    </span>
  );
}

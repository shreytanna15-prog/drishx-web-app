import { Package2 } from "lucide-react";
import { LensProductListCard } from "@/components/shop/lens-product-list-card";
import { Badge } from "@/components/ui/badge";
import type { LensItem } from "@/lib/types/lens";
import { cn } from "@/lib/utils";

type StockTone = {
  label: string;
  className: string;
};

function quantityTone(qty: number): StockTone {
  if (qty <= 0) {
    return {
      label: "Out of stock",
      className:
        "border-[var(--brand-danger)] bg-[var(--brand-danger-bg)] text-[var(--brand-danger)]",
    };
  }
  if (qty <= 5) {
    return {
      label: `Qty ${qty}`,
      className:
        "border-[var(--brand-primary)] bg-[var(--brand-primary)]/16 text-[var(--brand-primary)]",
    };
  }
  return {
    label: `Qty ${qty}`,
    className:
      "border-[var(--brand-success)] bg-[var(--brand-success)]/12 text-[var(--brand-success)]",
  };
}

type InventoryProductCardProps = {
  item: LensItem;
};

export function InventoryProductCard({ item }: InventoryProductCardProps) {
  const tone = quantityTone(item.quantity);

  return (
    <div className="space-y-2">
      <LensProductListCard item={item} />
      <div className="flex items-center justify-between border-t border-[var(--brand-card-border)] pt-2">
        <div className="flex items-center gap-1.5 text-[var(--brand-text-muted)]">
          <Package2 className="size-3.5" aria-hidden />
          <span className="text-xs font-semibold">In stock</span>
        </div>
        <Badge
          className={cn(
            "h-6 rounded-full border px-2.5 text-xs font-extrabold",
            tone.className
          )}
        >
          {tone.label}
        </Badge>
      </div>
    </div>
  );
}

"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  FileText,
  MoreVertical,
  Package,
  Receipt,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HomeTimeHero } from "@/components/dashboard/home-time-hero";
import { WholesalePromoBanner } from "@/components/dashboard/wholesale-promo-banner";
import { CatalogSearchBar } from "@/components/shop/catalog-search-bar";
import { useAuth } from "@/contexts/auth-context";
import {
  catalogImageForHomeCategory,
  fetchCatalogImages,
  type CatalogImagesResponse,
} from "@/lib/catalog-images-api";
import { CLIENT_HOME_CATEGORIES } from "@/lib/home-categories";
import {
  computeCustomerOrderOverview,
  computeCustomerOverviewTrends,
  EMPTY_OVERVIEW_TRENDS,
  type OverviewTrend,
  type OverviewTrends,
} from "@/lib/home-order-stats";
import {
  computeMostOrderedProducts,
  type MostOrderedProduct,
} from "@/lib/most-ordered-products";
import { fetchOrders } from "@/lib/orders-api";
import { cn } from "@/lib/utils";
import { getCompanyDisplayName } from "@/lib/user-display";

function goToCategory(
  router: ReturnType<typeof useRouter>,
  categoryId: string
) {
  switch (categoryId) {
    case "rx":
      router.push("/rx");
      return;
    case "singlevision":
      router.push("/shop?category=sv");
      return;
    case "progressive":
      router.push("/shop?category=v2");
      return;
    case "kryptok":
      router.push("/shop?category=kt");
      return;
    case "color":
      router.push("/color");
      return;
    case "white":
      router.push("/white");
      return;
    default:
      router.push("/shop");
  }
}

const QUICK_ACTIONS = [
  { id: "place-order", label: "Place order", icon: ShoppingCart, href: "/shop" },
  { id: "my-orders", label: "My orders", icon: Receipt, href: "/my-orders" },
  { id: "invoices", label: "Invoices", icon: FileText, href: "/profile/invoices" },
  {
    id: "returns",
    label: "Returns",
    icon: RotateCcw,
    href: "/returns",
  },
] as const;

const STAT_CONFIG = [
  {
    key: "total" as const,
    label: "Total Orders",
    icon: Package,
    accent: "#5B9BF0",
  },
  {
    key: "inProgress" as const,
    label: "In Progress",
    icon: TrendingUp,
    accent: "#D782E0",
  },
  {
    key: "readyToShip" as const,
    label: "Ready to Ship",
    icon: Truck,
    accent: "#F0A132",
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: CheckCircle2,
    accent: "#4CC38A",
  },
];

function StatBox({
  label,
  value,
  icon: Icon,
  accent,
  trend,
  loading,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  trend?: OverviewTrend;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2.5 rounded-2xl border p-4 sm:p-5",
        "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
        "shadow-[0_12px_28px_-20px_rgba(0,0,0,0.45)]",
        "transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand-primary)_35%,var(--brand-card-border))]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}29`, color: accent }}
        >
          <Icon className="size-4" />
        </span>
        <MoreVertical className="size-4 text-[var(--brand-text-muted)]" aria-hidden />
      </div>

      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="text-3xl font-extrabold tracking-tight text-[var(--brand-text)]">
          {value}
        </p>
      )}

      <p className="text-sm font-medium text-[var(--brand-text-muted)]">{label}</p>

      {trend ? (
        <p
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: accent }}
        >
          {trend.direction === "down" ? (
            <ArrowDown className="size-3.5" />
          ) : (
            <ArrowUp className="size-3.5" />
          )}
          {trend.percent}% vs yesterday
        </p>
      ) : null}
    </div>
  );
}

function ProductRow({
  rank,
  product,
}: {
  rank: number;
  product: MostOrderedProduct;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all",
        "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
        "hover:border-[var(--brand-primary)]/50 hover:bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))]",
        "hover:shadow-[0_8px_24px_-8px_rgba(240,161,50,0.25)]"
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/15 text-sm font-extrabold text-[var(--brand-link)]">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-[var(--brand-text)]">
          {product.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-[var(--brand-text-muted)]">
          {product.subtitle}
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--brand-link)]">
          {product.totalQuantity} units · {product.orderCount} orders
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-[var(--brand-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]" />
    </button>
  );
}

export function CustomerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    total: 0,
    inProgress: 0,
    readyToShip: 0,
    completed: 0,
  });
  const [overviewTrends, setOverviewTrends] =
    useState<OverviewTrends>(EMPTY_OVERVIEW_TRENDS);
  const [mostOrdered, setMostOrdered] = useState<MostOrderedProduct[]>([]);
  const [catalogImages, setCatalogImages] =
    useState<CatalogImagesResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [orders, images] = await Promise.all([
          fetchOrders(),
          fetchCatalogImages().catch(() => null),
        ]);
        if (cancelled) return;
        setOverview(computeCustomerOrderOverview(orders));
        setOverviewTrends(computeCustomerOverviewTrends(orders));
        setMostOrdered(computeMostOrderedProducts(orders, 5));
        setCatalogImages(images);
      } catch {
        if (!cancelled) {
          setOverview({ total: 0, inProgress: 0, readyToShip: 0, completed: 0 });
          setOverviewTrends(EMPTY_OVERVIEW_TRENDS);
          setMostOrdered([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const companyName = getCompanyDisplayName(
    user.businessName,
    user.name,
    user.email
  );

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-8">
        <HomeTimeHero companyName={companyName} />

        <CatalogSearchBar className="max-w-2xl" />

        {/* At a glance — mobile-inspired cards, web grid layout */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
              At a glance
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 font-semibold text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-link)]"
              asChild
            >
              <Link href="/my-orders">View all</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {STAT_CONFIG.map((stat) => (
              <StatBox
                key={stat.key}
                label={stat.label}
                value={String(overview[stat.key])}
                icon={stat.icon}
                accent={stat.accent}
                trend={overviewTrends[stat.key]}
                loading={loading}
              />
            ))}
          </div>
        </section>

        <WholesalePromoBanner />

        {/* Quick actions */}
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-3xl border p-4 transition-all sm:p-5",
                    "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
                    "hover:border-[var(--brand-primary)]/40 hover:bg-[color-mix(in_srgb,var(--brand-primary)_7%,var(--brand-card))]",
                    "hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-14px_rgba(240,161,50,0.35)]"
                  )}
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/12 text-[var(--brand-primary)]">
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

        {/* Shop by category */}
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
            Shop by category
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {CLIENT_HOME_CATEGORIES.map((category) => {
              const imageUrl = catalogImageForHomeCategory(
                catalogImages,
                category.id
              );
              const label =
                category.id === "singlevision"
                  ? "Single Vision"
                  : category.label;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => goToCategory(router, category.id)}
                  className={cn(
                    "group relative h-[9.5rem] overflow-hidden rounded-3xl border text-left transition-all sm:h-[10.5rem]",
                    "border-[var(--brand-card-border)] bg-[var(--brand-background)]",
                    "shadow-[0_14px_28px_-18px_rgba(0,0,0,0.45)]",
                    "hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/45",
                    "hover:shadow-[0_16px_32px_-16px_rgba(240,161,50,0.28)]"
                  )}
                >
                  <span className="absolute inset-0 flex items-center justify-center bg-[var(--brand-background)]">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={label}
                        className="size-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <span className="size-2/3 rounded-2xl bg-[var(--brand-primary)]/10" />
                    )}
                  </span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/40 to-transparent"
                  />
                  <span className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-2">
                    <span className="block truncate text-sm font-bold tracking-wide text-white">
                      {label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Most ordered */}
        <section className="space-y-4 pb-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
              Most ordered products
            </h2>
            <Badge
              variant="secondary"
              className="rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-primary)]/12 font-semibold text-[var(--brand-link)]"
            >
              Top 5
            </Badge>
          </div>

          <Card
            className={cn(
              "gap-0 rounded-3xl border py-0",
              "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
              "shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)]"
            )}
          >
            <CardContent className="p-4 sm:p-5">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </div>
              ) : mostOrdered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Package className="size-10 text-[var(--brand-text-muted)]/50" />
                  <p className="max-w-sm text-sm text-[var(--brand-text-muted)]">
                    Your top products will appear here after you place orders.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mostOrdered.map((product, index) => (
                    <ProductRow
                      key={product.lensId}
                      rank={index + 1}
                      product={product}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

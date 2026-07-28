"use client";

import {
  ChevronRight,
  FileText,
  Headphones,
  Package,
  Receipt,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
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
import {
  catalogImageForHomeCategory,
  fetchCatalogImages,
  type CatalogImagesResponse,
} from "@/lib/catalog-images-api";
import { CLIENT_HOME_CATEGORIES } from "@/lib/home-categories";
import { computeCustomerOrderOverview } from "@/lib/home-order-stats";
import {
  computeMostOrderedProducts,
  type MostOrderedProduct,
} from "@/lib/most-ordered-products";
import { fetchOrders } from "@/lib/orders-api";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/user-display";

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
  { id: "support", label: "Support", icon: Headphones, href: null },
] as const;

const STAT_CONFIG = [
  { key: "total" as const, label: "Total orders", icon: Package, highlight: false },
  { key: "inProgress" as const, label: "In progress", icon: TrendingUp, highlight: true },
  { key: "readyToShip" as const, label: "Ready to ship", icon: Truck, highlight: false },
  { key: "completed" as const, label: "Completed", icon: Receipt, highlight: false },
];

function StatBox({
  label,
  value,
  icon: Icon,
  highlight,
  loading,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:p-5",
        "border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-card)_92%,var(--brand-primary)_8%)]",
        highlight && "border-[var(--brand-primary)]/40 bg-[color-mix(in_srgb,var(--brand-primary)_12%,var(--brand-card))]"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            highlight
              ? "bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]"
              : "bg-[var(--brand-primary)]/10 text-[var(--brand-link)]"
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p
          className={cn(
            "text-3xl font-extrabold tracking-tight",
            highlight ? "text-[var(--brand-primary)]" : "text-[var(--brand-text)]"
          )}
        >
          {value}
        </p>
      )}
      <p className="text-sm font-medium text-[var(--brand-text-muted)]">{label}</p>
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
        setMostOrdered(computeMostOrderedProducts(orders, 5));
        setCatalogImages(images);
      } catch {
        if (!cancelled) {
          setOverview({ total: 0, inProgress: 0, readyToShip: 0, completed: 0 });
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

  const displayName = getDisplayName(user.name, user.email);

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-8">
        {/* Welcome */}
        <section className="space-y-1">
          <p className="text-sm font-medium text-[var(--brand-text-muted)]">Hello,</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-4xl">
            {displayName}
          </h1>
          <p className="max-w-full truncate text-sm font-medium text-[var(--brand-link)] sm:max-w-xl">
            Client ID:{" "}
            <span className="font-mono text-xs sm:text-sm">{user.id}</span>
          </p>
        </section>

        {/* Order overview */}
        <section>
          <Card
            className={cn(
              "gap-0 overflow-hidden rounded-2xl border py-0 shadow-[var(--brand-card-shadow)]",
              "border-[var(--brand-card-border)] bg-[var(--brand-card)]"
            )}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[var(--brand-card-border)] px-5 py-5 sm:px-6">
              <div className="space-y-1">
                <CardTitle className="text-lg font-extrabold text-[var(--brand-text)]">
                  Order overview
                </CardTitle>
                <CardDescription className="text-[var(--brand-text-muted)]">
                  Your order activity at a glance
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 font-semibold text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-link)]"
                asChild
              >
                <Link href="#">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {STAT_CONFIG.map((stat) => (
                  <StatBox
                    key={stat.key}
                    label={stat.label}
                    value={String(overview[stat.key])}
                    icon={stat.icon}
                    highlight={stat.highlight}
                    loading={loading}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick actions + wholesale */}
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const className = cn(
                "flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all sm:p-5",
                "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
                "hover:border-[var(--brand-primary)]/45 hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--brand-card))]",
                "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-10px_rgba(240,161,50,0.35)]"
              );
              const content = (
                <>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-center text-sm font-bold text-[var(--brand-text)]">
                    {action.label}
                  </span>
                </>
              );

              if (!action.href) {
                return (
                  <button key={action.id} type="button" className={className}>
                    {content}
                  </button>
                );
              }

              return (
                <Link key={action.id} href={action.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>

          <Button
            size="lg"
            asChild
            className={cn(
              "h-14 w-full rounded-2xl text-base font-extrabold shadow-lg",
              "bg-gradient-to-b from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)]",
              "hover:from-[#f7b84e] hover:to-[#ec9d28]",
              "shadow-[0_4px_20px_rgba(240,161,50,0.35)]"
            )}
          >
            <Link href="/wholesale">
              <Store className="size-5" />
              Place wholesale order
            </Link>
          </Button>
        </section>

        {/* Categories */}
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-[var(--brand-text)]">
            Product categories
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {CLIENT_HOME_CATEGORIES.map((category) => {
              const imageUrl = catalogImageForHomeCategory(
                catalogImages,
                category.id
              );
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => goToCategory(router, category.id)}
                  className={cn(
                    "flex min-h-[5.5rem] flex-col justify-between rounded-2xl border p-4 text-left transition-all",
                    "border-[var(--brand-card-border)] bg-[var(--brand-card)]",
                    "hover:border-[var(--brand-primary)]/45 hover:bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--brand-card))]"
                  )}
                >
                  {imageUrl ? (
                    <span className="mb-2 size-12 overflow-hidden rounded-lg border border-[var(--brand-card-border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={category.label}
                        className="size-full object-cover"
                      />
                    </span>
                  ) : null}
                  <span className="text-base font-extrabold text-[var(--brand-text)]">
                    {category.label}
                  </span>
                  <ChevronRight className="mt-auto size-5 text-[var(--brand-primary)]" />
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
              "gap-0 rounded-2xl border py-0 shadow-[var(--brand-card-shadow)]",
              "border-[var(--brand-card-border)] bg-[var(--brand-card)]"
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

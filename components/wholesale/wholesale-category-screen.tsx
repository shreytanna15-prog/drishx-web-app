"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrderMode } from "@/contexts/order-mode-context";
import { LENS_CATALOG_CATEGORIES } from "@/lib/wholesale-navigation";
import { cn } from "@/lib/utils";

export function WholesaleCategoryScreen() {
  const { setMode } = useOrderMode();

  useEffect(() => {
    setMode("wholesale");
  }, [setMode]);

  return (
    <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(100%,36rem)] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-background-glow)" }}
      />

      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="size-10 rounded-xl px-0 text-[var(--brand-link)] hover:bg-[var(--brand-primary)]/10"
          >
            <Link href="/home" aria-label="Back to home">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-3xl">
              Wholesale Order
            </h1>
            <p className="text-sm text-[var(--brand-text-muted)]">
              Select a category to begin bulk ordering
            </p>
          </div>
        </div>

        <p className="text-sm font-semibold text-[var(--brand-text-muted)]">
          Select a category
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LENS_CATALOG_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} href={`/wholesale/items?category=${cat.id}`}>
                <Card
                  className={cn(
                    "h-full rounded-2xl border-[var(--brand-card-border)] bg-[var(--brand-card)] py-0 shadow-none transition-all",
                    "hover:-translate-y-0.5 hover:border-[var(--brand-primary)]/45 hover:shadow-[0_12px_28px_-12px_rgba(240,161,50,0.35)]"
                  )}
                >
                  <CardContent className="flex h-full min-h-[132px] flex-col justify-between p-5">
                    <div className="flex items-start justify-between">
                      <span className="flex size-11 items-center justify-center rounded-xl border border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
                        <Icon className="size-5" />
                      </span>
                      <ChevronRight className="size-5 text-[var(--brand-text-muted)]" />
                    </div>
                    <div>
                      <h2 className="mt-4 text-lg font-extrabold text-[var(--brand-text)]">
                        {cat.title}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-[var(--brand-text-muted)]">
                        {cat.subtitle}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

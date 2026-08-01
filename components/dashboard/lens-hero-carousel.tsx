"use client";

import { useEffect, useMemo, useState } from "react";
import {
  catalogImageForHomeCategory,
  type CatalogImagesResponse,
} from "@/lib/catalog-images-api";
import { CLIENT_HOME_CATEGORIES } from "@/lib/home-categories";
import { cn } from "@/lib/utils";

const CYCLE_MS = 3500;
const FADE_MS = 700;

function heroLabel(categoryId: string, fallback: string): string {
  if (categoryId === "singlevision") return "Single Vision";
  if (categoryId === "white") return "White (Glass)";
  return fallback;
}

type LensHeroCarouselProps = {
  images: CatalogImagesResponse | null;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
};

export function LensHeroCarousel({
  images,
  onSelectCategory,
  className,
}: LensHeroCarouselProps) {
  const slides = useMemo(
    () =>
      CLIENT_HOME_CATEGORIES.map((category) => ({
        id: category.id,
        label: heroLabel(category.id, category.label),
        url: catalogImageForHomeCategory(images, category.id),
      })),
    [images]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, slides.length]);

  const active = slides[activeIndex] ?? slides[0];

  return (
    <div
      className={cn("relative w-full sm:w-[17.5rem] lg:w-[18.5rem]", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Soft ambient wash behind panel — not a hard ring */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-3 inset-y-2 rounded-[1.75rem] opacity-50 blur-xl",
          !reduceMotion && "animate-pulse"
        )}
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in srgb, var(--brand-primary) 28%, transparent), transparent 70%)",
        }}
      />

      <button
        type="button"
        onClick={() => active && onSelectCategory(active.id)}
        aria-label={active ? `Shop ${active.label}` : "Shop lens categories"}
        className={cn(
          "group relative block h-[13rem] w-full overflow-hidden rounded-3xl border sm:h-[14.5rem]",
          "border-[var(--brand-card-border)] bg-[var(--brand-background)]",
          "shadow-[0_16px_40px_-18px_rgba(0,0,0,0.55)]",
          "transition-transform duration-300 hover:-translate-y-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-background)]"
        )}
      >
        <span className="absolute inset-0 bg-[var(--brand-background)]">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return slide.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={slide.id}
                src={slide.url}
                alt=""
                className={cn(
                  "absolute inset-0 size-full object-contain object-center transition-[opacity,transform]",
                  isActive ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
                )}
                style={{ transitionDuration: `${FADE_MS}ms` }}
                aria-hidden={!isActive}
              />
            ) : (
              <span
                key={slide.id}
                className={cn(
                  "absolute inset-0 bg-[color-mix(in_srgb,var(--brand-primary)_10%,var(--brand-card))] transition-opacity",
                  isActive ? "opacity-100" : "opacity-0"
                )}
                style={{ transitionDuration: `${FADE_MS}ms` }}
                aria-hidden={!isActive}
              />
            );
          })}
        </span>

        {/* Bottom gradient scrim */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
        />

        <span className="absolute inset-x-3.5 bottom-3 flex items-center justify-between gap-3">
          <span className="max-w-[65%] truncate rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-white backdrop-blur-sm">
            {active?.label ?? "Lenses"}
          </span>
          <span className="flex items-center gap-1.5" aria-hidden>
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;
              return (
                <span
                  key={slide.id}
                  className={cn(
                    "h-1.5 rounded-full bg-[var(--brand-primary)] transition-all duration-300",
                    isActive ? "w-4 opacity-100" : "w-1.5 opacity-35"
                  )}
                />
              );
            })}
          </span>
        </span>
      </button>
    </div>
  );
}

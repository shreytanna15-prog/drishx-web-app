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
      className={cn("flex flex-col items-center gap-3", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        onClick={() => active && onSelectCategory(active.id)}
        aria-label={
          active ? `Shop ${active.label}` : "Shop lens categories"
        }
        className={cn(
          "group relative size-[11.5rem] shrink-0 overflow-visible rounded-full sm:size-[13.5rem]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-background)]"
        )}
      >
        {/* Glow ring */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-full opacity-80 blur-md"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 55%, transparent) 0%, transparent 70%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-[var(--brand-primary)]/45 shadow-[0_0_28px_rgba(240,161,50,0.35)]"
        />

        <span className="absolute inset-[6px] overflow-hidden rounded-full bg-[var(--brand-card)] ring-1 ring-[var(--brand-card-border)]">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return slide.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={slide.id}
                src={slide.url}
                alt=""
                className={cn(
                  "absolute inset-0 size-full object-cover transition-[opacity,transform]",
                  isActive
                    ? "scale-100 opacity-100"
                    : "scale-[1.03] opacity-0"
                )}
                style={{ transitionDuration: `${FADE_MS}ms` }}
                aria-hidden={!isActive}
              />
            ) : (
              <span
                key={slide.id}
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--brand-primary)_12%,var(--brand-card))] transition-opacity",
                  isActive ? "opacity-100" : "opacity-0"
                )}
                style={{ transitionDuration: `${FADE_MS}ms` }}
                aria-hidden={!isActive}
              />
            );
          })}
        </span>
      </button>

      <p className="text-center text-sm font-semibold tracking-wide text-[var(--brand-primary)]">
        {active?.label ?? "Lenses"}
      </p>
    </div>
  );
}

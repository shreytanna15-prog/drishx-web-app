"use client";

import { CloudSun, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";
import {
  getTimeOfDayBucket,
  getTimeOfDayGreeting,
  getTimeOfDayHeroImageSrc,
  getTimeOfDayTagline,
  type TimeOfDayBucket,
} from "@/lib/user-display";

type HomeTimeHeroProps = {
  companyName: string;
  className?: string;
};

const BUCKETS: TimeOfDayBucket[] = ["morning", "afternoon", "evening"];

function accentIcon(bucket: TimeOfDayBucket) {
  if (bucket === "morning") return Sun;
  if (bucket === "afternoon") return CloudSun;
  return Moon;
}

export function HomeTimeHero({ companyName, className }: HomeTimeHeroProps) {
  const { resolvedTheme } = useTheme();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const bucket = getTimeOfDayBucket(now);
  const greeting = getTimeOfDayGreeting(now);
  const tagline = getTimeOfDayTagline(now);
  const Icon = accentIcon(bucket);
  const activeSrc = getTimeOfDayHeroImageSrc(resolvedTheme, now);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "bg-[var(--brand-card)]",
        "shadow-[0_20px_48px_-28px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {/* Soft brand wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 35%, transparent), transparent 70%)",
        }}
      />

      <div className="relative grid min-h-[15.5rem] grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative z-10 flex flex-col justify-center gap-3 px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
          <div className="flex items-center gap-2.5">
            <p
              className={cn(
                "font-serif text-[1.65rem] leading-none font-medium tracking-wide italic sm:text-[1.85rem]",
                "text-[var(--brand-primary)]"
              )}
            >
              {greeting}
            </p>
            <Icon
              className="size-5 shrink-0 text-[var(--brand-primary)]"
              aria-hidden
            />
          </div>

          <h1 className="max-w-xl text-3xl font-extrabold tracking-tight text-[var(--brand-text)] sm:text-4xl">
            {companyName}
          </h1>

          <span
            aria-hidden
            className="mt-1 h-1 w-9 rounded-full bg-[var(--brand-primary)]"
          />

          <p className="max-w-md text-sm leading-relaxed text-[var(--brand-text-muted)] sm:text-[0.95rem]">
            {tagline}
          </p>
        </div>

        <div className="relative min-h-[12rem] overflow-hidden md:min-h-full">
          {BUCKETS.map((key) => {
            const src = getTimeOfDayHeroImageSrc(
              resolvedTheme,
              // Force each bucket's asset via a synthetic hour
              new Date(
                2000,
                0,
                1,
                key === "morning" ? 8 : key === "afternoon" ? 14 : 20
              )
            );
            const isActive = src === activeSrc;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${key}-${resolvedTheme}`}
                src={src}
                alt=""
                className={cn(
                  // Scale past the decorative gold frame baked into the JPEGs
                  "absolute inset-0 size-full scale-[1.14] object-cover object-center transition-opacity duration-500",
                  "md:object-[70%_center]",
                  isActive ? "opacity-100" : "opacity-0"
                )}
                aria-hidden={!isActive}
              />
            );
          })}

          {/* Blend image into card / text column */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0",
              "bg-gradient-to-t from-[var(--brand-card)] via-[var(--brand-card)]/40 to-transparent",
              "md:bg-gradient-to-r md:from-[var(--brand-card)] md:via-[var(--brand-card)]/50 md:to-transparent"
            )}
          />
        </div>
      </div>
    </section>
  );
}

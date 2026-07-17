import Link from "next/link";
import { cn } from "@/lib/utils";

export const BRAND_LOGO_SRC = "/edited-photo.png";
export const BRAND_FAVICON_SRC = "/favicon.ico";

type BrandMarkProps = {
  size?: "sm" | "md";
  className?: string;
};

export function BrandMark({ size = "md", className }: BrandMarkProps) {
  const px = size === "sm" ? 32 : 36;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO_SRC}
      alt=""
      width={px}
      height={px}
      aria-hidden
      draggable={false}
      className={cn(
        "brand-logo-mark",
        size === "sm" && "brand-logo-mark--sm",
        className
      )}
    />
  );
}

type BrandLogoProps = {
  size?: "sm" | "md";
  href?: string;
};

export function BrandLogo({ size = "md", href = "/" }: BrandLogoProps) {
  return (
    <Link href={href} className="brand-logo">
      <BrandMark size={size} />
      <span>Drishx</span>
    </Link>
  );
}

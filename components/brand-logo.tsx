import Link from "next/link";

type BrandLogoProps = {
  size?: "sm" | "md";
  href?: string;
};

export function BrandLogo({ size = "md", href = "/" }: BrandLogoProps) {
  const markClass =
    size === "sm" ? "brand-logo-mark brand-logo-mark--sm" : "brand-logo-mark";

  return (
    <Link href={href} className="brand-logo">
      <span className={markClass}>D</span>
      Drishx
    </Link>
  );
}

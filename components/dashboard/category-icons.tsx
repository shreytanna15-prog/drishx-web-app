import { cn } from "@/lib/utils";

export const HOME_CATEGORY_ICON_ACCENT: Record<string, string> = {
  singlevision: "#A78BFA",
  progressive: "#7C9CFF",
  kryptok: "#E8ECF4",
  rx: "#F0A132",
  color: "#F0A132",
  white: "#E8ECF4",
};

type IconProps = {
  color: string;
  size?: number;
  className?: string;
};

function SingleVisionIcon({ color, size = 40, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M8 22c0-3.5 2.8-6.5 6.5-6.5h5.5c1.8 0 3.4.9 4.4 2.3L26 20.5l1.6-2.7c1-1.4 2.6-2.3 4.4-2.3h5.5c3.7 0 6.5 3 6.5 6.5v1.2c0 3.2-2.6 5.8-5.8 5.8H29c-1.5 0-2.9-.7-3.8-1.9L24 26.5l-1.2 1.9c-.9 1.2-2.3 1.9-3.8 1.9h-5.2C10.6 30.3 8 27.7 8 24.5V22z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <circle cx="16.5" cy="23.5" r="4.2" stroke={color} strokeWidth={1.7} />
      <circle cx="31.5" cy="23.5" r="4.2" stroke={color} strokeWidth={1.7} />
    </svg>
  );
}

function ProgressiveIcon({ color, size = 40, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="24" cy="24" r="14" stroke={color} strokeWidth={1.7} />
      <circle cx="24" cy="24" r="9" stroke={color} strokeWidth={1.7} />
      <circle cx="24" cy="24" r="4" stroke={color} strokeWidth={1.7} />
    </svg>
  );
}

function KryptokIcon({ color, size = 40, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M24 8l12 4.5v10.2c0 7.4-4.8 14-12 16.8-7.2-2.8-12-9.4-12-16.8V12.5L24 8z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <path
        d="M24 18v10M19 23h10"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function RxIcon({ color, size = 40, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="7"
        y="16"
        width="14"
        height="12"
        rx="3"
        stroke={color}
        strokeWidth={2.2}
      />
      <rect
        x="27"
        y="16"
        width="14"
        height="12"
        rx="3"
        stroke={color}
        strokeWidth={2.2}
      />
      <path
        d="M21 21h6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ColorIcon({ color, size = 40, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="24" cy="24" r="11" stroke={color} strokeWidth={1.7} />
      <circle cx="24" cy="24" r="4.5" stroke={color} strokeWidth={1.7} />
      <line x1="24" y1="8" x2="24" y2="12" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <line x1="24" y1="36" x2="24" y2="40" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <line x1="8" y1="24" x2="12" y2="24" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <line x1="36" y1="24" x2="40" y2="24" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <line x1="12.7" y1="12.7" x2="15.5" y2="15.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <line x1="32.5" y1="32.5" x2="35.3" y2="35.3" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <line x1="35.3" y1="12.7" x2="32.5" y2="15.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <line x1="15.5" y1="32.5" x2="12.7" y2="35.3" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </svg>
  );
}

function WhiteIcon({ color, size = 40, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M10 20h10c1.7 0 3.2 1 3.9 2.5L26 27l2.1-4.5C28.8 21 30.3 20 32 20h6"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 20c0 4.4 3.1 8 7 8s7-3.6 7-8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <path
        d="M29 20c0 4.4 3.1 8 7 8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS = {
  singlevision: SingleVisionIcon,
  progressive: ProgressiveIcon,
  kryptok: KryptokIcon,
  rx: RxIcon,
  color: ColorIcon,
  white: WhiteIcon,
} as const;

export function HomeCategoryIcon({
  id,
  size = 40,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const color = HOME_CATEGORY_ICON_ACCENT[id] ?? "#F0A132";
  const Icon =
    ICONS[id as keyof typeof ICONS] ?? SingleVisionIcon;
  return <Icon color={color} size={size} className={cn(className)} />;
}

export function homeCategoryAccent(id: string): string {
  return HOME_CATEGORY_ICON_ACCENT[id] ?? "#F0A132";
}

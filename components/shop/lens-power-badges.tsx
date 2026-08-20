import { formatAddValue, formatAxisValue } from "@/lib/lens-display";
import { formatPowerLabel } from "@/lib/cart-utils";
import { cn } from "@/lib/utils";

type PowerBadgesItem = {
  sph?: number | null;
  cyl?: number | null;
  axis?: number | null;
  add?: number | null;
};

type LensPowerBadgesProps = {
  item: PowerBadgesItem;
  /** Include ADD badge (e.g. for Kryptok / Progressive). Default false. */
  showAdd?: boolean;
};

function PowerBadge({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact: boolean;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center rounded-md border border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-card)_60%,var(--brand-text)_6%)]",
        compact ? "px-1 py-1" : "px-2 py-1.5"
      )}
    >
      <span
        className={cn(
          "font-semibold uppercase text-[var(--brand-text-muted)]",
          compact
            ? "text-[7px] tracking-wide leading-none"
            : "text-[9px] tracking-widest leading-none"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "mt-0.5 w-full truncate text-center font-bold leading-tight text-[var(--brand-text)]",
          compact ? "text-[11px]" : "text-[13px]"
        )}
      >
        {value}
      </span>
    </span>
  );
}

export function LensPowerBadges({ item, showAdd = false }: LensPowerBadgesProps) {
  const compact = showAdd;
  const sphValue =
    item.sph != null && Math.abs(Number(item.sph)) > 1e-9
      ? formatPowerLabel(Number(item.sph))
      : "—";
  const cylValue =
    item.cyl != null && Math.abs(Number(item.cyl)) > 1e-9
      ? formatPowerLabel(Number(item.cyl))
      : "—";
  const axisValue = formatAxisValue(item.axis);

  return (
    <div className="mt-2 flex w-full flex-nowrap items-stretch gap-1.5">
      <PowerBadge label="SPH" value={sphValue} compact={compact} />
      <PowerBadge label="CYL" value={cylValue} compact={compact} />
      <PowerBadge label="AXIS" value={axisValue} compact={compact} />
      {showAdd ? (
        <PowerBadge label="ADD" value={formatAddValue(item.add)} compact={compact} />
      ) : null}
    </div>
  );
}

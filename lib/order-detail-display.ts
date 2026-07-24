import { getOrderLensDetails } from "@/lib/orders-api";
import {
  getOrderPowerDisplayLines,
  isRxOrder,
  type OrderPowerDisplayLine,
} from "@/lib/order-list-display";
import { pairsFromPieces } from "@/lib/order-quantity";
import {
  normalizeOrderStatus,
  type OrderTrackingStatus,
} from "@/lib/order-tracking";
import { formatProgressiveEyeLabel } from "@/lib/progressive-eye";
import type { OrderRecord } from "@/lib/types/orders";
import { formatLensType } from "@/lib/types/lens";

export type PickState = "full" | "partial" | "none" | "cancelled";

export type PowerLineRow = {
  orderId: string;
  orderIds?: string[];
  sphCylLabel: string;
  /** Preferred eye when set (e.g. LEFT / RIGHT), shown like cart. */
  eye?: string;
  addLabel: string;
  axisLabel: string;
  ordered: number;
  picked: number;
  pickState: PickState;
};

export type OrderProductSection = {
  key: string;
  title: string;
  subtitle: string;
  totalPairs: number;
  pickedPairs: number;
  lines: PowerLineRow[];
};

function normalizeLabelKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isGenericBrand(brand: string | null | undefined): boolean {
  const trimmed = brand?.trim() ?? "";
  return !trimmed || trimmed.toLowerCase() === "lens";
}

/** Strip a leading lens-type prefix from item names like "single vision hard coat". */
function stripLeadingLensType(text: string, lensTypeLabel: string): string {
  const trimmed = text.trim();
  if (!trimmed || !lensTypeLabel.trim()) return trimmed;
  const lensKey = normalizeLabelKey(lensTypeLabel);
  const textKey = normalizeLabelKey(trimmed);
  if (!textKey.startsWith(lensKey) || textKey === lensKey) {
    return trimmed;
  }
  const withoutPrefix = trimmed
    .replace(
      new RegExp(
        `^${lensTypeLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[·\\-:,]*\\s*`,
        "i"
      ),
      ""
    )
    .trim();
  return withoutPrefix || trimmed;
}

function uniqueJoinParts(
  parts: (string | null | undefined)[],
  exclude: (string | null | undefined)[] = []
): string {
  const excluded = new Set(
    exclude
      .map((part) => part?.trim())
      .filter(Boolean)
      .map((part) => normalizeLabelKey(part as string))
  );
  const seen = new Set<string>();
  const out: string[] = [];

  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) continue;
    const key = normalizeLabelKey(trimmed);
    if (!key || excluded.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out.join(" · ");
}

function buildLensProductMeta(input: {
  key: string;
  lensTypeLabel: string;
  brand?: string | null;
  item?: string | null;
  coating?: string | null;
  category?: string | null;
  titleFallback?: string | null;
}): { key: string; title: string; subtitle: string } {
  const lensLabel = input.lensTypeLabel;
  const brand = input.brand?.trim() ?? "";
  const title =
    (!isGenericBrand(brand) ? brand : null) ||
    input.titleFallback?.trim() ||
    lensLabel;

  const cleanedItem = stripLeadingLensType(input.item?.trim() ?? "", lensLabel);
  const coating = input.coating?.trim() ?? "";
  const category = input.category?.trim() ?? "";

  const subtitle =
    uniqueJoinParts([cleanedItem, coating, category], [title, lensLabel, brand]) ||
    (title === lensLabel ? "" : lensLabel);

  return {
    key: input.key,
    title,
    subtitle: subtitle || (title === lensLabel ? "" : lensLabel),
  };
}

function getProductMeta(order: OrderRecord): {
  key: string;
  title: string;
  subtitle: string;
} {
  const lensLabel = formatLensType(order.lensType);

  if (order.singleVisionLens?.id) {
    const lens = order.singleVisionLens;
    return buildLensProductMeta({
      key: `sv-${lens.id}`,
      lensTypeLabel: lensLabel,
      brand: lens.brand,
      item: lens.item,
      coating: lens.coating,
      category: lens.category,
    });
  }

  if (order.kryptokLens?.id) {
    const lens = order.kryptokLens;
    return buildLensProductMeta({
      key: `kr-${lens.id}`,
      lensTypeLabel: lensLabel,
      brand: lens.brand,
      coating: lens.coating,
      category: lens.category,
    });
  }

  if (order.progressiveLens?.id) {
    const lens = order.progressiveLens;
    return buildLensProductMeta({
      key: `pr-${lens.id}`,
      lensTypeLabel: lensLabel,
      brand: lens.brand,
      item: lens.item,
      coating: lens.coating,
      category: lens.category,
      titleFallback: lens.item,
    });
  }

  if (isRxOrder(order)) {
    const productName = order.notes
      ?.split("\n")
      .find((line) => line.startsWith("Product name: "))
      ?.slice("Product name: ".length)
      .trim();
    const feature = order.notes
      ?.split("\n")
      .find((line) => line.startsWith("Feature: "))
      ?.slice("Feature: ".length)
      .trim();

    const title = productName || `${lensLabel} RX`;
    return {
      key: `rx-${order.id}`,
      title,
      subtitle:
        uniqueJoinParts([feature, "Custom RX order"], [title, lensLabel]) ||
        "Custom RX order",
    };
  }

  return {
    key: `order-${order.id}`,
    title: lensLabel,
    subtitle: "",
  };
}

function normalizePowerValue(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return String(value);
  }
  const rounded = Math.round(num * 100) / 100;
  const fixed = rounded.toFixed(2);
  if (rounded === 0) {
    return "0";
  }
  if (fixed.endsWith(".00")) {
    return String(Math.trunc(rounded));
  }
  if (fixed.endsWith("0")) {
    return fixed.slice(0, -1);
  }
  return fixed;
}

function formatAxisDisplay(axis: number | null | undefined): string {
  if (axis === null || axis === undefined) {
    return "—";
  }
  const rounded = Math.round(axis);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function formatSphCylOnly(line: OrderPowerDisplayLine): string {
  const sph = normalizePowerValue(line.sph);
  const cyl = normalizePowerValue(line.cyl);
  if (sph === "—" && cyl === "—") {
    return "Plano";
  }
  return `${sph} / ${cyl}`;
}

function formatAddLabel(line: OrderPowerDisplayLine): string {
  const showAdd =
    line.order.lensType === "KRYPTOK" || line.order.lensType === "PROGRESSIVE";
  if (!showAdd) {
    return "—";
  }

  if (line.add === null || line.add === undefined) {
    return "—";
  }

  return normalizePowerValue(line.add);
}

function formatAxisLabel(line: OrderPowerDisplayLine): string {
  if (line.axis === null || line.axis === undefined) {
    return "—";
  }

  return formatAxisDisplay(line.axis);
}

function formatEyeLabel(order: OrderRecord): string | undefined {
  const details = getOrderLensDetails(order);
  return formatProgressiveEyeLabel(details?.eye ?? order.eye);
}

function powerLineMergeKey(
  line: Pick<PowerLineRow, "sphCylLabel" | "addLabel" | "axisLabel" | "eye">
): string {
  return `${line.sphCylLabel}|${line.addLabel}|${line.axisLabel}|${line.eye ?? ""}`;
}

function buildPowerLineRow(
  line: OrderPowerDisplayLine,
  pick: { ordered: number; picked: number; pickState: PickState }
): PowerLineRow {
  return {
    orderId: line.order.id,
    sphCylLabel: formatSphCylOnly(line),
    eye: formatEyeLabel(line.order),
    addLabel: formatAddLabel(line),
    axisLabel: formatAxisLabel(line),
    ordered: pick.ordered,
    picked: pick.picked,
    pickState: pick.pickState,
  };
}

export function getLinePickInfo(order: OrderRecord): {
  ordered: number;
  picked: number;
  pickState: PickState;
} {
  const status = normalizeOrderStatus(order.status);
  const ordered = Math.max(1, Number(order.quantity) || 1);
  const pickedFromOrder =
    typeof order.pickedQuantity === "number" &&
    Number.isFinite(order.pickedQuantity)
      ? Math.max(0, Math.min(ordered, Math.floor(order.pickedQuantity)))
      : null;

  if (status === "CANCELLED") {
    return { ordered, picked: 0, pickState: "cancelled" };
  }

  if (pickedFromOrder !== null && pickedFromOrder > 0) {
    if (pickedFromOrder >= ordered) {
      return { ordered, picked: ordered, pickState: "full" };
    }
    return { ordered, picked: pickedFromOrder, pickState: "partial" };
  }

  if (
    status === "COMPLETED" ||
    status === "DISPATCHED" ||
    status === "PACKED"
  ) {
    return { ordered, picked: ordered, pickState: "full" };
  }

  if (status === "PARTIALLY_FULFILLED") {
    const picked = Math.max(0, ordered - 1);
    return {
      ordered,
      picked,
      pickState: picked > 0 && picked < ordered ? "partial" : "partial",
    };
  }

  if (status === "PICKING") {
    return { ordered, picked: 0, pickState: "partial" };
  }

  return { ordered, picked: 0, pickState: "none" };
}

function getPowerLinePickInfo(
  order: OrderRecord,
  lineQuantity: number
): { ordered: number; picked: number; pickState: PickState } {
  const orderPick = getLinePickInfo(order);
  const ordered = Math.max(1, Number(lineQuantity) || 1);

  // Wholesale parent pick state is order-level; scale proportionally when known.
  if (orderPick.pickState === "cancelled") {
    return { ordered, picked: 0, pickState: "cancelled" };
  }
  if (orderPick.pickState === "full") {
    return { ordered, picked: ordered, pickState: "full" };
  }
  if (orderPick.pickState === "none") {
    return { ordered, picked: 0, pickState: "none" };
  }

  const orderOrdered = Math.max(1, orderPick.ordered);
  const ratio = orderPick.picked / orderOrdered;
  const picked = Math.max(
    0,
    Math.min(ordered, Math.round(ordered * ratio))
  );
  return {
    ordered,
    picked,
    pickState: derivePickState(ordered, picked, false),
  };
}

function derivePickState(
  ordered: number,
  picked: number,
  allCancelled: boolean
): PickState {
  if (allCancelled) {
    return "cancelled";
  }
  if (picked >= ordered) {
    return "full";
  }
  if (picked > 0) {
    return "partial";
  }
  return "none";
}

function mergePowerLines(lines: PowerLineRow[]): PowerLineRow[] {
  const merged = new Map<
    string,
    PowerLineRow & { orderIds: string[]; cancelledLines: number }
  >();

  for (const line of lines) {
    const mergeKey = powerLineMergeKey(line);
    const existing = merged.get(mergeKey);
    if (!existing) {
      merged.set(mergeKey, {
        ...line,
        orderIds: [line.orderId],
        cancelledLines: line.pickState === "cancelled" ? 1 : 0,
      });
      continue;
    }

    existing.ordered += line.ordered;
    existing.picked += line.picked;
    existing.orderIds.push(line.orderId);
    if (line.pickState === "cancelled") {
      existing.cancelledLines += 1;
    }
    existing.pickState = derivePickState(
      existing.ordered,
      existing.picked,
      existing.cancelledLines === existing.orderIds.length
    );
  }

  return [...merged.values()]
    .map(({ orderIds, cancelledLines: _cancelledLines, ...line }) => ({
      ...line,
      orderIds,
    }))
    .sort((a, b) => powerLineMergeKey(a).localeCompare(powerLineMergeKey(b)));
}

export function buildOrderProductSections(
  orders: OrderRecord[]
): OrderProductSection[] {
  const sections = new Map<string, OrderProductSection>();

  for (const order of orders) {
    const meta = getProductMeta(order);
    const powerLines = getOrderPowerDisplayLines(order);

    for (const powerLine of powerLines) {
      const pick = getPowerLinePickInfo(order, powerLine.quantity);
      const line = buildPowerLineRow(powerLine, pick);

      const existing = sections.get(meta.key);
      if (existing) {
        existing.lines.push(line);
        existing.totalPairs += pairsFromPieces(pick.ordered);
        existing.pickedPairs += pairsFromPieces(pick.picked);
        continue;
      }

      sections.set(meta.key, {
        key: meta.key,
        title: meta.title,
        subtitle: meta.subtitle,
        totalPairs: pairsFromPieces(pick.ordered),
        pickedPairs: pairsFromPieces(pick.picked),
        lines: [line],
      });
    }
  }

  return [...sections.values()].map((section) => ({
    ...section,
    lines: mergePowerLines(section.lines),
  }));
}

const STATUS_RANK: Record<OrderTrackingStatus, number> = {
  AWAITING_PROCUREMENT: 0,
  PENDING: 1,
  PARTIALLY_FULFILLED: 2,
  PICKING: 3,
  PACKED: 4,
  DISPATCHED: 5,
  COMPLETED: 6,
  CANCELLED: -1,
};

export function getBatchTrackingStatus(
  orders: OrderRecord[]
): OrderTrackingStatus {
  const active = orders.filter(
    (order) => normalizeOrderStatus(order.status) !== "CANCELLED"
  );
  if (active.length === 0) {
    return "CANCELLED";
  }

  let slowest: OrderTrackingStatus = normalizeOrderStatus(active[0].status);
  let slowestRank = STATUS_RANK[slowest];

  for (const order of active) {
    const status = normalizeOrderStatus(order.status);
    const rank = STATUS_RANK[status];
    if (rank < slowestRank) {
      slowest = status;
      slowestRank = rank;
    }
  }

  return slowest;
}
